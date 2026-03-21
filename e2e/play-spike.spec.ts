import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

const e2eDir = path.dirname(fileURLToPath(import.meta.url));

/** Default: GPL-2.0 homebrew bin committed under `e2e/fixtures/`. Override to e.g. a local VS rip. */
function resolveDiscBin(): string {
  const fromEnv = process.env.E2E_PS1_DISC_BIN;
  if (fromEnv && existsSync(fromEnv)) {
    return fromEnv;
  }
  return path.join(e2eDir, "fixtures", "240pTestSuitePS1-EMU.bin");
}

/**
 * Smoke test only: no disc images or BIOS in CI. We assert the spike route loads
 * WASMpsx assets and the host becomes ready (same bar as "works in browser").
 */
test.describe("/play/spike — WASMpsx smoke", () => {
  test("page loads, emulator bundle initializes, file input enables", async ({ page }) => {
    test.setTimeout(120_000);

    const wasmMain = page.waitForResponse(
      (res) => res.url().includes("/wasmpsx/wasmpsx_ww.wasm") && res.status() === 200,
    );

    await page.goto("/play/spike");

    await expect(
      page.getByRole("heading", { name: /Playable spike — WASM PS1/i }),
    ).toBeVisible();

    await wasmMain;

    await expect(page.locator("wasmpsx-player#rb-wasmpsx-player")).toBeVisible({
      timeout: 60_000,
    });

    await expect(page.getByText(/WASMpsx loaded/i)).toBeVisible({
      timeout: 90_000,
    });

    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeEnabled({ timeout: 5_000 });
  });
});

/**
 * Loads a real single-track `.bin` and asserts WASMpsx gets past CD-ROM init (no
 * `Could not load CD-ROM!`). Uses a redistributable GPL fixture by default; set
 * `E2E_PS1_DISC_BIN` to point at another file (e.g. Vagrant Story) locally.
 */
test.describe("/play/spike — disc image integration", () => {
  test("loads .bin; emulator reports disc loaded (not CD-ROM failure)", async ({ page }) => {
    test.setTimeout(180_000);

    const bin = resolveDiscBin();
    test.skip(!existsSync(bin), `Missing disc fixture: ${bin}`);

    const scriptLogs: string[] = [];
    page.on("console", (msg) => {
      scriptLogs.push(msg.text());
    });

    const wasmMain = page.waitForResponse(
      (res) => res.url().includes("/wasmpsx/wasmpsx_ww.wasm") && res.status() === 200,
    );

    await page.goto("/play/spike");
    await wasmMain;

    await expect(page.getByText(/WASMpsx loaded/i)).toBeVisible({
      timeout: 90_000,
    });

    await page.locator('input[type="file"]').setInputFiles(bin);

    await expect
      .poll(
        () => {
          const blob = scriptLogs.join("\n");
          const loaded =
            blob.includes("readfile and run") &&
            blob.includes("loaded") &&
            blob.includes("Loaded CD Image:");
          const cdFailed = blob.includes("Could not load CD-ROM!");
          return loaded && !cdFailed;
        },
        { timeout: 120_000, intervals: [250] },
      )
      .toBe(true);
  });
});
