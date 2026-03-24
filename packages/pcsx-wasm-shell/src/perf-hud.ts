/**
 * RSK-xfc8: on-screen perf HUD — FPS from inter-arrival time between hook callbacks (EMA), core ms from `runIter`.
 * PCSX: worker `render` → `__riskbreakerOnWorkerRender`; non-PCSX: `runIter` burst via `__riskbreakerOnEmulatedFrames`.
 */
import { STORAGE, readStorageFlag, writeStorageFlag } from "./riskbreaker-query.js";

const HUD_ID = "rb-perf-hud";
const FPS_READOUT_ID = "rb-fps-readout";
const DETAIL_ID = "rb-perf-detail";
const EMA_ALPHA = 0.12;

let emaFrameMs = 0;
/** EMA of wall ms between hook callbacks (instant ms = 1000 / instant fps). */
let rollingAvgMs = 0;
let rollingFps = 0;
/** Previous distinct `performance.now()` used for inter-arrival FPS (see `framesCoalescedSameTimestamp`). */
let lastNotifyAt = 0;
/** Frames not yet attributed to a wall-clock interval (same `performance.now()` as `lastNotifyAt`). */
let framesCoalescedSameTimestamp = 0;
/** Optional: inner `runIter` / dynCall time (may be sub-resolution on some engines). */
let lastRunIterMs = 0;
let rafScheduled = false;
/** rAF flush when worker delivers multiple renders in one `performance.now()` bucket. */
let coalescedFlushRaf = 0;
/** rAF fallback sampler when glue hooks are missing in the loaded PCSX bundle. */
let fallbackSamplerRaf = 0;
/** Last frame sample timestamp originating from real worker/emulated-frame hooks. */
let lastRealHookSampleAt = 0;

/**
 * In-memory flag updated by `setPerfHudEnabled` — do not read `localStorage` on every main-loop frame
 * (hooks must see the menu toggle immediately; storage can lag one tick in some environments).
 */
let perfHudEnabled = false;
try {
  perfHudEnabled = readStorageFlag(STORAGE.PERF_HUD);
} catch {
  perfHudEnabled = false;
}

function formatMs(ms: number): string {
  if (Number.isNaN(ms) || ms < 0) return "—";
  if (ms < 0.01) return `${(ms * 1000).toFixed(1)} μs`;
  if (ms < 1) return `${ms.toFixed(3)} ms`;
  return `${ms.toFixed(2)} ms`;
}

function ensureHudElement(): HTMLElement | null {
  let el = document.getElementById(HUD_ID);
  if (el) return el;
  el = document.createElement("div");
  el.id = HUD_ID;
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", "polite");
  el.setAttribute("aria-label", "Emulator FPS and frame timing");
  el.style.cssText = [
    "position:fixed",
    "left:8px",
    "bottom:8px",
    "z-index:2147483645",
    "pointer-events:none",
    "box-sizing:border-box",
    "padding:8px 12px",
    "border-radius:8px",
    "border:1px solid #3d4659",
    "background:rgba(26,31,46,0.92)",
    "color:#c8d0e0",
    "font:600 12px/1.35 ui-monospace,Menlo,Consolas,monospace",
    "text-shadow:0 1px 2px rgba(0,0,0,0.4)",
    "display:none",
    "min-width:11em",
  ].join(";");
  const fpsRow = document.createElement("div");
  fpsRow.id = FPS_READOUT_ID;
  fpsRow.style.cssText =
    "font-size:22px;font-weight:800;line-height:1.1;letter-spacing:0.02em;color:#7dffb0;font-variant-numeric:tabular-nums";
  fpsRow.textContent = "—";
  const detail = document.createElement("div");
  detail.id = DETAIL_ID;
  detail.style.cssText = "margin-top:6px;font-size:11px;font-weight:600;opacity:0.92;color:#aeb8cc";
  detail.textContent = "";
  el.appendChild(fpsRow);
  el.appendChild(detail);
  document.body.appendChild(el);
  return el;
}

