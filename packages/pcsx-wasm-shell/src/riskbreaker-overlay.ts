/**
 * RSK-74eh + RSK-xfc8 + RSK-vs12: Riskbreaker overlay (`?riskbreaker=1`). Backquote toggles panel; menu toggles persist to `localStorage`.
 * Plugin panels registered via `overlay-panels.ts` are rendered generically below the emulator controls.
 */
import type { RiskbreakerEmulatorHost } from "./emulator-bridge.js";
import { loadWorkerState, saveWorkerState } from "./emulator-savestate.js";
import { getOverlayPanels, patchOverlayPanel } from "./overlay-panels.js";
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
  hint.textContent = "Runtime menu. Press ` to hide.";
  hint.style.cssText = "margin:0;font-size:13px;color:#a8b0c4";

  const menuHeading = document.createElement("div");
  menuHeading.textContent = "Emulator";
  menuHeading.style.cssText = "margin:14px 0 0 0;font-size:12px;font-weight:600;color:#8a93a8;letter-spacing:0.04em";

  const { row: hudRow, input: hudInput } = makeCheckboxRow(
    "Perf HUD (FPS + frame ms)",
    STORAGE.PERF_HUD,
    "Bottom-left FPS and frame timing from the emulator worker.",
  );
  const { row: speedRow, input: speedInput } = makeCheckboxRow(
    "Speed hack (uncapped loop)",
    STORAGE.SPEED_HACK,
    "Run the emulator loop as fast as possible. Requires a loaded game.",
  );

  const speedNote = document.createElement("p");
  speedNote.style.cssText =
    "margin:4px 0 0 22px;font-size:11px;color:#6b7388;line-height:1.45";
  speedNote.innerHTML =
    "Raises the worker <strong>fake requestAnimationFrame</strong> cap (60→120 Hz). " +
    "Game/core limits still apply (many 3D titles stay near ~30 Hz), and audio can drift. " +
    '<a href="https://www.reddit.com/r/emulation/comments/dv2onc/what_are_emulation_speed_hacks_why_developers/" ' +
    'target="_blank" rel="noopener noreferrer">What speed hacks mean</a>.';

  const { row: scaleRow, input: scaleInput } = makeCheckboxRow(
    "Internal upscale (render resolution)",
    STORAGE.UPSCALING,
    "2x-5x internal canvas scale. This is not true HD rendering; it needs core-level GPU changes.",
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
    "Off: smooth stretch (better for textured 3D). On: crisp pixels (good for 2D/tests).",
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

  // ── Save / Load State ──────────────────────────────────────────────────────────
  const stateHeading = document.createElement("div");
  stateHeading.textContent = "Save State";
  stateHeading.style.cssText =
    "margin:14px 0 0 0;font-size:12px;font-weight:600;color:#8a93a8;letter-spacing:0.04em";

  const stateActionsRow = document.createElement("div");
  stateActionsRow.style.cssText = "display:flex;gap:6px;margin:6px 0 0 0;flex-wrap:wrap";

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Save State";
  saveBtn.title = "Save emulator state and download as a .state file.";
  saveBtn.style.cssText =
    "background:#1e2840;border:1px solid #2c3344;color:#a8b0c4;cursor:pointer;font-size:11px;padding:3px 8px;border-radius:4px;line-height:1.4";
  saveBtn.addEventListener("click", () => {
    saveBtn.disabled = true;
    const orig = saveBtn.textContent;
    saveBtn.textContent = "…";
    void saveWorkerState()
      .then((bytes) => {
        const blob = new Blob([bytes], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const ts = new Date()
          .toISOString()
          .replace(/:/g, "-")
          .replace(/\..+/, "");
        const a = document.createElement("a");
        a.href = url;
        a.download = `vs-save-${ts}.state`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .finally(() => {
        saveBtn.disabled = false;
        saveBtn.textContent = orig;
      });
  });

  const loadBtn = document.createElement("button");
  loadBtn.textContent = "Load State";
  loadBtn.title = "Pick a .state file and load it into the emulator.";
  loadBtn.style.cssText =
    "background:#1e2840;border:1px solid #2c3344;color:#a8b0c4;cursor:pointer;font-size:11px;padding:3px 8px;border-radius:4px;line-height:1.4";

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".state";
  fileInput.style.display = "none";
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    loadBtn.disabled = true;
    const orig = loadBtn.textContent;
    loadBtn.textContent = "…";
    void file
      .arrayBuffer()
      .then((buf) => loadWorkerState(new Uint8Array(buf)))
      .finally(() => {
        loadBtn.disabled = false;
        loadBtn.textContent = orig;
        fileInput.value = "";
      });
  });
  loadBtn.addEventListener("click", () => {
    fileInput.click();
  });

  stateActionsRow.appendChild(saveBtn);
  stateActionsRow.appendChild(loadBtn);
  stateActionsRow.appendChild(fileInput);
  // ── end Save / Load State ─────────────────────────────────────────────────────

  // ── RSK-vs12: plugin panel container — populated by registered overlay panels ──
  const pluginPanelsContainer = document.createElement("div");
  pluginPanelsContainer.id = "rb-plugin-panels";
  // ── end RSK-vs12 ──────────────────────────────────────────────────────────────

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
  root.appendChild(stateHeading);
  root.appendChild(stateActionsRow);
  root.appendChild(pluginPanelsContainer);
  root.appendChild(meta);

  document.body.appendChild(root);

  debugLog(
    `?${QUERY.DEBUG}=1 or localStorage['${STORAGE.DEBUG}']=1 — overlay key diagnostics use console.debug.`,
  );

  function renderPluginPanels(): void {
    pluginPanelsContainer.innerHTML = "";
    for (const panel of getOverlayPanels()) {
      const heading = document.createElement("div");
      heading.dataset.panelId = panel.id;
      heading.textContent = panel.heading;
      heading.style.cssText =
        "margin:14px 0 0 0;font-size:12px;font-weight:600;color:#8a93a8;letter-spacing:0.04em;display:flex;align-items:center;gap:8px";

      if (panel.refresh) {
        const btn = document.createElement("button");
        btn.textContent = "↻";
        btn.title = "Refresh";
        btn.style.cssText =
          "background:none;border:none;color:#8a93a8;cursor:pointer;font-size:13px;padding:0;line-height:1";
        btn.addEventListener("click", () => {
          btn.disabled = true;
          btn.textContent = "…";
          void panel.refresh!().then((patch) => {
            patchOverlayPanel(panel.id, patch);
            renderPluginPanels();
          }).catch(() => {
            btn.disabled = false;
            btn.textContent = "↻";
          });
        });
        heading.appendChild(btn);
      }

      pluginPanelsContainer.appendChild(heading);

      if (panel.actions && panel.actions.length > 0) {
        const actionsRow = document.createElement("div");
        actionsRow.style.cssText = "display:flex;gap:6px;margin:6px 0 0 0;flex-wrap:wrap";
        for (const action of panel.actions) {
          const btn = document.createElement("button");
          btn.textContent = action.label;
          if (action.title) btn.title = action.title;
          btn.style.cssText =
            "background:#1e2840;border:1px solid #2c3344;color:#a8b0c4;cursor:pointer;font-size:11px;padding:3px 8px;border-radius:4px;line-height:1.4";
          btn.addEventListener("click", () => {
            btn.disabled = true;
            const orig = btn.textContent;
            btn.textContent = "…";
            void Promise.resolve(action.onClick()).finally(() => {
              btn.disabled = false;
              btn.textContent = orig;
            });
          });
          actionsRow.appendChild(btn);
        }
        pluginPanelsContainer.appendChild(actionsRow);
      }

      if (panel.summary) {
        const summary = document.createElement("p");
        summary.textContent = panel.summary;
        summary.dataset.panelSummary = panel.id;
        summary.style.cssText = "margin:6px 0 0 0;font-size:11px;color:#6b7388";
        pluginPanelsContainer.appendChild(summary);
      }

      if (panel.rows.length > 0) {
        const table = document.createElement("div");
        table.dataset.panelRows = panel.id;
        table.style.cssText =
          "margin:6px 0 0 0;border:1px solid #1e2840;border-radius:3px;overflow:hidden";
        for (const row of panel.rows) {
          const rowEl = document.createElement("div");
          rowEl.dataset.rowLabel = row.label;
          rowEl.style.cssText =
            "display:flex;align-items:center;gap:8px;padding:6px 8px;border-bottom:1px solid #161e38;font-size:12px";
          const label = document.createElement("span");
          label.textContent = row.label;
          label.style.cssText = "flex:1;color:#c8cfe8";
          const value = document.createElement("span");
          value.dataset.rowValue = row.label;
          value.textContent = row.value;
          value.style.cssText = "color:#4a5270;font-size:10px;min-width:80px;text-align:right";
          rowEl.appendChild(label);
          if (row.badge) {
            const badge = document.createElement("span");
            badge.textContent = row.badge;
            badge.style.cssText =
              "color:#86efac;font-size:10px;letter-spacing:0.06em;text-transform:uppercase";
            rowEl.appendChild(badge);
          }
          rowEl.appendChild(value);
          table.appendChild(rowEl);
        }
        pluginPanelsContainer.appendChild(table);
      }

      if (panel.note) {
        const note = document.createElement("p");
        note.textContent = panel.note;
        note.style.cssText = "margin:4px 0 0 0;font-size:10px;color:#3a4260;font-style:italic";
        pluginPanelsContainer.appendChild(note);
      }
    }
  }

  function setOpen(open: boolean): void {
    root.hidden = !open;
    root.setAttribute("aria-hidden", open ? "false" : "true");
    if (open) renderPluginPanels();
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
