import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

const e2eDir = path.dirname(fileURLToPath(import.meta.url));

/** Default: GPL-2.0 homebrew bin under `e2e/fixtures/`. Override via `E2E_PS1_DISC_BIN`. */
function resolveDiscBin(): string {
  const fromEnv = process.env.E2E_PS1_DISC_BIN;
  if (fromEnv && existsSync(fromEnv)) {
    return fromEnv;
  }
  return path.join(e2eDir, "fixtures", "240pTestSuitePS1-EMU.bin");
}

test.describe("/play/spike — lrusso/PlayStation smoke", () => {
  test("redirects to full-page emulator and shell is ready", async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto("/play/spike");

    await page.waitForURL(/\/playstation\/PlayStation\.htm\?riskbreaker=1/, {
      timeout: 30_000,
    });

    await expect(page.getByRole("link", { name: /Mock shell/i })).toBeVisible();

    await expect(page.locator("#gui_controls_file")).toBeAttached({
      timeout: 10_000,
    });
  });
});

test.describe("/play/spike — disc image integration", () => {
  test("loads .bin; canvas appears in emulator (CD layer ok)", async ({ page }) => {
    test.setTimeout(180_000);

    const bin = resolveDiscBin();
    test.skip(!existsSync(bin), `Missing disc fixture: ${bin}`);

    await page.goto("/play/spike");
    await page.waitForURL(/\/playstation\/PlayStation\.htm/, { timeout: 30_000 });

    await page.locator("#gui_controls_file").setInputFiles(bin);

    await expect(page.locator("#rb-playstation-host canvas")).toBeVisible({
      timeout: 120_000,
    });
  });
});
