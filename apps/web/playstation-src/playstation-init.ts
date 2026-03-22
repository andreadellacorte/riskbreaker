import { WASM_FILE } from "./wasm-embed.js";
import { bootstrapRiskbreakerPlaystationHost } from "./riskbreaker-bootstrap.js";
import type { RiskbreakerPlaystationGlobals } from "./playstation-globals.js";

const g = globalThis as typeof globalThis & RiskbreakerPlaystationGlobals;
g.WASM_FILE = WASM_FILE;
bootstrapRiskbreakerPlaystationHost();
