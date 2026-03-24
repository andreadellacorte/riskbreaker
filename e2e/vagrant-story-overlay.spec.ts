/**
 * RSK-vs12: Vagrant Story overlay — live RAM probe via save-state fixture.
 *
 * Requires:
 *   E2E_PS1_DISC_BIN  — path to Vagrant Story NTSC-U .bin
 *   VS_SAVE_STATE     — path to .state fixture (default: repo root vs-save-*.state)
 *
 * The test loads the ISO, waits for the emulator to be active, loads the save
 * state, opens the overlay, triggers a refresh on the Vagrant Story panel, and
 * asserts that live HP/MP/Risk values appear (badge === "live").
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

test.describe("Vagrant Story overlay — live RAM probe from save state", () => {
  test("overlay shows live HP/MP/Risk after loading save state", async ({ page }) => {
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

    // Give the emulator a tick to apply the state
    await page.waitForTimeout(500);

    // Open overlay
    await page.locator("canvas#canvas").click();
    await page.keyboard.press("Backquote");
    const overlay = page.locator("#rb-riskbreaker-overlay");
    await expect(overlay).toBeVisible();

    // Find the Vagrant Story panel and click refresh (↻)
    const panelHeading = overlay.locator("[data-panel-id='vagrant-story-items']");
    await expect(panelHeading).toBeVisible({ timeout: 10_000 });
    await panelHeading.getByRole("button", { name: "↻" }).click();

    // After refresh the panel should show live badge rows
    const panelRows = overlay.locator("[data-panel-rows='vagrant-story-items']");

    // HP row: value should be non-zero (e.g. "250 / 250" or "237 / 250")
    const hpValue = panelRows.locator("[data-row-value='HP']");
    await expect(hpValue).toBeVisible({ timeout: 10_000 });
    await expect(hpValue).not.toHaveText("0 / 0");

    // MP row
    const mpValue = panelRows.locator("[data-row-value='MP']");
    await expect(mpValue).toBeVisible();
    await expect(mpValue).not.toHaveText("0 / 0");

    // Risk row (should be 0 at new game)
    const riskValue = panelRows.locator("[data-row-value='Risk']");
    await expect(riskValue).toBeVisible();

    // Summary should contain "Ashley Riot"
    const summary = overlay.locator("[data-panel-summary='vagrant-story-items']");
    await expect(summary).toContainText("Ashley Riot");

    // All three rows should carry "live" badge
    const liveBadges = panelRows.locator("span", { hasText: "live" });
    await expect(liveBadges).toHaveCount(3);
  });
});
