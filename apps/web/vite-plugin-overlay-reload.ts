import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin, ViteDevServer } from "vite";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(appDir, "../..");

/**
 * Watches the esbuild-emitted overlay JS files in public/ and triggers a
 * full page reload in the browser whenever they change.
 */
export function overlayReloadPlugin(): Plugin {
  return {
    name: "overlay-reload",
    configureServer(server: ViteDevServer) {
      const files = [
        path.join(root, "apps/web/public/pcsx-wasm/js/riskbreaker-vs-panel.js"),
        path.join(root, "apps/web/public/pcsx-wasm/js/riskbreaker-vs-menu.js"),
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
