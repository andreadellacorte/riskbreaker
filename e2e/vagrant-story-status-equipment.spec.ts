/**
 * RSK-vs-status-equip: VS status + equipment screens via ?preload=1
 *
 * Boots the emulator with the preload path and asserts concrete values from
 * Ashley's starting gear in the 2026-03-24 save state.
 *
 * Requires:
 *   PRELOAD_PS1_DISC_BIN   — set in .env (path to Vagrant Story NTSC-U .bin)
 *   PRELOAD_PS1_SAVE_STATE — set in .env (path to .state fixture)
 *
 * Ground-truth from vs-save-2026-03-24T13-36-04.state:
 *   HP 250/250  MP 50/50  RISK 0%  Condition: Good
 *   WEAPON    — Fandango       (Bronze, Edged/One-Handed, Range)
 *   SHIELD    — —              (unequipped)
 *   R.ARM     — Bandage        (Leather)
 *   L.ARM     — Bandage        (Leather)
 *   HEAD      — Bandana        (Leather)
 *   BODY      — Jerkin         (Leather)
 *   LEGS      — Sandals        (Leather)
 *   ACCESSORY — Rood Necklace
 */

import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const PRELOAD_SKIP_MESSAGE = "PRELOAD_PS1_DISC_BIN not configured — set it in .env";

function isBinaryPreloadResponse(status: number, contentType: string | undefined): boolean {
  return status === 200 && (contentType ?? "").includes("application/octet-stream");
}

async function bootPreload(page: Page): Promise<boolean> {
  const discRes = await page.request.get("/api/v1/preload/disc");
  if (!isBinaryPreloadResponse(discRes.status(), discRes.headers()["content-type"])) {
    return false;
  }

  await page.goto("/pcsx-wasm/index.html?riskbreaker=1&preload=1");
  await page.waitForFunction(
    "document.body.classList.contains('pcsx-game-active')",
    null,
    { timeout: 120_000 },
  );
  await expect(page.locator("canvas#canvas")).toBeVisible({ timeout: 10_000 });

  // Preload script applies state 500ms after pcsx-game-active; give worker a tick.
  // Use 8s when multiple tests boot simultaneously — concurrent workers race.
  await page.waitForTimeout(8_000);
  return true;
}

test.describe("VS status — preload", () => {
  test("Ashley tab HP/MP/Risk/condition match save state", async ({ page }) => {
    test.setTimeout(240_000);

    const discRes = await page.request.get("/api/v1/preload/disc");
    test.skip(
      !isBinaryPreloadResponse(discRes.status(), discRes.headers()["content-type"]),
      PRELOAD_SKIP_MESSAGE,
    );

    const booted = await bootPreload(page);
    test.skip(!booted, PRELOAD_SKIP_MESSAGE);

    // ── Open VS menu (f key) ───────────────────────────────────────────────────
    await page.locator("canvas#canvas").click();
    await page.keyboard.press("f");

    const menu = page.locator("#vs-menu-root");
    await expect(menu).toHaveClass(/vs-open/, { timeout: 5_000 });

    // ── Ashley status screen ───────────────────────────────────────────────────
    const screen = menu.locator(".vs-screen[data-screen='ashley']");
    await expect(screen).toHaveClass(/active/, { timeout: 5_000 });

    await expect(screen.locator("#vs-hp-val")).toHaveText("250 • 250");
    await expect(screen.locator("#vs-mp-val")).toHaveText("50 • 50");
    await expect(screen.locator("#vs-risk-val")).toHaveText("0%");
    await expect(screen.locator("#vs-condition")).toHaveText("Good");
  });
});

