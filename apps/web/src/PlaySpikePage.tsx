import { useEffect, useMemo } from "react";

/** Full-page PCSX-wasm shell — static `public/pcsx-wasm/index.html`. */
function pcsxSpikeHref(): string {
  const params = new URLSearchParams(window.location.search);
  params.set("riskbreaker", "1");
  return `/pcsx-wasm/index.html?${params.toString()}`;
}

/**
 * `/play/spike` immediately redirects to the static PlayStation shell. If iframe
 * embedding breaks clicks, the full-page load matches upstream behavior.
 * Query params (e.g. `pcsxBootLog=1`, `pcsxAutoload=1`) are preserved from the React URL.
 */
export default function PlaySpikePage() {
  const spikeUrl = useMemo(() => pcsxSpikeHref(), []);

  useEffect(() => {
    window.location.replace(spikeUrl);
  }, [spikeUrl]);

  return (
    <div style={{ padding: "2rem", color: "#9aa3b8" }}>
      <p>Opening the PlayStation emulator…</p>
      <p style={{ fontSize: "0.88rem" }}>
        If nothing happens,{" "}
        <a href={spikeUrl} style={{ color: "#8ab4ff" }}>
          open it directly
        </a>
        .
      </p>
    </div>
  );
}
