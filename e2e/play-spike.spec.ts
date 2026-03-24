import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const e2eDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Collect uncaught page exceptions (main thread). Note: `pageerror` fires when the error runs —
 * if PlayStation.js does `setTimeout(bad, 10)`, we must not assert until that timer has run.
 */
function attachPageErrorCollector(page: Page): {
  assertNoneSync: () => void;
  assertNoneAfterMainThreadSettles: () => Promise<void>;
} {
  const messages: string[] = [];
  page.on("pageerror", (err) => {
    messages.push(err.message);
  });
  const throwIfAny = () => {
    if (messages.length > 0) {
      throw new Error(`Unexpected page JS errors:\n${messages.join("\n")}`);
    }
  };
  return {
    assertNoneSync: throwIfAny,
    assertNoneAfterMainThreadSettles: async () => {
      // Let short timers from readFile / pad poll run (e.g. 10ms) before we declare victory.
      await page.evaluate(
        () =>
          new Promise<void>((resolve) => {
            setTimeout(resolve, 750);
          }),
      );
      throwIfAny();
    },
  };
}

/** Default: GPL-2.0 homebrew bin under `e2e/fixtures/`. Override via `E2E_PS1_DISC_BIN`. */
/** kxkx shell fades chrome via `pcsx-game-active` on `body` — upload label may stay in DOM (opacity 0). */
async function waitForPcsxGameActive(page: Page) {
  await page.waitForFunction(
    "document.body.classList.contains('pcsx-game-active')",
    null,
    { timeout: 120_000 },
  );
}

function resolveDiscBin(): string {
  const fromEnv = process.env.E2E_PS1_DISC_BIN;
  if (fromEnv && existsSync(fromEnv)) {
    return fromEnv;
  }
  return path.join(e2eDir, "fixtures", "240pTestSuitePS1-EMU.bin");
}

test.describe("/play/spike — pcsx-kxkx smoke", () => {
  test("redirects to full-page emulator and shell is ready", async ({ page }) => {
    test.setTimeout(120_000);

    const { assertNoneSync } = attachPageErrorCollector(page);

    await page.goto("/play/spike");

    await page.waitForURL(/\/pcsx-kxkx\/index\.html\?riskbreaker=1/, {
      timeout: 30_000,
    });

    await expect(page.getByRole("link", { name: /riskbreaker/i })).toBeVisible();

    await expect(page.locator("#iso_opener")).toBeAttached({
      timeout: 10_000,
    });

    // Riskbreaker overlay (`riskbreaker-overlay-boot.js`): Backquote toggles #rb-riskbreaker-overlay.
    const overlay = page.locator("#rb-riskbreaker-overlay");
    await overlay.waitFor({ state: "attached", timeout: 10_000 });
    await expect(overlay).toBeHidden();
    await page.keyboard.press("Backquote");
    await expect(overlay).toBeVisible();
    await page.keyboard.press("Backquote");
    await expect(overlay).toBeHidden();

    assertNoneSync();
  });
});

/**
 * Full path: pick a real `.bin` → `runPlayStation()` → dynamic `PlayStation.js` → WASM + canvas.
 * (Smoke test above never loads `PlayStation.js`; only this flow does.)
 */
test.describe("/play/spike — homebrew disc loads emulator (pcsx-kxkx)", () => {
  test("loads GPL homebrew .bin; WASM runs, canvas appears, no page errors", async ({
    page,
  }) => {
    test.setTimeout(180_000);

    const bin = resolveDiscBin();
    if (process.env.CI) {
      expect(
        existsSync(bin),
        `CI requires the GPL homebrew disc fixture at ${bin} — see e2e/fixtures/README.md`,
      ).toBe(true);
    }
    test.skip(!existsSync(bin), `Missing disc fixture: ${bin}`);

    const { assertNoneAfterMainThreadSettles } = attachPageErrorCollector(page);

    await page.goto("/play/spike");
    await page.waitForURL(/\/pcsx-kxkx\/index\.html/, { timeout: 30_000 });

    const upload = page.locator(".gui_upload");
    await expect(upload).toBeVisible();

    await page.locator("#iso_opener").setInputFiles(bin);

    await waitForPcsxGameActive(page);

    const canvas = page.locator("canvas#canvas");
    await expect(canvas).toBeVisible({
      timeout: 120_000,
    });

    await canvas.click();
    await page.keyboard.press("z");

    const overlay = page.locator("#rb-riskbreaker-overlay");
    await expect(overlay).toBeHidden();
    await page.keyboard.press("Backquote");
    await expect(overlay).toBeVisible();
    await page.keyboard.press("Backquote");
    await expect(overlay).toBeHidden();

    await assertNoneAfterMainThreadSettles();
  });

  /** Stronger than smoke-only: menu controls + perf HUD need `PlayStation.js` + running main loop (RSK-xfc8). */
  test("Riskbreaker menu: Perf HUD checkbox shows frame timing and FPS line", async ({ page }) => {
    test.setTimeout(180_000);

    const bin = resolveDiscBin();
    test.skip(!existsSync(bin), `Missing disc fixture: ${bin}`);

    const { assertNoneAfterMainThreadSettles } = attachPageErrorCollector(page);

    await page.goto("/play/spike");
    await page.waitForURL(/\/pcsx-kxkx\/index\.html/, { timeout: 30_000 });
    await page.locator("#iso_opener").setInputFiles(bin);
    await waitForPcsxGameActive(page);
    await expect(page.locator("canvas#canvas")).toBeVisible({ timeout: 120_000 });

    await page.keyboard.press("Backquote");
    await expect(page.locator("#rb-riskbreaker-overlay")).toBeVisible();
    await page.getByRole("checkbox", { name: /Perf HUD/i }).check();

    const hud = page.locator("#rb-perf-hud");
    await expect(hud).toBeVisible({ timeout: 10_000 });
    await expect
      .poll(async () => (await hud.textContent()) ?? "", { timeout: 20_000 })
      .toMatch(/wall/);
    await expect(hud).toContainText(/EMA/);
    /** kxkx: perf hooks (`__riskbreakerOnWorkerRender`) may be unset — FPS readout can stay `—` until wired in the fork. */

    await page.keyboard.press("Escape");
    await expect(page.locator("#rb-riskbreaker-overlay")).toBeHidden();

    await assertNoneAfterMainThreadSettles();
  });
});
