import { expect, test } from "@playwright/test";

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
