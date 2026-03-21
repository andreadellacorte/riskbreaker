import { Link } from "react-router-dom";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

type WasmpsxElement = HTMLElement & {
  readFile?: (file: File) => void;
  loadUrl?: (url: string) => void;
};

export default function PlaySpikePage() {
  const playerRef = useRef<WasmpsxElement | null>(null);
  const [status, setStatus] = useState("Mounting emulator host…");
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-riskbreaker-wasmpsx]",
    );
    if (existing) {
      setReady(true);
      setStatus("WASMpsx script already present. Choose a disc image.");
      return;
    }
    const s = document.createElement("script");
    s.src = "/wasmpsx/wasmpsx.min.js";
    s.async = true;
    s.setAttribute("data-riskbreaker-wasmpsx", "");
    s.onload = () => {
      setReady(true);
      setStatus(
        "WASMpsx loaded. Pick a PS1 disc image (.bin/.cue or similar) you legally own.",
      );
    };
    s.onerror = () => {
      setStatus("Failed to load /wasmpsx/wasmpsx.min.js — check that public assets exist.");
    };
    document.body.append(s);
  }, []);

  const onDiscChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const el = playerRef.current;
    if (!file || !el) {
      return;
    }
    if (typeof el.readFile === "function") {
      el.readFile(file);
      setStatus(`Loading ${file.name}…`);
      return;
    }
    setStatus("Emulator API not ready yet — wait a moment and try again.");
  }, []);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "1.5rem" }}>
      <header>
        <p style={{ marginBottom: "0.5rem" }}>
          <Link to="/">← Mock shell (default)</Link>
        </p>
        <h1 style={{ fontWeight: 600, fontSize: "1.5rem" }}>Playable spike — WASM PS1</h1>
        <p style={{ color: "#9aa3b8" }}>
          Bundled <strong>WASMpsx</strong> (MIT) — browser PlayStation emulator
          proof-of-concept. Not wired into Riskbreaker engines yet.
        </p>
      </header>

      <section className="panel" style={{ marginTop: "1rem" }}>
        <p style={{ marginBottom: "0.75rem" }}>{status}</p>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          <span style={{ marginRight: "0.5rem" }}>Disc image (local file)</span>
          <input
            accept=".bin,.img,.iso,.cue,.pbp"
            disabled={!ready}
            type="file"
            onChange={onDiscChange}
          />
        </label>
        <p style={{ fontSize: "0.85rem", color: "#9aa3b8" }}>
          Use files you have the right to use. BIOS may be required depending on build — place
          under <code>bins/</code> locally (see root README). This UI calls the upstream{" "}
          <code>readFile</code> API only.
        </p>
      </section>

      <section style={{ marginTop: "1rem" }}>
        <wasmpsx-player
          ref={playerRef}
          id="rb-wasmpsx-player"
          style={{ display: "block", minHeight: 240 }}
        />
      </section>
    </div>
  );
}