function updateHudText(): void {
  const el = document.getElementById(HUD_ID);
  if (!el || el.style.display === "none") return;
  const fpsEl = document.getElementById(FPS_READOUT_ID);
  const detailEl = document.getElementById(DETAIL_ID);
  const ema = emaFrameMs > 0 ? emaFrameMs : rollingAvgMs;
  const core =
    lastRunIterMs > 5e-4 ? ` · core ${formatMs(lastRunIterMs)}` : "";
  if (rollingFps <= 0 && emaFrameMs <= 0 && lastNotifyAt > 0) {
    if (fpsEl) fpsEl.textContent = "…";
    if (detailEl) detailEl.textContent = `awaiting interval${core}`;
    return;
  }
  const rawFps =
    rollingFps > 0 ? rollingFps : ema > 0 ? 1000 / ema : 0;
  const fpsDisp =
    rawFps > 0 ? Math.max(1, Math.round(rawFps)) : 0;
  if (fpsEl) {
    fpsEl.textContent = fpsDisp > 0 ? `${fpsDisp} FPS` : "—";
  }
  if (detailEl) {
    const avgLabel = rollingAvgMs > 0 ? formatMs(rollingAvgMs) : "—";
    const emaLabel = ema > 0 ? formatMs(ema) : "—";
    detailEl.textContent = `avg ${avgLabel} wall · EMA ${emaLabel}${core}`;
  }
}

function scheduleHudRefresh(): void {
  if (rafScheduled) return;
  rafScheduled = true;
  requestAnimationFrame(() => {
    rafScheduled = false;
    updateHudText();
  });
}

function stopFallbackSampler(): void {
  if (fallbackSamplerRaf !== 0) {
    cancelAnimationFrame(fallbackSamplerRaf);
    fallbackSamplerRaf = 0;
  }
}

function startFallbackSamplerIfNeeded(): void {
  if (fallbackSamplerRaf !== 0) return;
  const tick = () => {
    if (!isPerfHudEnabled()) {
      fallbackSamplerRaf = 0;
      return;
    }
    const now = performance.now();
    // Use browser rAF as a last resort only; if real hooks are active, fallback stays passive.
    if (lastRealHookSampleAt === 0 || now - lastRealHookSampleAt > 250) {
      notifyPerfHudFrames(1, "fallback");
    }
    fallbackSamplerRaf = requestAnimationFrame(tick);
  };
  fallbackSamplerRaf = requestAnimationFrame(tick);
}

function applyEmaFromInterval(dt: number, totalFrames: number): void {
  if (dt <= 0 || totalFrames <= 0) return;
  const instantFps = (totalFrames / dt) * 1000;
  rollingFps =
    rollingFps === 0
      ? instantFps
      : rollingFps * (1 - EMA_ALPHA) + instantFps * EMA_ALPHA;
  rollingAvgMs = 1000 / rollingFps;
  emaFrameMs =
    emaFrameMs === 0
      ? rollingAvgMs
      : emaFrameMs * (1 - EMA_ALPHA) + rollingAvgMs * EMA_ALPHA;
}

function cancelCoalescedFlush(): void {
  if (coalescedFlushRaf !== 0) {
    cancelAnimationFrame(coalescedFlushRaf);
    coalescedFlushRaf = 0;
  }
}

function scheduleCoalescedFlush(): void {
  if (coalescedFlushRaf !== 0) return;
  coalescedFlushRaf = requestAnimationFrame(() => {
    coalescedFlushRaf = 0;
    if (lastNotifyAt <= 0 || framesCoalescedSameTimestamp <= 0) return;
    const now = performance.now();
    const dt = now - lastNotifyAt;
    if (dt <= 0) {
      scheduleCoalescedFlush();
      return;
    }
    const totalFrames = framesCoalescedSameTimestamp;
    applyEmaFromInterval(dt, totalFrames);
    lastNotifyAt = now;
    framesCoalescedSameTimestamp = 0;
    if (!perfHudEnabled && readStorageFlag(STORAGE.PERF_HUD)) {
      perfHudEnabled = true;
    }
    if (isPerfHudEnabled()) scheduleHudRefresh();
  });
}

