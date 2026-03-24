/**
 * RSK-xfc8: speed hack + internal-resolution upscaling + perf HUD — persisted under `localStorage` keys in `riskbreaker-query`.
 */
import type { RiskbreakerEmulatorHost } from "./emulator-bridge.js";
import type { RiskbreakerPlaystationGlobals } from "./playstation-globals.js";
import {
  STORAGE,
  readInternalScaleFactor,
  readStorageFlag,
  writeInternalScaleFactor,
  writeStorageFlag,
} from "./riskbreaker-query.js";
import { setPerfHudEnabled, syncPerfHudFromStorage } from "./perf-hud.js";

/** Narrowing for `globalThis` where `declare global` merge is not picked up by `tsc` on assignments. */
type RiskbreakerGlobalResize = typeof globalThis & {
  __riskbreakerCanvasUpscaleFactor?: number;
  __riskbreakerLastLogicalCanvasSize?: { w: number; h: number };
  __riskbreakerResizeCanvasInternal?: (logicalW: number, logicalH: number, factor: number) => void;
};

declare global {
  interface GlobalThis {
    __riskbreaker_set_main_loop_timing?: (mode: number, value: number) => number;
    /** Set by `riskbreaker-runtime-controls` — called after `_emscripten_set_main_loop` re-applies rAF timing. */
    __riskbreakerApplySpeedHackIfNeeded?: () => void;
    /** Set by `riskbreaker-runtime-controls` — emulated `runIter` calls per scheduler tick (glue caps at 64). */
    __riskbreakerRunnerBurstCount?: number;
    /** Set by `emscripten-glue.js` — calls `Browser.mainLoop.scheduler()` (same scope as `Browser`). */
    __riskbreakerKickScheduler?: () => void;
    /** 1 = native; 2–5 = multiply SDL_SetVideoMode / canvas backing store (see glue patch). */
    __riskbreakerCanvasUpscaleFactor?: number;
    /** Last logical size passed to `SDL_SetVideoMode` (pre-upscale). Set by glue. */
    __riskbreakerLastLogicalCanvasSize?: { w: number; h: number };
    /** Resize canvas buffer + GL viewport + SDL resize event (glue). */
    __riskbreakerResizeCanvasInternal?: (logicalW: number, logicalH: number, factor: number) => void;
    /** PCSX Web Worker handle — `emscripten-glue.js` (postMessage `setFakeRafHz`). */
    __riskbreakerPcsxWorker?: Worker;
    __riskbreakerPcsxWorkerActive?: boolean;
  }
}

/** PCSX worker uses `fakeRequestAnimationFrame` (~60 Hz); speed hack raises the step toward 120 Hz. */
const PCSX_SPEED_HACK_FAKE_RAF_HZ = 120;
const PCSX_NORMAL_FAKE_RAF_HZ = 60;

function applyPcsxWorkerFakeRafFromSpeedHack(enabled: boolean): void {
  const g = globalThis as typeof globalThis & {
    __riskbreakerPcsxWorker?: Worker;
    __riskbreakerPcsxWorkerActive?: boolean;
  };
  if (!g.__riskbreakerPcsxWorkerActive || !g.__riskbreakerPcsxWorker) return;
  try {
    g.__riskbreakerPcsxWorker.postMessage({
      cmd: "setFakeRafHz",
      hz: enabled ? PCSX_SPEED_HACK_FAKE_RAF_HZ : PCSX_NORMAL_FAKE_RAF_HZ,
    });
  } catch {
    /* older bundles without worker patch */
  }
}

/** Emscripten: 1 = rAF @ 1:1; 2 = setImmediate (see glue polyfill). */
const TIMING_RAF = 1;
const TIMING_VALUE_DEFAULT = 1;
const TIMING_IMMEDIATE = 2;

/**
 * Extra `runIter`/WASM frames per outer tick when speed hack is on — drives FPS counter & CPU use (glue caps at 64).
 * This is **not** a per-game patch: it uncaps our Emscripten main-loop scheduler (setImmediate vs rAF) so the core
 * can run ahead of display vsync — see https://www.reddit.com/r/emulation/comments/dv2onc/what_are_emulation_speed_hacks_why_developers/
 */
const SPEED_HACK_BURST = 16;

function getTimingApi():
  | ((mode: number, value: number) => number)
  | undefined {
  const g = globalThis as typeof globalThis & {
    __riskbreaker_set_main_loop_timing?: (mode: number, value: number) => number;
  };
  return g.__riskbreaker_set_main_loop_timing;
}

function applyRunnerBurst(enabled: boolean): void {
  const g = globalThis as { __riskbreakerRunnerBurstCount?: number };
  g.__riskbreakerRunnerBurstCount = enabled ? SPEED_HACK_BURST : 1;
}

function applySpeedHackTiming(enabled: boolean): void {
  applyRunnerBurst(enabled);
  applyPcsxWorkerFakeRafFromSpeedHack(enabled);
  const fn = getTimingApi();
  if (typeof fn !== "function") return;
  const kick = (globalThis as { __riskbreakerKickScheduler?: () => void }).__riskbreakerKickScheduler;
  try {
    if (enabled) {
      // Mode 2 queues runner via setImmediate (glue polyfill) — avoids rAF vsync; may still be WASM/audio bound.
      fn(TIMING_IMMEDIATE, 1);
    } else {
      fn(TIMING_RAF, TIMING_VALUE_DEFAULT);
    }
    if (enabled) kick?.();
  } catch (e) {
    console.warn("[riskbreaker] set_main_loop_timing / kick failed", e);
  }
}

