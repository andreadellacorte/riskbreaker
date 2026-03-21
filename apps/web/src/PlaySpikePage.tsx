import { Link } from "react-router-dom";
import { useCallback, useRef, useState } from "react";

export default function PlaySpikePage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState("Loading emulator…");

  const focusEmulator = useCallback(() => {
    const w = iframeRef.current?.contentWindow;
    if (w) {
      try {
        w.focus();
      } catch {
        /* some browsers restrict focus; user can click the iframe */
      }
    }
    iframeRef.current?.focus();
  }, []);

  const onIframeLoad = useCallback(() => {
    setStatus("Ready — use the red Upload control inside the emulator to load a .bin.");
    queueMicrotask(() => {
      focusEmulator();
    });
  }, [focusEmulator]);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "1.5rem" }}>
      <header>
        <p style={{ marginBottom: "0.5rem" }}>
          <Link to="/">← Mock shell (default)</Link>
        </p>
        <h1 style={{ fontWeight: 600, fontSize: "1.5rem" }}>Playable spike — browser PS1</h1>
        <p style={{ color: "#9aa3b8" }}>
          Embedded <strong>lrusso/PlayStation</strong> (same build family as the{" "}
          <a
            href="https://lrusso.github.io/PlayStation/PlayStation.htm"
            rel="noreferrer"
            target="_blank"
          >
            author&apos;s demo
          </a>
          ): mute, fullscreen, and one Upload button inside the frame.
        </p>
      </header>

      <section style={{ marginTop: "1rem" }}>
        <iframe
          ref={iframeRef}
          allow="autoplay; fullscreen; gamepad"
          tabIndex={0}
          title="PlayStation emulator"
          src="/playstation/PlayStation.htm"
          onLoad={onIframeLoad}
          onMouseDown={focusEmulator}
          style={{
            width: "100%",
            minHeight: "min(80vh, 720px)",
            border: "1px solid #2a3344",
            borderRadius: 8,
            background: "#0a0c10",
          }}
        />
      </section>

      <section className="panel" style={{ marginTop: "1rem" }}>
        <p style={{ marginBottom: "0.75rem" }}>{status}</p>
        <p style={{ fontSize: "0.85rem", color: "#9aa3b8" }}>
          <strong>Controls:</strong> click once on the game view so the frame has focus, then
          use the keys shown in the overlay (e.g. C / V / W / E / R / T / Z / X / S / D). If
          keys do nothing, click the picture again — the parent page was receiving focus instead
          of the emulator.
        </p>
        <p style={{ fontSize: "0.85rem", color: "#9aa3b8", marginTop: "0.5rem" }}>
          Only <strong>.bin</strong> is accepted by this upstream UI. Use files you have the
          right to use; BIOS may be required (local <code>bins/</code>).
        </p>
      </section>
    </div>
  );
}
