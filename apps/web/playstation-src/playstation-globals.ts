/**
 * RSK-7lri: globals shared between init, emulator glue, and the Riskbreaker bridge.
 * Populated on globalThis before `emscripten-glue.js` runs.
 */
export interface RiskbreakerPlaystationGlobals {
  WASM_FILE: string;
  canvElm: HTMLCanvasElement;
  hostElm: HTMLElement;
  replacement: HTMLCanvasElement;
  shadow: ShadowRoot;
  WASMpsx?: Record<string, unknown>;
}
