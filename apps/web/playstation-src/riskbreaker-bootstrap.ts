import type { RiskbreakerPlaystationGlobals } from "./playstation-globals.js";

/**
 * Mount shadow DOM + canvas under `#rb-playstation-host` (see playstation-engine-hacking.md).
 * `styleCustomText` is set by PlayStation.htm before this script loads.
 */
export function bootstrapRiskbreakerPlaystationHost(): void {
  const host = document.getElementById("rb-playstation-host");
  if (!host) {
    throw new Error("riskbreaker-bootstrap: missing #rb-playstation-host");
  }
  const hostElm = host as HTMLElement;
  const replacement = document.createElement("canvas");
  const shadow = hostElm.attachShadow({ mode: "open" });
  shadow.appendChild(replacement);
  const canvElm = replacement;
  try {
    hostElm.style.pointerEvents = "none";
    canvElm.style.pointerEvents = "auto";
  } catch {
    /* ignore */
  }
  const styleNode = document.createElement("style");
  const w = globalThis as unknown as { styleCustomText?: string };
  const text = typeof w.styleCustomText === "string" ? w.styleCustomText : "";
  styleNode.appendChild(document.createTextNode(text));
  shadow.appendChild(styleNode);

  const g = globalThis as typeof globalThis & RiskbreakerPlaystationGlobals;
  g.canvElm = canvElm;
  g.hostElm = hostElm;
  g.replacement = replacement;
  g.shadow = shadow;
}