function notifyPerfHudFrames(
  emulated: number,
  source: "hook" | "fallback" = "hook",
): void {
  const n = emulated > 0 ? emulated : 1;
  const now = performance.now();
  if (source === "hook") lastRealHookSampleAt = now;
  if (lastNotifyAt === 0) {
    lastNotifyAt = now;
    framesCoalescedSameTimestamp = n;
    scheduleCoalescedFlush();
  } else {
    const dt = now - lastNotifyAt;
    if (dt <= 0) {
      framesCoalescedSameTimestamp += n;
      scheduleCoalescedFlush();
    } else {
      cancelCoalescedFlush();
      const totalFrames = framesCoalescedSameTimestamp + n;
      applyEmaFromInterval(dt, totalFrames);
      lastNotifyAt = now;
      framesCoalescedSameTimestamp = 0;
    }
  }
  if (!perfHudEnabled && readStorageFlag(STORAGE.PERF_HUD)) {
    perfHudEnabled = true;
  }
  if (!isPerfHudEnabled()) return;
  scheduleHudRefresh();
}

function recordRunIter(ms: number): void {
  lastRunIterMs = ms;
  if (!perfHudEnabled && readStorageFlag(STORAGE.PERF_HUD)) {
    perfHudEnabled = true;
  }
  if (!isPerfHudEnabled()) return;
  scheduleHudRefresh();
}

function isPerfHudEnabled(): boolean {
  return perfHudEnabled;
}

/**
 * Patched in `emscripten-glue.js`:
 * - PCSX: `__riskbreakerOnWorkerRender` after each worker `render` (reliable wall FPS).
 * - Non-worker: `__riskbreakerOnEmulatedFrames(burst)` at end of patched `runIter`.
 * - `__riskbreakerOnRunIter` = inner dynCall timing (core ms).
 */
export function installPerfHudGlobalHook(): void {
  const g = globalThis as typeof globalThis & {
    __riskbreakerOnMainLoopFrame?: (ms: number) => void;
    __riskbreakerOnRunIter?: (ms: number) => void;
    __riskbreakerOnEmulatedFrames?: (n: number) => void;
    __riskbreakerOnWorkerRender?: () => void;
  };
  g.__riskbreakerOnEmulatedFrames = (n: number) => {
    if (
      (globalThis as { __riskbreakerPcsxWorkerActive?: boolean }).__riskbreakerPcsxWorkerActive === true
    ) {
      return;
    }
    notifyPerfHudFrames(n, "hook");
  };
  g.__riskbreakerOnWorkerRender = () => {
    notifyPerfHudFrames(1, "hook");
  };
  g.__riskbreakerOnMainLoopFrame = () => {
    /* wall FPS comes from emulated-frame / worker-render hooks, not Browser.mainLoop.runner */
  };
  g.__riskbreakerOnRunIter = (ms: number) => {
    recordRunIter(ms);
  };
}

export function setPerfHudEnabled(enabled: boolean): void {
  perfHudEnabled = enabled;
  writeStorageFlag(STORAGE.PERF_HUD, enabled);
  const el = ensureHudElement();
  if (!el) return;
  if (enabled) {
    /* Do not reset wall/FPS samples on enable — PCSX may not emit another worker render
     * immediately after opening the HUD; clearing would strand the readout at "—". */
    el.style.display = "block";
    el.setAttribute("aria-hidden", "false");
    startFallbackSamplerIfNeeded();
    updateHudText();
  } else {
    /* Do not reset wall samples here — `syncPerfHudFromStorage` / delayed
     * `applyPersistedRuntimeControls` would call `setPerfHudEnabled(false)` while
     * storage is still "0" and wipe FPS history before the user opens the HUD. */
    el.style.display = "none";
    el.setAttribute("aria-hidden", "true");
    stopFallbackSampler();
  }
}

export function syncPerfHudFromStorage(): void {
  setPerfHudEnabled(readStorageFlag(STORAGE.PERF_HUD));
}

installPerfHudGlobalHook();
