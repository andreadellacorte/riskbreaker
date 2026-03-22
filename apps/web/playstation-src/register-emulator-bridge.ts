import { registerRiskbreakerEmulatorHost } from "./emulator-bridge.js";
import type { RiskbreakerPlaystationGlobals } from "./playstation-globals.js";

registerRiskbreakerEmulatorHost({
  getCanvas: () => {
    const g = globalThis as typeof globalThis & RiskbreakerPlaystationGlobals;
    return g.canvElm ?? null;
  },
  getWASMpsx: () => {
    const g = globalThis as typeof globalThis & RiskbreakerPlaystationGlobals;
    return g.WASMpsx ?? {};
  },
});
