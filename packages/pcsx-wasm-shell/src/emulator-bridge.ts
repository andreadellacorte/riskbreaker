/**
 * RSK-7lri: minimal 2↔4 edge — no plugin imports. RSK-74eh overlay can read this from `window`.
 */
export interface RiskbreakerEmulatorHost {
  getCanvas: () => HTMLCanvasElement | null;
  getWASMpsx: () => Record<string, unknown>;
  /** RSK-xfc8 — optional; set when the emulator bundle has registered the bridge. */
  setPerfHudEnabled?: (enabled: boolean) => void;
  setSpeedHackEnabled?: (enabled: boolean) => void;
  setUpscalingEnabled?: (enabled: boolean) => void;
  /** 2–5 — internal SDL/canvas multiplier when upscaling is on. */
  setInternalScaleFactor?: (factor: number) => void;
  /** Re-read `localStorage` flags and apply (safe if main loop not ready yet). */
  applyRuntimeControls?: () => void;
  /**
   * RSK-wbmb: read raw bytes from the WASM linear memory (HEAPU8).
   * `address` is a WASM heap offset — NOT a PS1 virtual address.
   * Returns a Promise that resolves when the worker responds.
   */
  peek?: (address: number, length: number) => Promise<Uint8Array>;
}

declare global {
  interface Window {
    __riskbreakerEmulatorHost?: RiskbreakerEmulatorHost;
  }
}

export function registerRiskbreakerEmulatorHost(host: RiskbreakerEmulatorHost): void {
  window.__riskbreakerEmulatorHost = host;
}
