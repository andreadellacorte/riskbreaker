/**
 * Local-only: load a legal PS1 `.bin` into the vendored shell and capture Triangle-menu screenshots.
 * ROM path is gitignored (`bins/`); pass explicitly or set `VAGRANT_STORY_BIN`.
 *
 * Intended flow (Vagrant Story): mash **Start** (**V**) only to skip intros until **3D** control.
 * In **3D**, **Start** toggles **1st person** — and in that mode **Triangle** (**D**) does **not** open
 * the usual field menu. A long Start smash after boot can overlap **3D** and trap the session in
 * 1st person; shorten `VAGRANT_STORY_START_MASH_DURATION_MS` or use `VAGRANT_STORY_START_MASHES`.
 *
 * Usage (Vite on :5173):
 *   pnpm dev
 *   node scripts/verify-vagrant-story-rom.mjs
 *
 * Or against another origin:
 *   PLAYWRIGHT_BASE_URL=https://riskbreaker.netlify.app node scripts/verify-vagrant-story-rom.mjs
 *
 * Riskbreaker runtime (localStorage, before ROM load):
 *   VAGRANT_STORY_SPEED_HACK=1     — uncapped main loop (higher FPS; `riskbreaker:speedHack`)
 *   VAGRANT_STORY_UPSCALING=1      — internal canvas / SDL upscale (`riskbreaker:upscaling` + `riskbreaker:internalScale`)
 *   VAGRANT_STORY_INTERNAL_SCALE=3 — 2–4 when upscaling (default 3)
 *   VAGRANT_STORY_PERF_HUD=1       — bottom-left FPS / timing overlay (`riskbreaker:perfHud`)
 *
 * Boot wait (after canvas is visible): **poll** until the main loop is ticking — not a fixed sleep.
 *   VAGRANT_STORY_BOOT_WAIT_MAX_MS — cap (default 180000). Alias: VAGRANT_STORY_BOOT_WAIT_MS (same meaning).
 *   VAGRANT_STORY_BOOT_POLL_MS     — poll interval (default 250).
 *   VAGRANT_STORY_BOOT_HEARTBEAT_STALE_MS — frame must be newer than this (default 750).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

const defaultRom = path.join(
  repoRoot,
  "bins/roms/Vagrant Story (USA)/Vagrant Story (USA).bin",
);

const romPath = process.env.VAGRANT_STORY_BIN ?? defaultRom;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:5173";
const outDir =
  process.env.VAGRANT_STORY_SCREENSHOT_DIR ??
  path.join(repoRoot, "docs/assets/vagrant-story");
/**
 * Max time to wait for the emulator main loop to tick (polls `__riskbreakerLastMainLoopFrameAt`).
 * Default lowered from a fixed 5 min sleep; local runs usually finish in seconds.
 */
const bootWaitMaxMs = Number(
  process.env.VAGRANT_STORY_BOOT_WAIT_MAX_MS ??
    process.env.VAGRANT_STORY_BOOT_WAIT_MS ??
    "180000",
);
const bootPollMs = Number(process.env.VAGRANT_STORY_BOOT_POLL_MS ?? "250");
const bootHeartbeatStaleMs = Number(
  process.env.VAGRANT_STORY_BOOT_HEARTBEAT_STALE_MS ?? "750",
);
/** PS1 START = `V` — delay between presses while smashing through intros (ms). */
const startMashDelayMs = Number(process.env.VAGRANT_STORY_START_MASH_DELAY_MS ?? "250");
/**
 * Wall-clock time to mash Start (~1–2 min typically reaches 3D where Triangle opens the menu).
 * Prefer this over a fixed press count. Override with `VAGRANT_STORY_START_MASHES` for a count cap.
 */
const startMashDurationMs = Number(
  process.env.VAGRANT_STORY_START_MASH_DURATION_MS ?? "60000",
);
/** If set, mash exactly this many times instead of using `startMashDurationMs`. */
const startMashesEnv = process.env.VAGRANT_STORY_START_MASHES;
/**
 * Brief pause after the Start phase before the “before Triangle” screenshot (3D should already be
 * reached during the 1–2 min smash).
 */
const inGameWaitMs = Number(process.env.VAGRANT_STORY_3D_SETTLE_MS ?? "8000");
const triangleHoldMs = Number(process.env.VAGRANT_STORY_AFTER_TRIANGLE_MS ?? "2500");
/**
 * If `1`, send one **Start** (`v`) after the settle wait to toggle **out** of **1st person** when
 * Start-mashing left the camera there — **Triangle** only opens the field menu from **normal field
 * camera**. If you are already in third-person, one `v` will **enter** 1st person — leave unset.
 */
