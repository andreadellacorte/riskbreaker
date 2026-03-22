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
        <span style={{ marginLeft: "auto", opacity: 0.85 }}>Playable spike — {status}</span>
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
