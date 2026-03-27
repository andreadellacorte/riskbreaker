import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import chokidar from "chokidar";
import type { Plugin, ViteDevServer } from "vite";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(appDir, "..", "..");

const DEBOUNCE_MS = 2000;

function nixOnPath(): boolean {
  const { status } = spawnSync("nix", ["--version"], { stdio: "ignore" });
  return status === 0;
}

function runMakeAndSync(root: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "nix",
      [
        "develop",
        "--accept-flake-config",
        "-c",
        "bash",
        "-c",
        "make -C packages/pcsx-wasm-core -j4 && node scripts/sync-pcsx-wasm-public.mjs",
      ],
      { cwd: root, stdio: "inherit" },
    );
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`pcsx-wasm watch: nix/make/sync exited ${code}`)),
    );
  });
}

/**
 * While `vite` is running, rebuild `packages/pcsx-wasm-core` (Emscripten `make`) and
 * sync into `apps/web/public/pcsx-wasm/` when sources change.
 *
 * Requires `nix` on PATH (same as CI / local Nix dev shell). Opt out with
 * `RISKBREAKER_NO_PCSX_WATCH=1`.
 */
export function pcsxWasmWatchPlugin(): Plugin {
  return {
    name: "pcsx-wasm-watch",
    configureServer(server: ViteDevServer) {
      if (process.env.RISKBREAKER_NO_PCSX_WATCH === "1") {
        return;
      }
      if (!nixOnPath()) {
        server.config.logger.warn(
          "[pcsx-wasm-watch] nix not on PATH — skipping auto-rebuild (set RISKBREAKER_NO_PCSX_WATCH=1 to silence)",
        );
        return;
      }

      const core = path.join(monorepoRoot, "packages", "pcsx-wasm-core");
      const watcher = chokidar.watch(
        [
          path.join(core, "js"),
          path.join(core, "Makefile"),
          path.join(core, "gui"),
          path.join(core, "libpcsxcore"),
          path.join(core, "include"),
          path.join(core, "plugins"),
        ],
        {
          ignoreInitial: true,
          ignored: [
            "**/dist/**",
            "**/*.o",
            "**/node_modules/**",
            /(^|[\\/])pcsx_worker\.(js|wasm)$/,
            /(^|[\\/])pcsx_ww\.(js|wasm)$/,
          ],
        },
      );

      let debounce: ReturnType<typeof setTimeout> | undefined;
      let running = false;
      let pending = false;

      const kick = (): void => {
        if (debounce) clearTimeout(debounce);
        debounce = setTimeout(() => {
          debounce = undefined;
          void (async () => {
            if (running) {
              pending = true;
              return;
            }
            running = true;
            pending = false;
            try {
              server.config.logger.info("[pcsx-wasm-watch] source changed — running nix develop + make + sync…");
              await runMakeAndSync(monorepoRoot);
              server.config.logger.info("[pcsx-wasm-watch] done");
            } catch (err) {
              server.config.logger.error(String(err));
            } finally {
              running = false;
              if (pending) kick();
            }
          })();
        }, DEBOUNCE_MS);
      };

      watcher.on("add", kick).on("change", kick).on("unlink", kick);

      return () => {
        void watcher.close();
      };
    },
  };
}
