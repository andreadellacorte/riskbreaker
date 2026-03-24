/**
 * RSK-74eh + RSK-xfc8: Riskbreaker overlay (`?riskbreaker=1`). Backquote toggles panel; menu toggles persist to `localStorage`.
 */
import type { RiskbreakerEmulatorHost } from "./emulator-bridge.js";
import {
  QUERY,
  STORAGE,
  readInternalScaleFactor,
  readStorageFlag,
  riskbreakerDebugQueryMatches as debugQueryMatchesFromUrl,
  riskbreakerSpikeQueryMatches,
  writeInternalScaleFactor,
  writeStorageFlag,
} from "./riskbreaker-query.js";

let riskbreakerOverlayInstalled = false;

function currentSearch(): string {
  try {
    // Prefer the Window URL (happy-dom / browsers). Node may expose `globalThis.location` with an empty search;
    // reading it first breaks tests that only assign `globalThis.window`.
    return (
      globalThis.window?.location?.search ??
      (globalThis as typeof globalThis & { location?: Location }).location?.search ??
      ""
    );
  } catch {
    return "";
  }
}

/** Exported for Vitest — mirrors `location.search` checks without requiring a browser. */
export { riskbreakerSpikeQueryMatches };

/** Re-export for tests; uses `QUERY.DEBUG` or `localStorage`. */
export function riskbreakerDebugQueryMatches(search: string): boolean {
  return debugQueryMatchesFromUrl(search);
}

function isRiskbreakerSpikeMode(): boolean {
  return riskbreakerSpikeQueryMatches(currentSearch());
}

function isRiskbreakerOverlayDebug(): boolean {
  return debugQueryMatchesFromUrl(currentSearch());
}

function debugLog(...args: unknown[]): void {
  if (!isRiskbreakerOverlayDebug()) return;
  console.debug("[riskbreaker-overlay]", ...args);
}

/**
 * Grave / backtick toggle — physical key varies by keyboard (ANSI `Backquote` vs ISO `IntlBackslash`).
 */
export function isBackquoteToggle(event: KeyboardEvent): boolean {
  if (event.repeat) return false;
  if (event.ctrlKey || event.metaKey || event.altKey) return false;

  const code = event.code;
  const key = event.key;
  const keyCode = (event as KeyboardEvent & { keyCode?: number }).keyCode;

  const match =
    code === "Backquote" ||
    code === "IntlBackslash" ||
    key === "`" ||
    keyCode === 192;

  if (isRiskbreakerOverlayDebug()) {
    debugLog("keydown", { code, key, keyCode, match });
  }

  return match;
}

function getHost(): RiskbreakerEmulatorHost | undefined {
  return globalThis.window?.__riskbreakerEmulatorHost;
}

function syncMenuToHost(): void {
  getHost()?.applyRuntimeControls?.();
}

function makeCheckboxRow(
  label: string,
  storageKey: string,
  title: string,
): { row: HTMLLabelElement; input: HTMLInputElement } {
  const row = document.createElement("label");
  row.style.cssText =
    "display:flex;align-items:flex-start;gap:10px;margin:10px 0 0 0;cursor:pointer;font-size:13px;color:#d0d6e8";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = readStorageFlag(storageKey);
  input.title = title;
  input.setAttribute("aria-label", label);
  const span = document.createElement("span");
  span.style.cssText = "flex:1;line-height:1.35";
  span.textContent = label;
  row.appendChild(input);
  row.appendChild(span);
  return { row, input };
}

