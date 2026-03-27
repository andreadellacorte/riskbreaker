import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin, ViteDevServer } from "vite";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(appDir, "../..");

/**
 * Watches Riskbreaker + PCSX artifacts under public/ and triggers a full page
 * reload when they change (esbuild --watch for overlay bundles; sync-pcsx-wasm
 * or `make` for worker / pcsx_ui).
 */
export function overlayReloadPlugin(): Plugin {
  return {
    name: "overlay-reload",
    configureServer(server: ViteDevServer) {
      const files = [
        path.join(root, "apps/web/public/pcsx-wasm/js/riskbreaker-vs-panel.js"),
        path.join(root, "apps/web/public/pcsx-wasm/js/riskbreaker-vs-menu.js"),
        path.join(root, "apps/web/public/pcsx-wasm/pcsx_worker.js"),
        path.join(root, "apps/web/public/pcsx-wasm/pcsx_worker.wasm"),
        path.join(root, "apps/web/public/pcsx-wasm/js/pcsx_ui.js"),
        path.join(root, "apps/web/public/pcsx-wasm/js/worker_funcs.js"),
      ];

      for (const file of files) {
        server.watcher.add(file);
      }

      server.watcher.on("change", (changed) => {
        if (files.includes(changed)) {
          server.ws.send({ type: "full-reload" });
        }
      });
    },
  };
}
