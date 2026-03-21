import { Link } from "react-router-dom";
import { useCallback, useRef, useState } from "react";

/**
 * Full-viewport embed like https://lrusso.github.io/PlayStation/PlayStation.htm — the
 * emulator document owns the window inside the iframe; we only add a thin top bar.
 */
export default function PlaySpikePage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState("Loading…");

  const focusEmulator = useCallback(() => {
    const w = iframeRef.current?.contentWindow;
    if (w) {
      try {
        w.focus();
      } catch {
        /* ignore */
      }
    }
    iframeRef.current?.focus();
  }, []);

  const onIframeLoad = useCallback(() => {
    setStatus("Ready");
    queueMicrotask(() => {
      focusEmulator();
    });
  }, [focusEmulator]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        margin: 0,
        padding: 0,
        background: "#000",
        zIndex: 1,
      }}
    >
      <header
        style={{
          position: "relative",
          flex: "0 0 auto",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.35rem 0.65rem",
          fontSize: "0.85rem",
          color: "#9aa3b8",
          background: "#0d0f14",
          borderBottom: "1px solid #1e2433",
        }}
      >
        <Link style={{ color: "#8ab4ff", whiteSpace: "nowrap" }} to="/">
          ← Mock shell
        </Link>
        <span style={{ opacity: 0.85 }}>Playable spike — {status}</span>
        <details style={{ marginLeft: "auto", fontSize: "0.8rem" }}>
          <summary style={{ cursor: "pointer", userSelect: "none" }}>Help</summary>
          <div
            style={{
              position: "absolute",
              right: "0.5rem",
              marginTop: "0.35rem",
              padding: "0.6rem 0.75rem",
              maxWidth: 320,
              background: "#1a1f2e",
              border: "1px solid #2c3344",
              borderRadius: 6,
              color: "#c4cad6",
              zIndex: 10,
            }}
          >
            Use the <strong>red Upload</strong> in the game area to load a <strong>.bin</strong>
            . Click the picture so keys (C/V/W/…) go to the game. Sound: speaker icon. Matches{" "}
            <a
              href="https://lrusso.github.io/PlayStation/PlayStation.htm"
              rel="noreferrer"
              target="_blank"
            >
              lrusso.github.io/PlayStation
            </a>
            .
          </div>
        </details>
      </header>

      <iframe
        ref={iframeRef}
        allow="autoplay; fullscreen; gamepad"
        tabIndex={0}
        title="PlayStation emulator"
        src="/playstation/PlayStation.htm"
        onLoad={onIframeLoad}
        style={{
          flex: 1,
          minHeight: 0,
          width: "100%",
          border: 0,
          display: "block",
          background: "#000",
        }}
      />
    </div>
  );
}
