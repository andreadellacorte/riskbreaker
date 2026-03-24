/**
 * Single IIFE entry for `pcsx-wasm/index.html`: register emulator host (canvas = #canvas), then Riskbreaker overlay.
 */
import { registerRiskbreakerEmulatorHost } from "./emulator-bridge.js";
import { peekWorkerMemory } from "./emulator-peek.js";
import { loadWorkerState, saveWorkerState } from "./emulator-savestate.js";
import { installOverlayPanelRegistry } from "./overlay-panels.js";
import { installPsxRamApiClient } from "./psx-ram-api-client.js";
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
    peek: (address, length) => peekWorkerMemory(address, length),
  }),
);

applyPersistedRuntimeControls();
setTimeout(applyPersistedRuntimeControls, 1500);
setTimeout(applyPersistedRuntimeControls, 4000);

installOverlayPanelRegistry();
installRiskbreakerOverlay();
installPsxRamApiClient();

(globalThis as { __riskbreakerLoadState?: unknown }).__riskbreakerLoadState = loadWorkerState;
(globalThis as { __riskbreakerSaveState?: unknown }).__riskbreakerSaveState = saveWorkerState;
