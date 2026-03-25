/**
 * RSK-vs-menu: VS overlay menu — open/close via `f` key with pause/resume.
 *
 * Requires:
 *   E2E_PS1_DISC_BIN  — path to Vagrant Story NTSC-U .bin
 *   VS_SAVE_STATE     — path to .state fixture (default: repo root vs-save-*.state)
 */

import { existsSync } from "node:fs";
import * as fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function resolveDiscBin(): string {
  const fromEnv = process.env.E2E_PS1_DISC_BIN;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
  return "";
}

const VS_FIXTURES_DIR = path.join(repoRoot, "plugins", "vagrant-story", "e2e", "fixtures");

function resolveStatePath(): string {
  const fromEnv = process.env.VS_SAVE_STATE;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
  const files = fs
    .readdirSync(VS_FIXTURES_DIR)
    .filter((f) => f.startsWith("vs-save-") && f.endsWith(".state"))
    .sort();
  if (files.length > 0) return path.join(VS_FIXTURES_DIR, files[files.length - 1]);
  return "";
}

async function waitForPcsxGameActive(page: Page) {
  await page.waitForFunction(
    "document.body.classList.contains('pcsx-game-active')",
    null,
    { timeout: 120_000 },
  );
}

async function loadStateFile(page: Page, statePath: string): Promise<void> {
  const bytes = Array.from(fs.readFileSync(statePath));
  await page.evaluate(async (bytes: number[]) => {
    const g = globalThis as { __riskbreakerLoadState?: (b: Uint8Array) => Promise<void> };
    if (!g.__riskbreakerLoadState) throw new Error("__riskbreakerLoadState not available");
    await g.__riskbreakerLoadState(new Uint8Array(bytes));
  }, bytes);
}

test.describe("VS overlay menu — f key open/close with pause/resume", () => {
  test("f key opens menu (pause) and closes menu (resume)", async ({ page }) => {
    test.setTimeout(240_000);

    const bin = resolveDiscBin();
    const statePath = resolveStatePath();

    test.skip(!bin, "Missing E2E_PS1_DISC_BIN — set env var to Vagrant Story NTSC-U .bin");
    test.skip(!statePath, "Missing VS save state — place vs-save-*.state in repo root or set VS_SAVE_STATE");

    await page.goto("/play/spike");
    await page.waitForURL(/\/pcsx-wasm\/index\.html/, { timeout: 30_000 });

    // Load the disc
    await page.locator("#iso_opener").setInputFiles(bin);
    await waitForPcsxGameActive(page);
    await expect(page.locator("canvas#canvas")).toBeVisible({ timeout: 120_000 });

    // Load save state
    await loadStateFile(page, statePath);
    await page.waitForTimeout(500);

    // Install worker-ack listener to track actual emulator pause/resume state
    await page.evaluate(() => {
      const g = globalThis as Record<string, any>;
      g.__emulatorPaused = false;
      g.__soundFrames = 0;
      const worker = g.__riskbreakerPcsxWorker as Worker;
      worker.addEventListener("message", (e: MessageEvent) => {
        if (e.data?.cmd === "pause_ack")          g.__emulatorPaused = true;
        if (e.data?.cmd === "resume_ack")         g.__emulatorPaused = false;
        if (e.data?.cmd === "SoundFeedStreamData") g.__soundFrames++;
      });
    });

    // Click canvas to focus, press 'f' → menu opens and emulator pauses
    await page.locator("canvas#canvas").click();
    await page.keyboard.press("f");
    const menu = page.locator("#vs-menu-root");
    await expect(menu).toHaveClass(/vs-open/);
    await page.waitForFunction(() => (globalThis as Record<string, any>).__emulatorPaused === true, null, { timeout: 2000 });

    // Press 'f' again → menu closes and emulator resumes (verify via sound frames)
    await page.keyboard.press("f");
    await expect(menu).not.toHaveClass(/vs-open/);
    await page.waitForFunction(() => (globalThis as Record<string, any>).__emulatorPaused === false, null, { timeout: 2000 });
    const framesAfterResume = await page.evaluate(() => (globalThis as Record<string, any>).__soundFrames);
    await page.waitForFunction(
      (baseline: number) => (globalThis as Record<string, any>).__soundFrames > baseline + 5,
      framesAfterResume,
      { timeout: 3000 },
    );

    // Repeated keydown while menu is closed must NOT re-open or re-pause
    await page.evaluate(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "f", repeat: true, bubbles: true }));
    });
    await expect(menu).not.toHaveClass(/vs-open/);
    expect(await page.evaluate(() => (globalThis as Record<string, any>).__emulatorPaused)).toBe(false);

    // Open again, then repeated keydown while open must NOT close or resume
    await page.keyboard.press("f");
    await expect(menu).toHaveClass(/vs-open/);
    await page.waitForFunction(() => (globalThis as Record<string, any>).__emulatorPaused === true, null, { timeout: 2000 });
    await page.evaluate(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "f", repeat: true, bubbles: true }));
    });
    await expect(menu).toHaveClass(/vs-open/);
    expect(await page.evaluate(() => (globalThis as Record<string, any>).__emulatorPaused)).toBe(true);
  });
});