test.describe("VS equipment — preload", () => {
  test("slot names match Ashley's starting gear", async ({ page }) => {
    test.setTimeout(240_000);

    const discRes = await page.request.get("/api/v1/preload/disc");
    test.skip(
      !isBinaryPreloadResponse(discRes.status(), discRes.headers()["content-type"]),
      PRELOAD_SKIP_MESSAGE,
    );

    const booted = await bootPreload(page);
    test.skip(!booted, PRELOAD_SKIP_MESSAGE);

    // ── Open VS menu and navigate to Equipment tab ─────────────────────────────
    await page.locator("canvas#canvas").click();
    await page.keyboard.press("f");

    const menu = page.locator("#vs-menu-root");
    await expect(menu).toHaveClass(/vs-open/, { timeout: 5_000 });

    await menu.locator("[data-tab='equipment']").click();

    const screen = menu.locator(".vs-screen[data-screen='equipment']");
    await expect(screen).toHaveClass(/active/, { timeout: 5_000 });

    // Wait for RAM to populate
    await expect(screen.locator("[data-slot-name='weapon']"))
      .not.toHaveText("—", { timeout: 10_000 });

    // ── Slot assertions ────────────────────────────────────────────────────────
    await expect(screen.locator("[data-slot-name='weapon']")).toHaveText("Fandango");
    await expect(screen.locator("[data-slot-name='shield']")).toHaveText("—");
    await expect(screen.locator("[data-slot-name='armRight']")).toHaveText("Bandage");
    await expect(screen.locator("[data-slot-name='armLeft']")).toHaveText("Bandage");
    await expect(screen.locator("[data-slot-name='helm']")).toHaveText("Bandana");
    await expect(screen.locator("[data-slot-name='breastplate']")).toHaveText("Jerkin");
    await expect(screen.locator("[data-slot-name='leggings']")).toHaveText("Sandals");
    await expect(screen.locator("[data-slot-name='accessory']")).toHaveText("Rood Necklace");
  });

  test("weapon detail panel shows Fandango (Bronze, one-handed, range)", async ({ page }) => {
    test.setTimeout(240_000);

    const discRes = await page.request.get("/api/v1/preload/disc");
    test.skip(
      !isBinaryPreloadResponse(discRes.status(), discRes.headers()["content-type"]),
      PRELOAD_SKIP_MESSAGE,
    );

    const booted = await bootPreload(page);
    test.skip(!booted, PRELOAD_SKIP_MESSAGE);

    await page.locator("canvas#canvas").click();
    await page.keyboard.press("f");

    const menu = page.locator("#vs-menu-root");
    await expect(menu).toHaveClass(/vs-open/, { timeout: 5_000 });

    await menu.locator("[data-tab='equipment']").click();

    const screen = menu.locator(".vs-screen[data-screen='equipment']");
    await expect(screen).toHaveClass(/active/, { timeout: 5_000 });

    await expect(screen.locator("[data-slot-name='weapon']"))
      .not.toHaveText("—", { timeout: 10_000 });

    await screen.locator(".vs-eq-slot-row[data-slot='weapon']").click();

    // Detail panel follows focused slot — select weapon row explicitly for stable UX.
    await expect(screen.locator("#vs-eq-detail-name")).toHaveText("Fandango");
    await expect(screen.locator("#vs-eq-detail-sub")).toContainText("Bronze");
    await expect(screen.locator("#vs-eq-detail-sub")).toContainText("One-Handed");
    await expect(screen.locator("#vs-eq-detail-sub")).toContainText("Range");
  });

  test("R.Arm detail panel shows Bandage (Leather, DP bar visible)", async ({ page }) => {
    test.setTimeout(240_000);

    const discRes = await page.request.get("/api/v1/preload/disc");
    test.skip(
      !isBinaryPreloadResponse(discRes.status(), discRes.headers()["content-type"]),
      PRELOAD_SKIP_MESSAGE,
    );

    const booted = await bootPreload(page);
    test.skip(!booted, PRELOAD_SKIP_MESSAGE);

    await page.locator("canvas#canvas").click();
    await page.keyboard.press("f");

    const menu = page.locator("#vs-menu-root");
    await expect(menu).toHaveClass(/vs-open/, { timeout: 5_000 });

    await menu.locator("[data-tab='equipment']").click();

    const screen = menu.locator(".vs-screen[data-screen='equipment']");
    await expect(screen).toHaveClass(/active/, { timeout: 5_000 });

    await expect(screen.locator("[data-slot-name='weapon']"))
      .not.toHaveText("—", { timeout: 10_000 });

    // ── Click R.Arm slot ───────────────────────────────────────────────────────
    await screen.locator(".vs-eq-slot-row[data-slot='armRight']").click();

    await expect(screen.locator("#vs-eq-detail-name")).toHaveText("Bandage");
    await expect(screen.locator("#vs-eq-detail-sub")).toContainText("Leather");

    // DP bar visible for armor
    const dpPpRow = screen.locator("#vs-eq-dp-pp-row");
    await expect(dpPpRow).toBeVisible();
    await expect(dpPpRow).not.toHaveClass(/hidden/);

    // Info bar shows class "Armor", not slot label "R.Arm"
    const infoBar = screen.locator("#vs-eq-info-bar");
    await expect(infoBar).toContainText("Armor");
    await expect(infoBar).not.toContainText("R.Arm");
  });

  test("weapon category gallery renders model thumbnails (WEP mount may lag canvas in headless)", async ({
    page,
  }) => {
    test.setTimeout(240_000);

    const discRes = await page.request.get("/api/v1/preload/disc");
    test.skip(
      !isBinaryPreloadResponse(discRes.status(), discRes.headers()["content-type"]),
      PRELOAD_SKIP_MESSAGE,
    );

    const booted = await bootPreload(page);
    test.skip(!booted, PRELOAD_SKIP_MESSAGE);

    await page.locator("canvas#canvas").click();
    await page.keyboard.press("f");

    const menu = page.locator("#vs-menu-root");
    await expect(menu).toHaveClass(/vs-open/, { timeout: 5_000 });
    await menu.locator("[data-tab='equipment']").click();

    const screen = menu.locator(".vs-screen[data-screen='equipment']");
    await expect(screen).toHaveClass(/active/, { timeout: 5_000 });
    await expect(screen.locator("[data-slot-name='weapon']"))
      .not.toHaveText("—", { timeout: 10_000 });

    await screen.locator(".vs-eq-slot-row[data-slot='weapon']").click();

    const gallery = screen.locator("#vs-eq-category-gallery");
    await expect(gallery).toBeVisible({ timeout: 15_000 });
    await expect(gallery.locator(".vs-eq-model-thumb").first()).toBeVisible({ timeout: 15_000 });

    await screen.locator(".vs-eq-slot-row[data-slot='armRight']").click();
    await expect(screen.locator("#vs-eq-category-gallery .vs-eq-model-thumb")).toHaveCount(0, {
      timeout: 10_000,
    });
  });
});