const toggleCameraBeforeTriangle =
  process.env.VAGRANT_STORY_TOGGLE_CAMERA_BEFORE_TRIANGLE === "1";

/** Mirrors `riskbreaker-query` STORAGE keys — applied after first navigation, before attaching ROM. */
const riskbreakerSpeedHack = process.env.VAGRANT_STORY_SPEED_HACK === "1";
const riskbreakerUpscaling = process.env.VAGRANT_STORY_UPSCALING === "1";
const riskbreakerPerfHud = process.env.VAGRANT_STORY_PERF_HUD === "1";
const riskbreakerInternalScaleRaw = process.env.VAGRANT_STORY_INTERNAL_SCALE;
const riskbreakerInternalScale = (() => {
  const n = Number.parseInt(riskbreakerInternalScaleRaw ?? "3", 10);
  if (!Number.isFinite(n)) return 3;
  return Math.min(4, Math.max(2, n));
})();

if (!fs.existsSync(romPath)) {
  console.error(`ROM not found: ${romPath}`);
  process.exit(1);
}

const url = `${baseURL.replace(/\/$/, "")}/pcsx-kxkx/index.html?riskbreaker=1`;

const logs = [];
const errors = [];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(600_000);

  page.on("console", (msg) => {
    const line = `[${msg.type()}] ${msg.text()}`;
    logs.push(line);
    if (logs.length <= 80) {
      process.stderr.write(line + "\n");
    }
  });
  page.on("pageerror", (err) => {
    const line = `pageerror: ${err.message}`;
    errors.push(line);
    process.stderr.write(line + "\n");
  });

  process.stderr.write(`Opening ${url}\n`);
  await page.goto(url, { waitUntil: "domcontentloaded" });
  if (riskbreakerSpeedHack || riskbreakerUpscaling || riskbreakerPerfHud) {
    await page.evaluate(
      ({ speed, scale, hud, internalScale }) => {
        try {
          if (speed) localStorage.setItem("riskbreaker:speedHack", "1");
          if (scale) {
            localStorage.setItem("riskbreaker:upscaling", "1");
            localStorage.setItem("riskbreaker:internalScale", String(internalScale));
          }
          if (hud) localStorage.setItem("riskbreaker:perfHud", "1");
        } catch {
          /* ignore */
        }
      },
      {
        speed: riskbreakerSpeedHack,
        scale: riskbreakerUpscaling,
        hud: riskbreakerPerfHud,
        internalScale: riskbreakerInternalScale,
      },
    );
    process.stderr.write(
      `Riskbreaker storage: speedHack=${riskbreakerSpeedHack} upscaling=${riskbreakerUpscaling} internalScale=${riskbreakerUpscaling ? riskbreakerInternalScale : "n/a"} perfHud=${riskbreakerPerfHud}\n`,
    );
  }
  await page.waitForTimeout(3000);

  process.stderr.write(`Attaching ROM (${(fs.statSync(romPath).size / 1e6).toFixed(0)} MB) — may take several minutes…\n`);
  await page.locator(".gui_upload").click();
  await page.setInputFiles("#iso_opener", romPath);

  process.stderr.write("Waiting for emulator canvas…\n");
  const canvas = page.locator("canvas#canvas").first();
  await canvas.waitFor({ state: "visible", timeout: 600_000 });

  process.stderr.write(
    `Polling every ${bootPollMs} ms for live main loop (max ${bootWaitMaxMs} ms, heartbeat stale ≤ ${bootHeartbeatStaleMs} ms${riskbreakerPerfHud ? ", require perf HUD FPS" : ""})…\n`,
  );
  const bootPollerStart = Date.now();
  try {
    await page.waitForFunction(
      ({ staleMs, needFpsHud }) => {
        const last = globalThis.__riskbreakerLastMainLoopFrameAt;
        const lrussoHeartbeatOk =
          typeof last === "number" && performance.now() - last <= staleMs;
        /** pcsx-kxkx: no lrusso glue — disc load sets `pcsx-game-active` on `body`. */
        const kxkxGameActive =
          document.body?.classList?.contains("pcsx-game-active") === true;
        const canvasEl = document.querySelector("canvas#canvas");
        const canvasOk = Boolean(canvasEl && canvasEl.width >= 2 && canvasEl.height >= 2);
        if (!lrussoHeartbeatOk && !(kxkxGameActive && canvasOk)) {
          return false;
        }
        if (needFpsHud) {
          const el = document.getElementById("rb-fps-readout");
          const t = el?.textContent ?? "";
          if (!/\d/.test(t) || !/FPS/i.test(t)) return false;
        }
        return true;
      },
      { staleMs: bootHeartbeatStaleMs, needFpsHud: riskbreakerPerfHud },
      { timeout: bootWaitMaxMs, polling: bootPollMs },
    );
  } catch {
    throw new Error(
      `Boot wait timed out after ${bootWaitMaxMs} ms (no lrusso heartbeat, no pcsx-kxkx game-active + canvas${riskbreakerPerfHud ? ", or perf HUD FPS readout" : ""}). Raise VAGRANT_STORY_BOOT_WAIT_MAX_MS.`,
    );
  }
  const bootWaitElapsedMs = Date.now() - bootPollerStart;
  process.stderr.write(`Main loop ready after ${bootWaitElapsedMs} ms.\n`);

  await canvas.click({ position: { x: 400, y: 300 } });

  let startMashPresses = 0;
  if (startMashesEnv !== undefined && startMashesEnv !== "") {
    const n = Number(startMashesEnv);
    process.stderr.write(
      `Mashing START (${n}× key "v", ${startMashDelayMs} ms apart) — VAGRANT_STORY_START_MASHES…\n`,
    );
    for (let i = 0; i < n; i++) {
      await page.keyboard.press("v");
      startMashPresses++;
      await page.waitForTimeout(startMashDelayMs);
    }
  } else {
    process.stderr.write(
      `Mashing START for ${startMashDurationMs} ms (key "v" every ${startMashDelayMs} ms) — ~1–2 min to 3D; tune VAGRANT_STORY_START_MASH_DURATION_MS…\n`,
    );
    const end = Date.now() + startMashDurationMs;
    while (Date.now() < end) {
      await page.keyboard.press("v");
      startMashPresses++;
      await page.waitForTimeout(startMashDelayMs);
    }
  }

  process.stderr.write(
    `Settling ${inGameWaitMs} ms before Triangle (VAGRANT_STORY_3D_SETTLE_MS)…\n`,
  );
  await page.waitForTimeout(inGameWaitMs);

  if (toggleCameraBeforeTriangle) {
    process.stderr.write(
      "VAGRANT_STORY_TOGGLE_CAMERA_BEFORE_TRIANGLE=1: one Start (v), then refocus — try to leave 1st person…\n",
    );
    await page.keyboard.press("v");
    await page.waitForTimeout(500);
    await canvas.click({ position: { x: 400, y: 300 } });
    await page.waitForTimeout(300);
  }

  fs.mkdirSync(outDir, { recursive: true });
  const before = path.join(outDir, "vagrant-story-real-before-triangle.png");
  const after = path.join(outDir, "vagrant-story-real-after-triangle.png");

  await page.screenshot({ path: before, fullPage: true });
  process.stderr.write(`Wrote ${before}\n`);

  process.stderr.write(
    "If Triangle does nothing: you may be in 1st person (Start in 3D toggles it) — try one \"v\" to return to field camera, then \"d\" again.\n",
  );
  process.stderr.write('Refocus canvas, then Triangle (key "d") — field menu…\n');
  await canvas.click({ position: { x: 400, y: 300 } });
  await page.waitForTimeout(400);
  await page.keyboard.press("d");
  await page.waitForTimeout(triangleHoldMs);
  await page.screenshot({ path: after, fullPage: true });
  process.stderr.write(`Wrote ${after}\n`);

  const marks = await page.evaluate(() => {
    try {
      return performance.getEntriesByType("mark").map((e) => e.name);
    } catch {
      return [];
    }
  });

  const report = {
    url,
    romPath,
    romBytes: fs.statSync(romPath).size,
    bootWaitMaxMs,
    bootPollMs,
    bootHeartbeatStaleMs,
    bootWaitElapsedMs,
    startMashPresses,
    startMashDelayMs,
    startMashDurationMs:
      startMashesEnv !== undefined && startMashesEnv !== ""
        ? null
        : startMashDurationMs,
    startMashesOverride:
      startMashesEnv !== undefined && startMashesEnv !== ""
        ? Number(startMashesEnv)
        : null,
    inGameWaitMs,
    triangleHoldMs,
    toggleCameraBeforeTriangle,
    riskbreakerSpeedHack,
    riskbreakerUpscaling,
    riskbreakerInternalScale: riskbreakerUpscaling ? riskbreakerInternalScale : null,
    riskbreakerPerfHud,
    screenshots: [before, after],
    performanceMarks: marks,
    consoleLineCount: logs.length,
    pageErrors: errors,
    sampleConsole: logs.slice(0, 40),
  };

  const reportPath = path.join(outDir, "vagrant-story-real-run-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  process.stderr.write(`Wrote ${reportPath}\n`);

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