export function installRiskbreakerOverlay(): void {
  if (riskbreakerOverlayInstalled) return;
  if (!isRiskbreakerSpikeMode()) return;
  riskbreakerOverlayInstalled = true;

  const root = document.createElement("div");
  root.id = "rb-riskbreaker-overlay";
  root.hidden = true;
  root.setAttribute("role", "region");
  root.setAttribute("aria-label", "Riskbreaker tools");
  root.setAttribute("aria-hidden", "true");

  root.style.cssText = [
    "position:fixed",
    "top:52px",
    "right:12px",
    "z-index:2147483646",
    "box-sizing:border-box",
    "width:min(360px,calc(100vw - 24px))",
    "padding:14px 16px",
    "border-radius:8px",
    "border:1px solid #2c3344",
    "background:#1a1f2e",
    "color:#e8e8ef",
    "font:500 14px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif",
    "box-shadow:0 8px 24px rgba(0,0,0,0.35)",
    "pointer-events:auto",
  ].join(";");

  const title = document.createElement("div");
  title.textContent = "Riskbreaker";
  title.style.cssText =
    "font-size:15px;font-weight:600;letter-spacing:0.02em;margin:0 0 6px 0;color:#e8e8ef";

  const hint = document.createElement("p");
  hint.textContent = "Runtime controls (saved in this browser). Press ` to hide.";
  hint.style.cssText = "margin:0;font-size:13px;color:#a8b0c4";

  const menuHeading = document.createElement("div");
  menuHeading.textContent = "Emulator";
  menuHeading.style.cssText = "margin:14px 0 0 0;font-size:12px;font-weight:600;color:#8a93a8;letter-spacing:0.04em";

  const { row: hudRow, input: hudInput } = makeCheckboxRow(
    "Perf HUD — frame timing (worker FPS + runIter ms)",
    STORAGE.PERF_HUD,
    "Bottom-left overlay: wall FPS from PCSX worker presents (not the browser main loop alone) and core timing when available.",
  );
  const { row: speedRow, input: speedInput } = makeCheckboxRow(
    "Speed hack — uncapped main loop (setImmediate)",
    STORAGE.SPEED_HACK,
    "Runs the emulator loop as fast as possible vs vsync rAF. Requires loaded game.",
  );

  const speedNote = document.createElement("p");
  speedNote.style.cssText =
    "margin:4px 0 0 22px;font-size:11px;color:#6b7388;line-height:1.45";
  speedNote.innerHTML =
    "Raises PCSX worker <strong>fake requestAnimationFrame</strong> cap (60→120 Hz) plus browser main-loop timing. " +
    "Higher FPS is still limited by the game/core (many 3D titles ~30 Hz output); audio may drift if the sim runs faster. " +
    '<a href="https://www.reddit.com/r/emulation/comments/dv2onc/what_are_emulation_speed_hacks_why_developers/" ' +
    'target="_blank" rel="noopener noreferrer">What “speed hacks” usually mean in emulation</a>.';

  const { row: scaleRow, input: scaleInput } = makeCheckboxRow(
    "Internal render upscale — higher SDL / canvas resolution (not CSS zoom)",
    STORAGE.UPSCALING,
    "2×–5× canvas backbuffer (bigger pixels). True higher-poly / HD rendering needs a different GPU path inside the WASM core (e.g. forked PCSX/DuckStation-style rebuild) — not available from JS alone. Page stretch: smooth by default; “Sharp pixel scaling” = nearest-neighbor.",
  );

  const scalePickerWrap = document.createElement("div");
  scalePickerWrap.style.cssText =
    "margin:6px 0 0 22px;display:flex;align-items:center;gap:8px;flex-wrap:wrap";
  const scalePickLabel = document.createElement("span");
  scalePickLabel.textContent = "Multiplier";
  scalePickLabel.style.cssText = "font-size:12px;color:#a8b0c4";
  const scaleSelect = document.createElement("select");
  scaleSelect.setAttribute("aria-label", "Internal render scale multiplier");
  for (const n of [2, 3, 4, 5] as const) {
    const opt = document.createElement("option");
    opt.value = String(n);
    opt.textContent = `${n}×`;
    scaleSelect.appendChild(opt);
  }
  scaleSelect.value = String(readInternalScaleFactor());
  scaleSelect.disabled = !scaleInput.checked;
  scalePickerWrap.appendChild(scalePickLabel);
  scalePickerWrap.appendChild(scaleSelect);

  const { row: pixelRow, input: pixelInput } = makeCheckboxRow(
    "Sharp pixel scaling (nearest-neighbor)",
    STORAGE.PIXELATED_PRESENT,
    "Off (default): smooth browser scaling when the canvas is stretched — usually better for textured 3D. On: crisp blocky pixels (good for 2D / test patterns).",
  );

  function onToggle(): void {
    writeStorageFlag(STORAGE.PERF_HUD, hudInput.checked);
    writeStorageFlag(STORAGE.SPEED_HACK, speedInput.checked);
    writeStorageFlag(STORAGE.UPSCALING, scaleInput.checked);
    writeStorageFlag(STORAGE.PIXELATED_PRESENT, pixelInput.checked);
    scaleSelect.disabled = !scaleInput.checked;
    syncMenuToHost();
    debugLog("menu toggles", {
      perfHud: hudInput.checked,
      speedHack: speedInput.checked,
      upscaling: scaleInput.checked,
      pixelatedPresent: pixelInput.checked,
    });
  }

  scaleSelect.addEventListener("change", () => {
    writeInternalScaleFactor(Number(scaleSelect.value));
    syncMenuToHost();
    debugLog("internal scale", scaleSelect.value);
  });

  hudInput.addEventListener("change", onToggle);
  speedInput.addEventListener("change", onToggle);
  scaleInput.addEventListener("change", onToggle);
  pixelInput.addEventListener("change", onToggle);

  const meta = document.createElement("p");
  meta.textContent = `Query: ?${QUERY.RISKBREAKER}=1 · debug: ?${QUERY.DEBUG}=1`;
  meta.style.cssText = "margin:12px 0 0 0;font-size:11px;color:#6b7388;word-break:break-all";

  root.appendChild(title);
  root.appendChild(hint);
  root.appendChild(menuHeading);
  root.appendChild(hudRow);
  root.appendChild(speedRow);
  root.appendChild(speedNote);
  root.appendChild(scaleRow);
  root.appendChild(scalePickerWrap);
  root.appendChild(pixelRow);
  root.appendChild(meta);

  document.body.appendChild(root);

  debugLog(
    `?${QUERY.DEBUG}=1 or localStorage['${STORAGE.DEBUG}']=1 — overlay key diagnostics use console.debug.`,
  );

  function setOpen(open: boolean): void {
    root.hidden = !open;
    root.setAttribute("aria-hidden", open ? "false" : "true");
  }

  window.addEventListener(
    "keydown",
    (event: KeyboardEvent) => {
      if (event.key === "Escape" && !root.hidden) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        setOpen(false);
        debugLog("escape → close");
        return;
      }
      if (!isBackquoteToggle(event)) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      debugLog("toggle overlay", { wasHidden: root.hidden });
      setOpen(root.hidden);
    },
    true,
  );
}
