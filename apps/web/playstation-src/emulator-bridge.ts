/**
 * RSK-7lri: minimal 2↔4 edge — no plugin imports. RSK-74eh overlay can read this from `window`.
 */
export interface RiskbreakerEmulatorHost {
  getCanvas: () => HTMLCanvasElement | null;
  getWASMpsx: () => Record<string, unknown>;
}

declare global {
  interface Window {
    __riskbreakerEmulatorHost?: RiskbreakerEmulatorHost;
  }
}

export function registerRiskbreakerEmulatorHost(host: RiskbreakerEmulatorHost): void {
  window.__riskbreakerEmulatorHost = host;
}
