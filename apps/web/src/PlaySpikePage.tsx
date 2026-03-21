import { Link } from "react-router-dom";
import { useCallback, useRef, useState } from "react";

/**
 * lrusso/PlayStation (iframe) exposes `window.readFile` on the iframe's window once
 * `PlayStation.htm` has loaded. Same-origin, so we forward the parent file picker.
 */
type PlayStationWindow = Window & {
  readFile?: (files: FileList) => void;
};

export default function PlaySpikePage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState("Loading emulator…");
  const [ready, setReady] = useState(false);

  const onIframeLoad = useCallback(() => {
    setReady(true);
    setStatus(
      "Ready — choose a .bin below, or use Upload in the emulator. Sound: use the speaker icon in-frame.",
    );
  }, []);

  const onDiscChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    const w = iframeRef.current?.contentWindow as PlayStationWindow | null;
    if (typeof w?.readFile === "function") {
      const dt = new DataTransfer();
      dt.items.add(file);
      w.readFile(dt.files);
      setStatus(`Sent to emulator: ${file.name} …`);
      return;
    }
    setStatus("Emulator not ready yet — wait for the frame to finish loading.");
  }, []);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "1.5rem" }}>
      <header>
        <p style={{ marginBottom: "0.5rem" }}>
          <Link to="/">← Mock shell (default)</Link>
        </p>
        <h1 style={{ fontWeight: 600, fontSize: "1.5rem" }}>Playable spike — browser PS1</h1>
        <p style={{ color: "#9aa3b8" }}>
          Embedded <strong>lrusso/PlayStation</strong> (WASM, based on WASMpsx). The in-frame UI
          supports mute, fullscreen, and upload; the file input below forwards to the same{" "}
          <code>readFile</code> hook.
        </p>
      </header>

      <section style={{ marginTop: "1rem" }}>
        <iframe
          ref={iframeRef}
          title="PlayStation emulator"
          src="/playstation/PlayStation.htm"
          onLoad={onIframeLoad}
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
        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          <span style={{ marginRight: "0.5rem" }}>Disc image (local .bin)</span>
          <input
            accept=".bin"
            disabled={!ready}
            type="file"
            onChange={onDiscChange}
          />
        </label>
        <p style={{ fontSize: "0.85rem", color: "#9aa3b8" }}>
          This build only validates <strong>.bin</strong> in the upstream UI (same as{" "}
          <a
            href="https://lrusso.github.io/PlayStation/PlayStation.htm"
            rel="noreferrer"
            target="_blank"
          >
            the author&apos;s demo
          </a>
          ). <strong>.cue</strong> needs sibling track files; use a single <strong>.bin</strong> or{" "}
          <strong>.iso</strong> workflow elsewhere until we extend validation. Use files you have the
          right to use; BIOS may be required (local <code>bins/</code>).
        </p>
      </section>
    </div>
  );
}
