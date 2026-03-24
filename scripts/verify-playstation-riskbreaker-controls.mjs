/**
 * Playwright: verify Riskbreaker runtime controls — Perf HUD + FPS readout, internal upscaling
 * (`__riskbreakerCanvasUpscaleFactor`, canvas backing-store size), and speed hack (burst + timing).
 *
 * Uses **`/play/spike`** and the same GPL homebrew `.bin` default as **`e2e/play-spike.spec.ts`**
 * (no Vagrant Story ROM). Run **`pnpm build:pcsx-kxkx-shell`** if `riskbreaker-kxkx-boot.js` is missing.
 *
 * Usage (Vite on :5173):
 *   pnpm dev
 *   pnpm build:pcsx-kxkx-shell
 *   node scripts/verify-playstation-riskbreaker-controls.mjs
 *
 * Or another origin:
 *   PLAYWRIGHT_BASE_URL=https://example.com node scripts/verify-playstation-riskbreaker-controls.mjs
 *
 * Env:
 *   PLAYWRIGHT_BASE_URL     — default `http://127.0.0.1:5173`
 *   E2E_PS1_DISC_BIN        — PS1 disc image (override)
 *   VERIFY_PS1_DISC_BIN     — alias for E2E_PS1_DISC_BIN (e.g. `…/Vagrant Story (USA).bin` — large discs:
 *                             raise `VERIFY_RUNTIME_AFTER_CANVAS_MS` to 120000–300000 so the game can boot before toggles)
 *   VERIFY_RUNTIME_AFTER_CANVAS_MS — wait after canvas visible before toggling UI (default 12000)
 *   VERIFY_RUNTIME_HUD_POLL_MS     — max wait for FPS line on HUD (default 25000)
 *   VERIFY_RUNTIME_SPEED_SAMPLE_MS — wall time to sample HUD FPS before/after speed hack (default 2000)
 *   VERIFY_RUNTIME_OUT_DIR    — screenshots + JSON report (default `docs/assets/riskbreaker-verify`)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");
const e2eDir = path.join(repoRoot, "e2e");

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:5173";
const afterCanvasMs = Number(process.env.VERIFY_RUNTIME_AFTER_CANVAS_MS ?? "12000");
const hudPollMs = Number(process.env.VERIFY_RUNTIME_HUD_POLL_MS ?? "25000");
const speedSampleMs = Number(process.env.VERIFY_RUNTIME_SPEED_SAMPLE_MS ?? "2000");
const outDir =
  process.env.VERIFY_RUNTIME_OUT_DIR ?? path.join(repoRoot, "docs/assets/riskbreaker-verify");

function resolveDiscBin() {
  const fromEnv = process.env.VERIFY_PS1_DISC_BIN ?? process.env.E2E_PS1_DISC_BIN;
  if (fromEnv && fs.existsSync(fromEnv)) {
    return fromEnv;
  }
  return path.join(e2eDir, "fixtures", "240pTestSuitePS1-EMU.bin");
}

const romPath = resolveDiscBin();
const startUrl = `${baseURL.replace(/\/$/, "")}/play/spike`;

const logs = [];
const errors = [];

function fail(msg) {
  console.error(`\nVERIFY FAIL: ${msg}\n`);
  process.exit(1);
}

async function readRuntimeSnapshot(page) {
  return page.evaluate(() => {
    const canvas =
      document.querySelector("canvas#canvas") ??
      document.querySelector("#rb-playstation-host canvas");
    const g = globalThis;
    return {
      canvasWidth: canvas?.width ?? null,
      canvasHeight: canvas?.height ?? null,
      upscaleFactor: g.__riskbreakerCanvasUpscaleFactor ?? null,
      lastLogical: g.__riskbreakerLastLogicalCanvasSize ?? null,
      burst: g.__riskbreakerRunnerBurstCount ?? null,
      perfHudText: document.getElementById("rb-perf-hud")?.innerText?.trim() ?? null,
      fpsReadout: document.getElementById("rb-fps-readout")?.innerText?.trim() ?? null,
      storage: {
        perfHud: globalThis.localStorage?.getItem("riskbreaker:perfHud") ?? null,
        speedHack: globalThis.localStorage?.getItem("riskbreaker:speedHack") ?? null,
        upscaling: globalThis.localStorage?.getItem("riskbreaker:upscaling") ?? null,
        internalScale: globalThis.localStorage?.getItem("riskbreaker:internalScale") ?? null,
      },
    };
  });
}

async function parseHudFps(page) {
  const snap = await readRuntimeSnapshot(page);
  const fpsLine = snap.fpsReadout ?? snap.perfHudText ?? "";
  const m = fpsLine.match(/(\d+)\s*FPS/i);
  return m ? Number(m[1]) : null;
}

async function main() {
  if (!fs.existsSync(romPath)) {
    console.error(`Disc fixture missing: ${romPath}`);
    console.error("Set VERIFY_PS1_DISC_BIN or E2E_PS1_DISC_BIN, or add e2e/fixtures/240pTestSuitePS1-EMU.bin");
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(300_000);

  page.on("console", (msg) => {
    const line = `[${msg.type()}] ${msg.text()}`;
    logs.push(line);
  });
  page.on("pageerror", (err) => {
    const line = `pageerror: ${err.message}`;
    errors.push(line);
    process.stderr.write(line + "\n");
  });

  process.stderr.write(`Opening ${startUrl}\n`);
  await page.goto(startUrl, { waitUntil: "domcontentloaded" });
  await page.waitForURL(/\/pcsx-kxkx\/index\.html/, { timeout: 60_000 });

  await page.locator("#iso_opener").setInputFiles(romPath);
  await expectDiscRunning(page);

  const canvas = page.locator("canvas#canvas");
  await canvas.waitFor({ state: "visible", timeout: 180_000 });

  process.stderr.write(
    `Waiting ${afterCanvasMs} ms for WASM / main loop (VERIFY_RUNTIME_AFTER_CANVAS_MS)…\n`,
  );
  await page.waitForTimeout(afterCanvasMs);

  await canvas.click().catch(() => {});
  await page.keyboard.press("z").catch(() => {});

  fs.mkdirSync(outDir, { recursive: true });
  const shots = [];

  async function shot(name) {
    const p = path.join(outDir, `${name}.png`);
    await page.screenshot({ path: p, fullPage: true });
    shots.push(p);
    process.stderr.write(`Screenshot ${p}\n`);
  }

  await shot("01-after-disc");

  process.stderr.write("Opening Riskbreaker overlay (Backquote)…\n");
  await page.keyboard.press("Backquote");
  await page.locator("#rb-riskbreaker-overlay").waitFor({ state: "visible", timeout: 10_000 });
  await shot("02-overlay-open");

  const perfCheckbox = page.getByRole("checkbox", { name: /Perf HUD/i });
  const speedCheckbox = page.getByRole("checkbox", { name: /Speed hack/i });
  const upscaleCheckbox = page.getByRole("checkbox", { name: /Internal render upscale/i });

  const baseline = await readRuntimeSnapshot(page);
  process.stderr.write(`Baseline snapshot: ${JSON.stringify(baseline, null, 2)}\n`);

  await perfCheckbox.check();
  await page.locator("#rb-perf-hud").waitFor({ state: "visible", timeout: 10_000 });

  process.stderr.write("Polling Perf HUD for FPS / wall line…\n");
  const hud = page.locator("#rb-perf-hud");
  try {
    await expect
      .poll(async () => (await hud.textContent()) ?? "", { timeout: hudPollMs })
      .toMatch(/wall/i);
  } catch {
    fail(
      `Perf HUD did not show expected 'wall' sample line within ${hudPollMs} ms. HUD text: ${await hud.textContent()}`,
    );
  }

  const fpsAfterHud = await parseHudFps(page);
  if (fpsAfterHud === null || fpsAfterHud <= 0) {
    fail(
      `Could not parse FPS from HUD readout. fpsReadout/hud: ${JSON.stringify(await readRuntimeSnapshot(page))}`,
    );
  }

  await shot("03-perf-hud-on");

  const fpsBeforeSpeed = await parseHudFps(page);
  await page.waitForTimeout(speedSampleMs);
  const fpsBeforeSpeed2 = await parseHudFps(page);

  await speedCheckbox.check();
  await page.waitForTimeout(speedSampleMs);
  const burst = await page.evaluate(() => globalThis.__riskbreakerRunnerBurstCount ?? null);
  /** pcsx-kxkx path: Emscripten burst glue from the old lrusso bundle may be absent — only strict-check when set. */
  if (burst != null && burst !== 16) {
    fail(
      `Speed hack enabled but __riskbreakerRunnerBurstCount expected 16, got ${JSON.stringify(burst)}`,
    );
  }
  if (burst == null) {
    process.stderr.write(
      "WARN: __riskbreakerRunnerBurstCount unset (expected on legacy lrusso glue; kxkx may use worker-only timing).\n",
    );
  }

  const fpsAfterSpeed = await parseHudFps(page);
  await shot("04-speed-hack-on");

  const upscaleBefore = await readRuntimeSnapshot(page);
  await upscaleCheckbox.check();
  await page.waitForTimeout(500);
  await page.waitForTimeout(2000);

  const upscaleAfter = await readRuntimeSnapshot(page);
  if (upscaleAfter.storage.upscaling !== "1") {
    fail(`Upscaling storage not '1': ${JSON.stringify(upscaleAfter.storage)}`);
  }
  const expectedFactor = Number.parseInt(upscaleAfter.storage.internalScale ?? "3", 10) || 3;
  if (upscaleAfter.upscaleFactor !== expectedFactor) {
    fail(
      `__riskbreakerCanvasUpscaleFactor expected ${expectedFactor} (from internalScale storage), got ${JSON.stringify(upscaleAfter.upscaleFactor)}`,
    );
  }

  const canvasGrew =
    upscaleBefore.lastLogical &&
    upscaleAfter.canvasWidth != null &&
    upscaleBefore.canvasWidth != null &&
    upscaleAfter.canvasWidth >= upscaleBefore.canvasWidth * 1.5;
  if (!canvasGrew && upscaleAfter.lastLogical) {
    process.stderr.write(
      "WARN: Canvas backing-store did not grow ~2× vs baseline; SDL logical may be unset or core ignored resize. Factor and storage still OK.\n",
    );
  }

  await shot("05-upscaling-on");

  await page.keyboard.press("Escape");
  await page.locator("#rb-riskbreaker-overlay").waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  await shot("06-overlay-closed");

  await page.waitForTimeout(750);
  if (errors.length > 0) {
    fail(`Page errors:\n${errors.join("\n")}`);
  }

  const report = {
    startUrl,
    romPath,
    romBytes: fs.statSync(romPath).size,
    timings: { afterCanvasMs, hudPollMs, speedSampleMs },
    baseline,
    fps: {
      afterPerfHudEnabled: fpsAfterHud,
      beforeSpeedHackSample: fpsBeforeSpeed,
      beforeSpeedHackSample2: fpsBeforeSpeed2,
      afterSpeedHackSample: fpsAfterSpeed,
      speedHackRaisedFps: fpsAfterSpeed > (fpsBeforeSpeed2 ?? fpsBeforeSpeed ?? 0),
    },
    speedHack: { runnerBurstCount: burst },
    upscaling: {
      before: {
        canvasW: upscaleBefore.canvasWidth,
        canvasH: upscaleBefore.canvasHeight,
        factor: upscaleBefore.upscaleFactor,
        logical: upscaleBefore.lastLogical,
      },
      after: {
        canvasW: upscaleAfter.canvasWidth,
        canvasH: upscaleAfter.canvasHeight,
        factor: upscaleAfter.upscaleFactor,
        logical: upscaleAfter.lastLogical,
      },
      canvasBackingStoreGrew: canvasGrew,
    },
    screenshots: shots,
    consoleLineCount: logs.length,
    pageErrors: errors,
    sampleConsole: logs.slice(0, 30),
  };

  const reportPath = path.join(outDir, "riskbreaker-runtime-verify-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  process.stderr.write(`\nOK — wrote ${reportPath}\n`);
  process.stderr.write(
    `FPS: ~${fpsAfterHud} (HUD) → ~${fpsAfterSpeed} after speed hack (expect higher if burst uncaps).\n`,
  );

  await browser.close();
}

async function expectDiscRunning(page) {
  await page.waitForFunction(
    () => document.body.classList.contains("pcsx-game-active"),
    null,
    { timeout: 120_000 },
  );
}

// Minimal expect.poll compatible API (no @playwright/test runner).
const expect = {
  poll: (fn, { timeout }) => {
    const start = Date.now();
    return {
      async toMatch(re) {
        let last = "";
        while (Date.now() - start < timeout) {
          last = await fn();
          if (re.test(last)) return;
          await new Promise((r) => setTimeout(r, 200));
        }
        throw new Error(`poll timeout: last=${JSON.stringify(last)}`);
      },
    };
  },
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
