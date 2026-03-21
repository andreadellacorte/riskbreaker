import { Link } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";

type WasmpsxElement = HTMLElement & {
  readFile?: (file: File) => void;
  loadUrl?: (url: string) => void;
};

const PLAYER_ID = "rb-wasmpsx-player";

function styleWasmpsxCanvas(): void {
  const host = document.getElementById(PLAYER_ID);
  const canvas = host?.shadowRoot?.querySelector("canvas");
  if (!canvas) {
    return;
  }
  canvas.style.border = "0";
  canvas.style.backgroundColor = "black";
  canvas.style.display = "block";
  canvas.style.margin = "auto";
  canvas.style.maxWidth = "100%";
  canvas.style.height = "auto";
}

function loadWasmpsxScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-riskbreaker-wasmpsx]",
    );
    if (existing) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = "/wasmpsx/wasmpsx.min.js";
    s.async = true;
    s.setAttribute("data-riskbreaker-wasmpsx", "");
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("failed to load wasmpsx.min.js"));
    document.body.append(s);
  });
}

/**
 * WASMpsx attaches `readFile` / `loadUrl` to the *first* `wasmpsx-player` in the document
 * at the moment its bundle executes. With React 18 Strict Mode, the script must load *after*
 * the dev double-mount settles, or methods end up on a detached node — so we defer injection
 * and always resolve the live host via {@link PLAYER_ID}.
 */
function getWasmpsxHost(): WasmpsxElement | null {
  return document.getElementById(PLAYER_ID) as WasmpsxElement | null;
}

export default function PlaySpikePage() {
  const [status, setStatus] = useState("Preparing emulator host…");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const run = (): void => {
      void (async () => {
        try {
          setStatus("Loading WASMpsx…");
          await loadWasmpsxScript();
          setStatus("WASMpsx loaded. Choose a disc image (see format notes below).");
          setReady(true);
          setTimeout(() => {
            styleWasmpsxCanvas();
            setTimeout(styleWasmpsxCanvas, 400);
          }, 100);
        } catch {
          setStatus("Failed to load /wasmpsx/wasmpsx.min.js — check devtools Network tab.");
        }
      })();
    };

    const t = window.setTimeout(run, 0);
    return () => {
      window.clearTimeout(t);
    };
  }, []);

  const onDiscChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    const host = getWasmpsxHost();
    const read = host?.readFile;
    if (typeof read === "function") {
      read.call(host, file);
      setStatus(`Sent to emulator: ${file.name} …`);
      setTimeout(styleWasmpsxCanvas, 200);
      return;
    }
    setStatus(
      "Emulator API not ready (no readFile on host). Hard-refresh the page and try again.",
    );
  }, []);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "1.5rem" }}>
      <header>
        <p style={{ marginBottom: "0.5rem" }}>
          <Link to="/">← Mock shell (default)</Link>
        </p>
        <h1 style={{ fontWeight: 600, fontSize: "1.5rem" }}>Playable spike — WASM PS1</h1>
        <p style={{ color: "#9aa3b8" }}>
          Bundled <strong>WASMpsx</strong> (MIT). There is no separate &quot;Play&quot; button —
          choosing a file calls the upstream <code>readFile</code> hook immediately.
        </p>
      </header>

      {/* Host must be in the document before wasmpsx.min.js runs (see bundle line 1). */}
      <section style={{ marginTop: "1rem" }}>
        <wasmpsx-player
          id={PLAYER_ID}
          style={{ display: "block", minHeight: 240, width: "100%" }}
        />
      </section>

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
          This WASMpsx build often works best with a single <strong>.bin</strong> or{" "}
          <strong>.iso</strong> — a <strong>.cue</strong> alone usually fails here because the
          browser only passes <em>one</em> file; cue sheets expect sibling track files on disk.
          Use files you have the right to use; BIOS may be required (local <code>bins/</code>).
          <strong> Sound:</strong> WASMpsx typically has <strong>no SPU audio</strong> in the
          browser (same as upstream). Planned follow-up: Groove <strong>RSK-l7qs</strong>{" "}
          (lrusso/PlayStation migration for audio).
        </p>
      </section>
    </div>
  );
}
