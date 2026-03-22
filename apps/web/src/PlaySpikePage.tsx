import { useEffect } from "react";

/** Full-page emulator URL (same document as https://lrusso.github.io/PlayStation/PlayStation.htm — no iframe). */
const PLAYSTATION_SPIKE = "/playstation/PlayStation.htm?riskbreaker=1";

/**
 * `/play/spike` immediately redirects to the static PlayStation shell. If iframe
 * embedding breaks clicks, the full-page load matches upstream behavior.
 */
export default function PlaySpikePage() {
  useEffect(() => {
    window.location.replace(PLAYSTATION_SPIKE);
  }, []);

  return (
    <div style={{ padding: "2rem", color: "#9aa3b8" }}>
      <p>Opening the PlayStation emulator…</p>
      <p style={{ fontSize: "0.88rem" }}>
        If nothing happens,{" "}
        <a href={PLAYSTATION_SPIKE} style={{ color: "#8ab4ff" }}>
          open it directly
        </a>
        .
      </p>
    </div>
  );
}
