/**
 * PSX RAM API — Playwright integration tests.
 *
 * Loads the pcsx-wasm shell page (using the GPL homebrew 240p Test Suite fixture)
 * so the browser establishes an SSE subscriber, then exercises the
 * PCSX-Redux-compatible REST endpoints via the Playwright request API.
 *
 * Override the disc with E2E_PS1_DISC_BIN if needed.
 */

import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const e2eDir = path.dirname(fileURLToPath(import.meta.url));

function resolveDiscBin(): string {
  const fromEnv = process.env.E2E_PS1_DISC_BIN;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
  const fixture = path.join(e2eDir, "fixtures", "240pTestSuitePS1-EMU.bin");
  return existsSync(fixture) ? fixture : "";
}

async function waitForPcsxGameActive(page: Page) {
  await page.waitForFunction(
    "document.body.classList.contains('pcsx-game-active')",
    null,
    { timeout: 120_000 },
  );
}

/** Load the emulator and wait for the disc to be running AND the SSE subscriber to register. */
async function bootDisc(page: Page) {
  const bin = resolveDiscBin();
  if (!bin) throw new Error("No disc fixture found — place 240pTestSuitePS1-EMU.bin in e2e/fixtures/ or set E2E_PS1_DISC_BIN");
  await page.goto("/play/spike");
  await page.waitForURL(/\/pcsx-wasm\/index\.html/, { timeout: 30_000 });
  await page.locator("#iso_opener").setInputFiles(bin);
  await waitForPcsxGameActive(page);

  // Wait until the SSE connection from this page is confirmed open by the server.
  // Polls /api/v1/debug until subscribers > 0.  The SSE connects at page load so this
  // usually resolves in one poll, but is necessary when disc + assets are fully cached
  // (pcsx-game-active can fire in < 200ms, before the SSE TCP handshake completes).
  await page.waitForFunction(async () => {
    try {
      const r = await fetch("/api/v1/debug");
      const d = await r.json() as { subscribers: number };
      return d.subscribers > 0;
    } catch { return false; }
  }, null, { timeout: 15_000, polling: 200 });
}

test.describe.configure({ mode: "serial" });

test.describe("PSX RAM API — live emulator endpoints", () => {
  test.setTimeout(180_000);

  test("GET /api/v1/cpu/ram/raw returns 2 MB binary", async ({ page, request }) => {
    await bootDisc(page);

    const res = await request.get("/api/v1/cpu/ram/raw");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/octet-stream");
    const body = await res.body();
    expect(body.length).toBe(2 * 1024 * 1024);
  });

  test("POST /api/v1/cpu/ram/raw writes bytes to RAM and reads them back", async ({ page, request }) => {
    await bootDisc(page);

    // Write a known sentinel to the very end of RAM (last 4 bytes) — the game never touches this region.
    const sentinel = Buffer.from([0xde, 0xad, 0xbe, 0xef]);
    const writeRes = await request.post(`/api/v1/cpu/ram/raw?offset=${0x1ffffc}`, {
      data: sentinel,
      headers: { "Content-Type": "application/octet-stream" },
    });
    expect(writeRes.status()).toBe(200);
    const writeJson = await writeRes.json() as { ok: boolean };
    expect(writeJson.ok).toBe(true);

    // Read back full RAM and verify the sentinel is there
    const readRes = await request.get("/api/v1/cpu/ram/raw");
    expect(readRes.status()).toBe(200);
    const ram = await readRes.body();
    expect(ram[0x1ffffc]).toBe(0xde);
    expect(ram[0x1ffffd]).toBe(0xad);
    expect(ram[0x1ffffe]).toBe(0xbe);
    expect(ram[0x1fffff]).toBe(0xef);
  });

  test("GET /api/v1/gpu/vram/raw returns 1 MB VRAM binary", async ({ page, request }) => {
    await bootDisc(page);

    const res = await request.get("/api/v1/gpu/vram/raw");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/octet-stream");
    const body = await res.body();
    // 1024 × 512 × 2 bytes (16bpp)
    expect(body.length).toBe(1024 * 512 * 2);
  });

  test("GET /api/v1/execution-flow returns status field", async ({ page, request }) => {
    await bootDisc(page);

    const res = await request.get("/api/v1/execution-flow");
    expect(res.status()).toBe(200);
    const json = await res.json() as { status: string };
    expect(["running", "paused"]).toContain(json.status);
  });

  test("POST /api/v1/execution-flow pause/resume round-trip", async ({ page, request }) => {
    await bootDisc(page);

    const pause = await request.post("/api/v1/execution-flow?function=pause");
    expect(pause.status()).toBe(200);
    const pauseJson = await pause.json() as { ok: boolean; action: string };
    expect(pauseJson.ok).toBe(true);
    expect(pauseJson.action).toBe("pause");

    const status = await request.get("/api/v1/execution-flow");
    expect((await status.json() as { status: string }).status).toBe("paused");

    const resume = await request.post("/api/v1/execution-flow?function=resume");
    expect(resume.status()).toBe(200);
    const resumeJson = await resume.json() as { ok: boolean; action: string };
    expect(resumeJson.ok).toBe(true);
    expect(resumeJson.action).toBe("resume");
  });
});
