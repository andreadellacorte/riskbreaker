/**
 * RSK-74eh: Riskbreaker-branded overlay (tokens aligned with apps/web/src/index.css).
 * Toggle: Backquote (`). Only when `?riskbreaker=1` (spike / mock shell integration).
 *
 * Loaded from `riskbreaker-overlay-boot.js` in PlayStation.htm (before PlayStation.js)
 * so the overlay works before a disc is selected; idempotent if the main bundle also calls.
 */
let riskbreakerOverlayInstalled = false;

function isRiskbreakerSpikeMode(): boolean {
  try {
    return /[?&]riskbreaker=1(?:&|$)/.test(location.search);
  } catch {
    return false;
  }
}

/** `?rbdebug=1` — logs keydown code/key/keyCode (overlay toggle diagnostics; keep off in CI). */
function isRiskbreakerOverlayDebug(): boolean {
  try {
    return /[?&]rbdebug=1(?:&|$)/.test(location.search);
  } catch {
    return false;
  }
}

/** `?rbdebug=1` only. All overlay diagnostics go through here (uses `console.debug` — enable Verbose in DevTools). */
function debugLog(...args: unknown[]): void {
  if (!isRiskbreakerOverlayDebug()) return;
  console.debug("[riskbreaker-overlay]", ...args);
}

/**
 * Grave / backtick toggle — physical key varies by keyboard (ANSI `Backquote` vs ISO `IntlBackslash`).
 * `event.key === "`"` is what users see when typing; we also match legacy `keyCode` 192 (US OEM).
 */
function isBackquoteToggle(event: KeyboardEvent): boolean {
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
  hint.textContent = "Placeholder panel — future emulator tools land here. Press ` to hide.";
  hint.style.cssText = "margin:0;font-size:13px;color:#a8b0c4";

  const meta = document.createElement("p");
  meta.textContent = "Bridge: window.__riskbreakerEmulatorHost";
  meta.style.cssText = "margin:10px 0 0 0;font-size:12px;color:#8ab4ff;word-break:break-all";

  root.appendChild(title);
  root.appendChild(hint);
  root.appendChild(meta);

  document.body.appendChild(root);

  debugLog(
    "rbdebug=1 — keydown / toggle lines use console.debug (enable Verbose in DevTools to see them).",
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
