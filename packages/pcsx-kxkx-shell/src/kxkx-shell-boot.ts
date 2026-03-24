/**
 * Single IIFE entry for `pcsx-kxkx/index.html`: register emulator host (canvas = #canvas), then Riskbreaker overlay.
 */
import { registerRiskbreakerEmulatorHost } from "./emulator-bridge.js";
import { installRiskbreakerOverlay } from "./riskbreaker-overlay.js";
import {
  applyPersistedRuntimeControls,
  wireRuntimeControlsToHost,
} from "./riskbreaker-runtime-controls.js";

registerRiskbreakerEmulatorHost(
  wireRuntimeControlsToHost({
    getCanvas: () => document.querySelector("canvas#canvas"),
    getWASMpsx: () => {
      const g = globalThis as { Module?: Record<string, unknown> };
      return g.Module ?? {};
    },
  }),
);

applyPersistedRuntimeControls();
setTimeout(applyPersistedRuntimeControls, 1500);
setTimeout(applyPersistedRuntimeControls, 4000);

installRiskbreakerOverlay();
