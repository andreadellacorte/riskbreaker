/**
 * RSK-vs-equip: VS equipment screen — slot names and detail panel match
 * Ashley's initial equipment from the 2026-03-24 save state.
 *
 * Requires:
 *   E2E_PS1_DISC_BIN  — path to Vagrant Story NTSC-U .bin
 *   VS_SAVE_STATE     — path to .state fixture (default: plugins/vagrant-story/e2e/fixtures/vs-save-*.state)
 *
 * Ground-truth from in-game screenshot (Ashley's initial gear):
 *   WEAPON    — Fandango       (Bronze, Edged — "Bronze Sword (Edged/One-Handed)")
 *   SHIELD    — NONE           (unequipped)
 *   R.ARM     — Bandage        (Leather)
 *   L.ARM     — Bandage        (Leather)
 *   HEAD      — Bandana        (Leather)
 *   BODY      — Jerkin         (Leather)
 *   LEGS      — Sandals        (Leather)
 *   ACCESSORY — Rood Necklace  (material index 0 → "—", so slot shows "Acc.")
 */

import { existsSync } from "node:fs";
import * as fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function resolveDiscBin(): string {
  const fromEnv = process.env.E2E_PS1_DISC_BIN;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
  return "";
}

const VS_FIXTURES_DIR = path.join(repoRoot, "plugins", "vagrant-story", "e2e", "fixtures");
const FIXTURE_STATE   = path.join(VS_FIXTURES_DIR, "vs-save-2026-03-24T13-36-04.state");

function resolveStatePath(): string {
  const fromEnv = process.env.VS_SAVE_STATE;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
  if (existsSync(FIXTURE_STATE)) return FIXTURE_STATE;
  const files = fs
    .readdirSync(VS_FIXTURES_DIR)
    .filter(f => f.startsWith("vs-save-") && f.endsWith(".state"))
    .sort();
  return files.length > 0 ? path.join(VS_FIXTURES_DIR, files[files.length - 1]) : "";
}