export function setSpeedHackEnabled(enabled: boolean): void {
  writeStorageFlag(STORAGE.SPEED_HACK, enabled);
  applySpeedHackTiming(enabled);
}

/**
 * Re-apply uncapped timing if the user opted in — required because Emscripten resets timing to rAF
 * on `_emscripten_set_main_loop` and on later `_emscripten_set_main_loop_timing` (e.g. scene changes).
 */
export function applySpeedHackIfNeeded(): void {
  if (!readStorageFlag(STORAGE.SPEED_HACK)) return;
  applySpeedHackTiming(true);
}

/**
 * Internal resolution: SDL video mode + canvas backing-store pixels (see `emscripten-glue.js` patches).
 * Not CSS zoom — wasmpsx asks for e.g. 320×240; with factor 3 the glue requests 960×720 from SDL/canvas.
 */
function effectiveCanvasUpscaleFactor(): number {
  if (!readStorageFlag(STORAGE.UPSCALING)) return 1;
  return readInternalScaleFactor();
}

/**
 * How the browser scales the **displayed** canvas when CSS stretches it (internal resolution is still set via SDL).
 * Default **smooth** (`auto`) — typically nicer for PS1 **3D** (filtered textures). Optional **pixelated** for
 * sharp integer pixels (2D / test patterns). See overlay: “Sharp pixel scaling”.
 */
function applyCanvasPresentationStyle(upscaleFactor: number): void {
  const g = globalThis as typeof globalThis & Partial<RiskbreakerPlaystationGlobals>;
  const canvas = g.canvElm ?? g.replacement;
  if (!canvas?.style) return;

  if (upscaleFactor < 2) {
    canvas.style.removeProperty("image-rendering");
    return;
  }
  if (readStorageFlag(STORAGE.PIXELATED_PRESENT)) {
    canvas.style.imageRendering = "pixelated";
  } else {
    canvas.style.removeProperty("image-rendering");
    canvas.style.setProperty("image-rendering", "auto");
  }
}

/** Re-apply canvas CSS after storage changes (e.g. pixelated toggle) without re-running SDL resize. */
export function syncCanvasPresentationFromStorage(): void {
  const factor = readStorageFlag(STORAGE.UPSCALING) ? effectiveCanvasUpscaleFactor() : 1;
  applyCanvasPresentationStyle(factor);
}

function applyInternalUpscaling(enabled: boolean): void {
  const g = globalThis as RiskbreakerGlobalResize;
  const factor = enabled ? effectiveCanvasUpscaleFactor() : 1;
  g.__riskbreakerCanvasUpscaleFactor = factor;
  applyCanvasPresentationStyle(factor);

  const last = g.__riskbreakerLastLogicalCanvasSize;
  const resize = g.__riskbreakerResizeCanvasInternal;
  if (
    typeof resize === "function" &&
    last &&
    typeof last.w === "number" &&
    typeof last.h === "number" &&
    last.w > 2 &&
    last.h > 2
  ) {
    try {
      resize(last.w, last.h, factor);
    } catch {
      /* glue not ready */
    }
  }
}

function scheduleUpscaleResizeRetry(attemptsLeft: number): void {
  if (attemptsLeft <= 0) return;
  requestAnimationFrame(() => {
    if (!readStorageFlag(STORAGE.UPSCALING)) return;
    applyInternalUpscaling(true);
    const g = globalThis as RiskbreakerGlobalResize;
    const hasLogical = g.__riskbreakerLastLogicalCanvasSize;
    if (!hasLogical && attemptsLeft > 1) {
      scheduleUpscaleResizeRetry(attemptsLeft - 1);
    }
  });
}

export function setUpscalingEnabled(enabled: boolean): void {
  writeStorageFlag(STORAGE.UPSCALING, enabled);
  applyInternalUpscaling(enabled);
  if (enabled) {
    scheduleUpscaleResizeRetry(10);
  }
}

/** Persist internal scale (2–5) and re-apply SDL/canvas size when upscaling is on. */
export function setInternalScaleFactor(n: number): void {
  writeInternalScaleFactor(n);
  if (readStorageFlag(STORAGE.UPSCALING)) {
    applyInternalUpscaling(true);
    scheduleUpscaleResizeRetry(10);
  }
}

/** Apply all persisted flags from `localStorage` (call after host is ready). */
export function applyPersistedRuntimeControls(): void {
  syncPerfHudFromStorage();
  setSpeedHackEnabled(readStorageFlag(STORAGE.SPEED_HACK));
  setUpscalingEnabled(readStorageFlag(STORAGE.UPSCALING));
  syncCanvasPresentationFromStorage();
}

export function wireRuntimeControlsToHost(host: RiskbreakerEmulatorHost): RiskbreakerEmulatorHost {
  return {
    ...host,
    setPerfHudEnabled: (v: boolean) => setPerfHudEnabled(v),
    setSpeedHackEnabled: (v: boolean) => setSpeedHackEnabled(v),
    setUpscalingEnabled: (v: boolean) => setUpscalingEnabled(v),
    setInternalScaleFactor: (x: number) => setInternalScaleFactor(x),
    applyRuntimeControls: () => applyPersistedRuntimeControls(),
  };
}

(globalThis as unknown as { __riskbreakerApplySpeedHackIfNeeded?: () => void }).__riskbreakerApplySpeedHackIfNeeded =
  applySpeedHackIfNeeded;
