/**
 * RSK-preload: dev-server preloader — ?preload=1 boots the emulator and
 * restores the save state without any manual file-picker interaction.
 *
 * Requires:
 *   PRELOAD_PS1_DISC_BIN     — set in .env (path to Vagrant Story NTSC-U .bin)
 *   PRELOAD_PS1_SAVE_STATE   — set in .env (optional, but tested here)
 */

import { expect, test } from "@playwright/test";

test.describe("preload feature — ?preload=1", () => {
  test("disc loads automatically and save state is restored", async ({ page }) => {
    test.setTimeout(240_000);

    // ── Verify the preload endpoints are reachable ─────────────────────────────
    const discRes = await page.request.get("/api/v1/preload/disc");
    const discContentType = discRes.headers()["content-type"] ?? "";
    const preloadDiscAvailable =
      discRes.status() === 200 && discContentType.includes("application/octet-stream");
    test.skip(
      !preloadDiscAvailable,
      "PRELOAD_PS1_DISC_BIN not configured — set it in .env",
    );
    expect(discRes.status()).toBe(200);
    expect(discContentType).toContain("application/octet-stream");

    // ── Open emulator with ?preload=1 ─────────────────────────────────────────
    await page.goto("/pcsx-wasm/index.html?riskbreaker=1&preload=1");

    // The injected script should fire the iso_opener change event automatically.
    // Wait for the emulator to become active (same signal used in other tests).
    await page.waitForFunction(
      "document.body.classList.contains('pcsx-game-active')",
      null,
      { timeout: 120_000 },
    );
    await expect(page.locator("canvas#canvas")).toBeVisible({ timeout: 10_000 });

    // Give the preload script time to fetch and apply the save state.
    // The script loads the state 500ms after pcsx-game-active fires, then
    // the worker needs a tick to apply it — 3s total is generous enough.
    await page.waitForTimeout(3_000);

    // ── If a save state is configured, verify the state endpoint was reachable ─
    const stateRes = await page.request.get("/api/v1/preload/savestate");
    if (stateRes.status() === 200) {
      // Open the VS overlay (backtick) and refresh the VS panel to confirm
      // live RAM is readable with the restored state (HP > 0).
      await page.locator("canvas#canvas").click();
      await page.keyboard.press("Backquote");

      const overlay = page.locator("#rb-riskbreaker-overlay");
      await expect(overlay).toBeVisible({ timeout: 5_000 });

      const panelHeading = overlay.locator("[data-panel-id='vagrant-story-items']");
      await expect(panelHeading).toBeVisible({ timeout: 10_000 });
      await panelHeading.getByRole("button", { name: "↻" }).click();

      const panelRows = overlay.locator("[data-panel-rows='vagrant-story-items']");
      const hpValue = panelRows.locator("[data-row-value='HP']");
      await expect(hpValue).toBeVisible({ timeout: 10_000 });
      await expect(hpValue).not.toHaveText("0 / 0");
    }
  });
});
