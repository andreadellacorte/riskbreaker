"use strict";
(() => {
  // apps/web/playstation-src/riskbreaker-overlay.ts
  var riskbreakerOverlayInstalled = false;
  function isRiskbreakerSpikeMode() {
    try {
      return /[?&]riskbreaker=1(?:&|$)/.test(location.search);
    } catch {
      return false;
    }
  }
  function isRiskbreakerOverlayDebug() {
    try {
      return /[?&]rbdebug=1(?:&|$)/.test(location.search);
    } catch {
      return false;
    }
  }
  function debugLog(...args) {
    if (!isRiskbreakerOverlayDebug()) return;
    console.debug("[riskbreaker-overlay]", ...args);
  }
  function isBackquoteToggle(event) {
    if (event.repeat) return false;
    if (event.ctrlKey || event.metaKey || event.altKey) return false;
    const code = event.code;
    const key = event.key;
    const keyCode = event.keyCode;
    const match = code === "Backquote" || code === "IntlBackslash" || key === "`" || keyCode === 192;
    if (isRiskbreakerOverlayDebug()) {
      debugLog("keydown", { code, key, keyCode, match });
    }
    return match;
  }
  function installRiskbreakerOverlay() {
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
      "pointer-events:auto"
    ].join(";");
    const title = document.createElement("div");
    title.textContent = "Riskbreaker";
    title.style.cssText = "font-size:15px;font-weight:600;letter-spacing:0.02em;margin:0 0 6px 0;color:#e8e8ef";
    const hint = document.createElement("p");
    hint.textContent = "Placeholder panel \u2014 future emulator tools land here. Press ` to hide.";
    hint.style.cssText = "margin:0;font-size:13px;color:#a8b0c4";
    const meta = document.createElement("p");
    meta.textContent = "Bridge: window.__riskbreakerEmulatorHost";
    meta.style.cssText = "margin:10px 0 0 0;font-size:12px;color:#8ab4ff;word-break:break-all";
    root.appendChild(title);
    root.appendChild(hint);
    root.appendChild(meta);
    document.body.appendChild(root);
    debugLog(
      "rbdebug=1 \u2014 keydown / toggle lines use console.debug (enable Verbose in DevTools to see them)."
    );
    function setOpen(open) {
      root.hidden = !open;
      root.setAttribute("aria-hidden", open ? "false" : "true");
    }
    window.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape" && !root.hidden) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          setOpen(false);
          debugLog("escape \u2192 close");
          return;
        }
        if (!isBackquoteToggle(event)) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        debugLog("toggle overlay", { wasHidden: root.hidden });
        setOpen(root.hidden);
      },
      true
    );
  }

  // apps/web/playstation-src/riskbreaker-overlay-boot.ts
  installRiskbreakerOverlay();
})();
