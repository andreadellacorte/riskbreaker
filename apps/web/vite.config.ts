import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { workspaceAliases } from "../../vite.workspace.mjs";
import { overlayReloadPlugin } from "./vite-plugin-overlay-reload.js";
import { pcsxWasmWatchPlugin } from "./vite-plugin-pcsx-wasm-watch.js";
import { preloadPlugin } from "./vite-plugin-preload.js";
import { psxRamApiPlugin } from "./vite-plugin-psx-ram-api.js";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(appDir, "..", "..");

export default defineConfig({
  // Load .env / .env.local from the monorepo root, not from apps/web/.
  envDir: monorepoRoot,
  plugins: [
    react(),
    psxRamApiPlugin(),
    pcsxWasmWatchPlugin(),
    overlayReloadPlugin(),
    preloadPlugin({ repoRoot: monorepoRoot }),
  ],
  resolve: {
    alias: workspaceAliases(monorepoRoot),
  },
  server: {
    port: 5173,
    // Helps some Emscripten worker builds (SharedArrayBuffer / crossOriginIsolated) in Chromium.
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      // `credentialless` is softer than `require-corp` for Vite HMR while still enabling
      // `crossOriginIsolated` in Chromium (helps some WASM worker builds).
      "Cross-Origin-Embedder-Policy": "credentialless",
    },
  },
  preview: {
    port: 5173,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "credentialless",
    },
  },
});