async function waitForPcsxGameActive(page: Page): Promise<void> {
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

test.describe("VS equipment screen — initial loadout from save state", () => {
  test("equipment slots match Ashley's starting gear from screenshot", async ({ page }) => {
    test.setTimeout(240_000);

    const bin       = resolveDiscBin();
    const statePath = resolveStatePath();

    test.skip(!bin,       "Missing E2E_PS1_DISC_BIN — set env var to Vagrant Story NTSC-U .bin");
    test.skip(!statePath, "Missing VS save state — place vs-save-*.state in plugins/vagrant-story/e2e/fixtures/");

    // ── Boot emulator ──────────────────────────────────────────────────────────
    await page.goto("/play/spike");
    await page.waitForURL(/\/pcsx-wasm\/index\.html/, { timeout: 30_000 });

    await page.locator("#iso_opener").setInputFiles(bin);
    await waitForPcsxGameActive(page);
    await expect(page.locator("canvas#canvas")).toBeVisible({ timeout: 120_000 });

    // ── Load save state ────────────────────────────────────────────────────────
    await loadStateFile(page, statePath);
    await page.waitForTimeout(500);

    // ── Open VS menu (f key) ───────────────────────────────────────────────────
    await page.locator("canvas#canvas").click();
    await page.keyboard.press("f");

    const menu = page.locator("#vs-menu-root");
    await expect(menu).toHaveClass(/vs-open/, { timeout: 5_000 });

    // ── Navigate to Equipment tab ──────────────────────────────────────────────
    await menu.locator("[data-tab='equipment']").click();

    const screen = menu.locator(".vs-screen[data-screen='equipment']");
    await expect(screen).toHaveClass(/active/, { timeout: 5_000 });

    // Wait for RAM to populate: weapon slot should leave "—" once data arrives
    await expect(screen.locator("[data-slot-name='weapon']"))
      .not.toHaveText("—", { timeout: 10_000 });

    // ── Slot list assertions ───────────────────────────────────────────────────

    // Weapon: name comes from the 0x18-byte weapon-name string in RAM
    await expect(screen.locator("[data-slot-name='weapon']")).toHaveText("Fandango");

    // Shield: NONE in-game → unequipped → "—"
    await expect(screen.locator("[data-slot-name='shield']")).toHaveText("—");

    // Armour slots show real item names (tinted by material color, no material prefix in text)
    await expect(screen.locator("[data-slot-name='armRight']")).toHaveText("Bandage");
    await expect(screen.locator("[data-slot-name='armLeft']")).toHaveText("Bandage");
    await expect(screen.locator("[data-slot-name='helm']")).toHaveText("Bandana");
    await expect(screen.locator("[data-slot-name='breastplate']")).toHaveText("Jerkin");
    await expect(screen.locator("[data-slot-name='leggings']")).toHaveText("Sandals");

    // Accessory: Rood Necklace
    await expect(screen.locator("[data-slot-name='accessory']")).toHaveText("Rood Necklace");

    // ── Weapon detail panel (after selecting Weapon slot) ─────────────────────
    await screen.locator(".vs-eq-slot-row[data-slot='weapon']").click();
    await expect(screen.locator("#vs-eq-detail-name")).toHaveText("Fandango");

    // Sub-line: Bronze · damage type / One-Handed · range · cost (type from blade byte or grip)
    const detailSub = screen.locator("#vs-eq-detail-sub");
    await expect(detailSub).toContainText("Bronze");
    await expect(detailSub).toContainText("One-Handed");
    await expect(detailSub).toContainText(/Edged|Piercing|Blunt/);

    const weaponInfoBar = screen.locator("#vs-eq-info-bar");
    await expect(weaponInfoBar).toContainText("Class: Weapon");
    await expect(weaponInfoBar).toContainText("Bronze");
    await expect(weaponInfoBar).toContainText("One-Handed");

    // ── R.ARM detail panel ─────────────────────────────────────────────────────
    await screen.locator(".vs-eq-slot-row[data-slot='armRight']").click();

    // Detail name: real VS item name (not "Leather R.Arm" constructed label)
    await expect(screen.locator("#vs-eq-detail-name")).toHaveText("Bandage");
    // Sub-line: material name still shown
    await expect(screen.locator("#vs-eq-detail-sub")).toContainText("Leather");

    // TYPE column (always visible): Bandage is a Blunt-type gauntlet
    await expect(screen.locator("[data-type-idx='0']")).toHaveText("+1"); // Blunt
    await expect(screen.locator("[data-type-idx='1']")).toHaveText("0");  // Edged
    await expect(screen.locator("[data-type-idx='2']")).toHaveText("0");  // Piercing

    // ── R.ARM info bar: class name and no damage type ──────────────────────────
    // PSX shows "Class: Armor" — not the slot label "R.Arm"
    const infoBar = screen.locator("#vs-eq-info-bar");
    await expect(infoBar).toContainText("Armor");
    await expect(infoBar).not.toContainText("R.Arm");
    // Armor pieces have no damage type — should not show "(Blunt)" etc.
    await expect(infoBar).not.toContainText("(Blunt)");
    await expect(infoBar).not.toContainText("(Edged)");
    await expect(infoBar).not.toContainText("(Piercing)");

    // ── R.ARM DP bar: armor has durability, bar must be visible ───────────────
    const dpPpRow = screen.locator("#vs-eq-dp-pp-row");
    await expect(dpPpRow).toBeVisible();
    await expect(dpPpRow).not.toHaveClass(/hidden/);

    // ── Weapon gallery: optional WEP thumbnails (may be zero if gallery is off) ──
    const galleryThumbs = screen.locator(".vs-eq-portrait-col .vs-eq-model-thumb canvas");
    await expect(galleryThumbs).toHaveCount(0);
  });

  test("combat profile aggregates attack/defence stats from RAM", async ({ page }) => {
    test.setTimeout(240_000);

    const bin       = resolveDiscBin();
    const statePath = resolveStatePath();

    test.skip(!bin,       "Missing E2E_PS1_DISC_BIN — set env var to Vagrant Story NTSC-U .bin");
    test.skip(!statePath, "Missing VS save state — place vs-save-*.state in plugins/vagrant-story/e2e/fixtures/");

    await page.goto("/play/spike");
    await page.waitForURL(/\/pcsx-wasm\/index\.html/, { timeout: 30_000 });

    await page.locator("#iso_opener").setInputFiles(bin);
    await waitForPcsxGameActive(page);
    await expect(page.locator("canvas#canvas")).toBeVisible({ timeout: 120_000 });

    await loadStateFile(page, statePath);
    await page.waitForTimeout(500);

    await page.locator("canvas#canvas").click();
    await page.keyboard.press("f");

    const menu = page.locator("#vs-menu-root");
    await expect(menu).toHaveClass(/vs-open/, { timeout: 5_000 });

    await menu.locator("[data-tab='equipment']").click();

    const screen = menu.locator(".vs-screen[data-screen='equipment']");
    await expect(screen).toHaveClass(/active/, { timeout: 5_000 });

    // Wait for equipment RAM to populate.
    await expect(screen.locator("[data-slot-name='weapon']"))
      .not.toHaveText("—", { timeout: 10_000 });

    const atkStr = screen.locator("#vs-eq-atk-str");
    const atkInt = screen.locator("#vs-eq-atk-int");

    // Attack lines = base + blade+grip + accessory (not armour). Fandango fixture: STR 100+10+0, INT 100+1+1.
    await expect(atkStr).toHaveText("110");
    await expect(atkInt).toHaveText("102");
  });
});
