/**
 * RSK-vs-equip: VS equipment screen — slot names and detail panel match
 * Ashley's equipment from the loaded PCSX save state fixture.
 *
 * Requires:
 *   E2E_PS1_DISC_BIN  — path to Vagrant Story NTSC-U .bin
 *   VS_SAVE_STATE     — path to .state fixture (default: plugins/vagrant-story/e2e/fixtures/vs-save-2026-03-24…)
 *
 * Fixtures:
 *   vs-save-2026-03-24 — Fandango, no shield (see file comment in profile below).
 *   vs-save-2026-03-26 — Tovarisch + Buckler + same leather kit (stats differ slightly from 03-24).
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
const FIXTURE_STATE = path.join(VS_FIXTURES_DIR, "vs-save-2026-03-24T13-36-04.state");

/** Ground-truth per save state (from RAM decode + in-emulator UI). */
type EquipmentFixtureProfile = {
  weapon: string;
  shieldSlot: string;
  armRight: string;
  armLeft: string;
  helm: string;
  breastplate: string;
  leggings: string;
  accessory: string;
  /** Sub-line and info bar for weapon include this material (both March fixtures use Bronze blades). */
  weaponDetailMaterial: string;
  atkStr: string;
  atkInt: string;
};

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

function equipmentProfileForStatePath(statePath: string): EquipmentFixtureProfile {
  const base = path.basename(statePath);
  if (base.includes("2026-03-26")) {
    return {
      weapon: "Tovarisch",
      shieldSlot: "Buckler",
      armRight: "Bandage",
      armLeft: "Bandage",
      helm: "Bandana",
      breastplate: "Jerkin",
      leggings: "Sandals",
      accessory: "Rood Necklace",
      weaponDetailMaterial: "Bronze",
      atkStr: "109",
      atkInt: "102",
    };
  }
  // vs-save-2026-03-24 — Fandango, unequipped shield, twin Bandages (see original spec comment).
  return {
    weapon: "Fandango",
    shieldSlot: "—",
    armRight: "Bandage",
    armLeft: "Bandage",
    helm: "Bandana",
    breastplate: "Jerkin",
    leggings: "Sandals",
    accessory: "Rood Necklace",
    weaponDetailMaterial: "Bronze",
    atkStr: "110",
    atkInt: "102",
  };
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

async function openEquipmentTab(page: Page): Promise<ReturnType<Page["locator"]>> {
  await page.locator("canvas#canvas").click();
  await page.keyboard.press("f");

  const menu = page.locator("#vs-menu-root");
  await expect(menu).toHaveClass(/vs-open/, { timeout: 5_000 });
  await menu.locator("[data-tab='equipment']").click();

  const screen = menu.locator(".vs-screen[data-screen='equipment']");
  await expect(screen).toHaveClass(/active/, { timeout: 5_000 });
  return screen;
}

test.describe("VS equipment screen — initial loadout from save state", () => {
  test("equipment slots match Ashley's starting gear from screenshot", async ({ page }) => {
    test.setTimeout(240_000);

    const bin = resolveDiscBin();
    const statePath = resolveStatePath();
    const profile = equipmentProfileForStatePath(statePath);

    test.skip(!bin, "Missing E2E_PS1_DISC_BIN — set env var to Vagrant Story NTSC-U .bin");
    test.skip(!statePath, "Missing VS save state — place vs-save-*.state in plugins/vagrant-story/e2e/fixtures/");

    await page.goto("/play/spike");
    await page.waitForURL(/\/pcsx-wasm\/index\.html/, { timeout: 30_000 });

    await page.locator("#iso_opener").setInputFiles(bin);
    await waitForPcsxGameActive(page);
    await expect(page.locator("canvas#canvas")).toBeVisible({ timeout: 120_000 });

    await loadStateFile(page, statePath);
    await page.waitForTimeout(500);

    const screen = await openEquipmentTab(page);

    await expect(screen.locator("[data-slot-name='weapon']")).not.toHaveText("—", { timeout: 10_000 });

    await expect(screen.locator("[data-slot-name='weapon']")).toHaveText(profile.weapon);
    await expect(screen.locator("[data-slot-name='shield']")).toHaveText(profile.shieldSlot);
    await expect(screen.locator("[data-slot-name='armRight']")).toHaveText(profile.armRight);
    await expect(screen.locator("[data-slot-name='armLeft']")).toHaveText(profile.armLeft);
    await expect(screen.locator("[data-slot-name='helm']")).toHaveText(profile.helm);
    await expect(screen.locator("[data-slot-name='breastplate']")).toHaveText(profile.breastplate);
    await expect(screen.locator("[data-slot-name='leggings']")).toHaveText(profile.leggings);
    await expect(screen.locator("[data-slot-name='accessory']")).toHaveText(profile.accessory);

    await screen.locator(".vs-eq-slot-row[data-slot='weapon']").click();
    await expect(screen.locator("#vs-eq-detail-name")).toHaveText(profile.weapon);

    const detailSub = screen.locator("#vs-eq-detail-sub");
    await expect(detailSub).toContainText(profile.weaponDetailMaterial);
    await expect(detailSub).toContainText("One-Handed");
    await expect(detailSub).toContainText(/Edged|Piercing|Blunt/);

    const weaponInfoBar = screen.locator("#vs-eq-info-bar");
    await expect(weaponInfoBar).toContainText("Class: Weapon");
    await expect(weaponInfoBar).toContainText(profile.weaponDetailMaterial);
    await expect(weaponInfoBar).toContainText("One-Handed");

    // Gallery is tied to the active slot — assert while Weapon is still selected.
    const galleryThumbs = screen.locator("#vs-eq-category-gallery .vs-eq-model-thumb");
    await expect(galleryThumbs.first()).toBeVisible();

    await screen.locator(".vs-eq-slot-row[data-slot='armRight']").click();
    await expect(screen.locator("#vs-eq-detail-name")).toHaveText(profile.armRight);
    await expect(screen.locator("#vs-eq-detail-sub")).toContainText("Leather");

    await expect(screen.locator("[data-type-idx='0']")).toHaveText("+1");
    await expect(screen.locator("[data-type-idx='1']")).toHaveText("0");
    await expect(screen.locator("[data-type-idx='2']")).toHaveText("0");

    const infoBar = screen.locator("#vs-eq-info-bar");
    await expect(infoBar).toContainText("Armor");
    await expect(infoBar).not.toContainText("R.Arm");
    await expect(infoBar).not.toContainText("(Blunt)");
    await expect(infoBar).not.toContainText("(Edged)");
    await expect(infoBar).not.toContainText("(Piercing)");

    const dpPpRow = screen.locator("#vs-eq-dp-pp-row");
    await expect(dpPpRow).toBeVisible();
    await expect(dpPpRow).not.toHaveClass(/hidden/);
  });

  test("combat profile aggregates attack/defence stats from RAM", async ({ page }) => {
    test.setTimeout(240_000);

    const bin = resolveDiscBin();
    const statePath = resolveStatePath();
    const profile = equipmentProfileForStatePath(statePath);

    test.skip(!bin, "Missing E2E_PS1_DISC_BIN — set env var to Vagrant Story NTSC-U .bin");
    test.skip(!statePath, "Missing VS save state — place vs-save-*.state in plugins/vagrant-story/e2e/fixtures/");

    await page.goto("/play/spike");
    await page.waitForURL(/\/pcsx-wasm\/index\.html/, { timeout: 30_000 });

    await page.locator("#iso_opener").setInputFiles(bin);
    await waitForPcsxGameActive(page);
    await expect(page.locator("canvas#canvas")).toBeVisible({ timeout: 120_000 });

    await loadStateFile(page, statePath);
    await page.waitForTimeout(500);

    const screen = await openEquipmentTab(page);

    await expect(screen.locator("[data-slot-name='weapon']")).not.toHaveText("—", { timeout: 10_000 });

    const atkStr = screen.locator("#vs-eq-atk-str");
    const atkInt = screen.locator("#vs-eq-atk-int");

    await expect(atkStr).toHaveText(profile.atkStr);
    await expect(atkInt).toHaveText(profile.atkInt);
  });
});

test.describe("VS equipment — mock UI does not persist to PS1 RAM (documentation)", () => {
  test("mock Equip on a stub leaves RAM slot labels after close and reopen", async ({ page }) => {
    test.setTimeout(240_000);

    const bin = resolveDiscBin();
    const statePath = resolveStatePath();
    const profile = equipmentProfileForStatePath(statePath);

    test.skip(!bin, "Missing E2E_PS1_DISC_BIN — set env var to Vagrant Story NTSC-U .bin");
    test.skip(!statePath, "Missing VS save state — place vs-save-*.state in plugins/vagrant-story/e2e/fixtures/");

    await page.goto("/play/spike");
    await page.waitForURL(/\/pcsx-wasm\/index\.html/, { timeout: 30_000 });

    await page.locator("#iso_opener").setInputFiles(bin);
    await waitForPcsxGameActive(page);
    await expect(page.locator("canvas#canvas")).toBeVisible({ timeout: 120_000 });

    await loadStateFile(page, statePath);
    await page.waitForTimeout(500);

    let screen = await openEquipmentTab(page);
    await expect(screen.locator("[data-slot-name='weapon']")).not.toHaveText("—", { timeout: 10_000 });

    const ramWeapon = profile.weapon;
    await expect(screen.locator("[data-slot-name='weapon']")).toHaveText(ramWeapon);

    await screen.locator(".vs-eq-slot-row[data-slot='weapon']").click();
    const stubThumb = screen.locator('.vs-eq-model-thumb[data-preview-kind="stub"]').first();
    await expect(stubThumb).toBeVisible({ timeout: 5_000 });
    await stubThumb.locator("..").getByRole("button", { name: "Equip" }).click();

    await expect(screen.locator("#vs-eq-detail-name")).not.toHaveText(ramWeapon);
    await expect(screen.locator("[data-slot-name='weapon']")).toHaveText(ramWeapon);

    await page.keyboard.press("f");
    const menu = page.locator("#vs-menu-root");
    await expect(menu).not.toHaveClass(/vs-open/, { timeout: 5_000 });

    await page.keyboard.press("f");
    await expect(menu).toHaveClass(/vs-open/, { timeout: 5_000 });
    await menu.locator("[data-tab='equipment']").click();
    screen = menu.locator(".vs-screen[data-screen='equipment']");
    await expect(screen).toHaveClass(/active/, { timeout: 5_000 });

    await expect(screen.locator("[data-slot-name='weapon']")).toHaveText(ramWeapon);
  });

  test("loadout 2 labels come from localStorage; loadout 1 restores RAM names", async ({ page }) => {
    test.setTimeout(240_000);

    const bin = resolveDiscBin();
    const statePath = resolveStatePath();
    const profile = equipmentProfileForStatePath(statePath);

    test.skip(!bin, "Missing E2E_PS1_DISC_BIN — set env var to Vagrant Story NTSC-U .bin");
    test.skip(!statePath, "Missing VS save state — place vs-save-*.state in plugins/vagrant-story/e2e/fixtures/");

    await page.goto("/play/spike");
    await page.waitForURL(/\/pcsx-wasm\/index\.html/, { timeout: 30_000 });

    await page.locator("#iso_opener").setInputFiles(bin);
    await waitForPcsxGameActive(page);
    await expect(page.locator("canvas#canvas")).toBeVisible({ timeout: 120_000 });

    await loadStateFile(page, statePath);
    await page.waitForTimeout(500);

    const screen = await openEquipmentTab(page);
    await expect(screen.locator("[data-slot-name='weapon']")).not.toHaveText("—", { timeout: 10_000 });
    await expect(screen.locator("[data-slot-name='weapon']")).toHaveText(profile.weapon);

    await screen.locator('.vs-eq-loadout-btn[data-loadout="2"]').click();
    await expect(screen.locator("[data-slot-name='weapon']")).toHaveText("—");

    await screen.locator('.vs-eq-loadout-btn[data-loadout="1"]').click();
    await expect(screen.locator("[data-slot-name='weapon']")).toHaveText(profile.weapon);
  });
});
