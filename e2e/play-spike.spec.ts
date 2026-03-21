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
  test("page loads iframe and emulator shell is ready", async ({ page }) => {
    test.setTimeout(120_000);

    const shellResponse = page.waitForResponse(
      (res) => res.url().includes("/playstation/PlayStation.htm") && res.status() === 200,
    );

    await page.goto("/play/spike");

    await expect(
      page.getByRole("heading", { name: /Playable spike — browser PS1/i }),
    ).toBeVisible();

    await shellResponse;

    await expect(page.locator('iframe[title="PlayStation emulator"]')).toBeVisible({
      timeout: 30_000,
    });

    await expect(page.getByText(/Ready — use the red Upload/i)).toBeVisible({
      timeout: 60_000,
    });

    const frame = page.frameLocator('iframe[title="PlayStation emulator"]');
    await expect(frame.locator("#gui_controls_file")).toBeAttached({
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

    await expect(page.getByText(/Ready — use the red Upload/i)).toBeVisible({
      timeout: 90_000,
    });

    const frame = page.frameLocator('iframe[title="PlayStation emulator"]');
    await frame.locator("#gui_controls_file").setInputFiles(bin);

    await expect(frame.locator("#rb-playstation-host canvas")).toBeVisible({
      timeout: 120_000,
    });
  });
});
