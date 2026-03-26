/**
 * Vite dev-mode plugin: disc + save-state preloader.
 *
 * When the emulator page is opened with `?preload=1`, this plugin:
 *   1. Serves the disc image at   GET /api/v1/preload/disc
 *   2. Serves the save state at   GET /api/v1/preload/savestate  (optional)
 *   3. Intercepts GET /pcsx-wasm/index.html?...preload=1... and injects an
 *      inline <script> that boots the emulator automatically, skipping the
 *      file-picker entirely.
 *
 * NOTE: transformIndexHtml only runs on Vite-processed HTML, not on static
 * files under public/. The middleware below reads the file from disk, injects
 * the script, and serves the modified HTML when ?preload=1 is present.
 *
 * Environment variables (loaded from .env / .env.local):
 *   PRELOAD_PS1_DISC_BIN      — path to disc image (.bin/.cue/.iso)
 *   PRELOAD_PS1_SAVE_STATE    — path to save-state file (optional)
 *
 * Relative paths are resolved from the repo root (cwd at Vite startup).
 */

import fs from "node:fs";
import path from "node:path";
import { loadEnv } from "vite";
import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";

const DISC_PATH  = "/api/v1/preload/disc";
const STATE_PATH = "/api/v1/preload/savestate";
const SHELL_PATH = "/pcsx-wasm/index.html";

export interface PreloadPluginOptions {
  /** Absolute path to the monorepo root — used to resolve relative env-var paths. */
  repoRoot: string;
}

function buildPreloadScript(): string {
  return `<script>
(function () {
  if (new URLSearchParams(location.search).get("preload") !== "1") return;
  console.log("[preload] active — fetching disc and save state automatically");

  async function preloadDisc() {
    console.log("[preload] fetching disc from ${DISC_PATH} …");
    var res = await fetch("${DISC_PATH}");
    if (!res.ok) { console.warn("[preload] disc endpoint returned", res.status); return false; }
    // Use blob() rather than arrayBuffer() — avoids a large heap copy for
    // the File constructor and lets the browser stream/GC more efficiently.
    var blob     = await res.blob();
    var filename = res.headers.get("X-Filename") || "disc.bin";
    var file     = new File([blob], filename);
    var dt       = new DataTransfer();
    dt.items.add(file);
    var input    = document.getElementById("iso_opener");
    if (!input) { console.warn("[preload] #iso_opener not found"); return false; }
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    console.log("[preload] disc handed to emulator:", filename, Math.round(blob.size / 1e6) + " MB");
    return true;
  }

  function waitForGameActive(timeoutMs) {
    var deadline = Date.now() + timeoutMs;
    return new Promise(function (resolve, reject) {
      function check() {
        if (document.body.classList.contains("pcsx-game-active")) return resolve(undefined);
        if (Date.now() > deadline) return reject(new Error("[preload] timed out waiting for pcsx-game-active"));
        setTimeout(check, 500);
      }
      check();
    });
  }

  async function preloadSaveState() {
    var res = await fetch("${STATE_PATH}");
    if (!res.ok) { console.log("[preload] no save state configured (" + res.status + ")"); return; }
    var buf = await res.arrayBuffer();
    var loadState = globalThis.__riskbreakerLoadState;
    if (!loadState) { console.warn("[preload] __riskbreakerLoadState not available"); return; }
    await loadState(new Uint8Array(buf));
    console.log("[preload] save state loaded");
  }

  async function run() {
    var ok = await preloadDisc();
    if (!ok) return;
    await waitForGameActive(120000);
    await new Promise(function (r) { setTimeout(r, 500); });
    await preloadSaveState();
  }

  // Run immediately if DOM is already ready, otherwise wait for it.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
</script>`;
}

export function preloadPlugin({ repoRoot }: PreloadPluginOptions): Plugin {
  return {
    name: "preload",
    apply: "serve",

    configureServer(server) {
      // loadEnv with prefix '' loads ALL vars (not just VITE_-prefixed) from
      // the repo root .env / .env.local, then falls back to process.env.
      const envFile = loadEnv(server.config.mode, repoRoot, "");

      function get(key: string): string | undefined {
        return envFile[key] ?? process.env[key];
      }

      function resolvePath(envVal: string): string {
        return path.isAbsolute(envVal) ? envVal : path.resolve(repoRoot, envVal);
      }

      const discFile  = get("PRELOAD_PS1_DISC_BIN")  ? resolvePath(get("PRELOAD_PS1_DISC_BIN")!)  : null;
      const stateFile = get("PRELOAD_PS1_SAVE_STATE") ? resolvePath(get("PRELOAD_PS1_SAVE_STATE")!) : null;

      const discAvailable  = !!discFile  && fs.existsSync(discFile);
      const stateAvailable = !!stateFile && fs.existsSync(stateFile);

      if (!discAvailable) {
        console.log("[preload] PRELOAD_PS1_DISC_BIN not set or file not found — preload disabled");
        return;
      }

      console.log(`[preload] disc: ${discFile}`);
      if (stateAvailable) console.log(`[preload] state: ${stateFile}`);

      const preloadScript = buildPreloadScript();

      // ── Serve the binary files ──────────────────────────────────────────────
      server.middlewares.use(DISC_PATH, (_req: IncomingMessage, res: ServerResponse) => {
        const stat = fs.statSync(discFile!);
        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("Content-Length", stat.size);
        res.setHeader("X-Filename", path.basename(discFile!));
        res.setHeader("Access-Control-Expose-Headers", "X-Filename");
        fs.createReadStream(discFile!).pipe(res);
      });

      server.middlewares.use(STATE_PATH, (_req: IncomingMessage, res: ServerResponse) => {
        if (!stateAvailable) {
          res.statusCode = 404; res.end("not configured"); return;
        }
        const stat = fs.statSync(stateFile!);
        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("Content-Length", stat.size);
        fs.createReadStream(stateFile!).pipe(res);
      });

      // ── Intercept /pcsx-wasm/index.html?preload=1 ───────────────────────────
      // transformIndexHtml does not run for static public/ files, so we
      // intercept the request here and inject the script ourselves.
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = new URL(req.url ?? "", "http://localhost");
        if (url.pathname !== SHELL_PATH || url.searchParams.get("preload") !== "1") {
          return next();
        }

        // server.config.root is the Vite root (apps/web/); public/ lives there.
        const filePath = path.join(server.config.root, "public/pcsx-wasm/index.html");

        let html: string;
        try {
          html = fs.readFileSync(filePath, "utf-8");
        } catch {
          return next(); // fall through to static file server on any read error
        }

        const injected = html.replace("</head>", `${preloadScript}\n</head>`);
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
        res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
        res.end(injected);
      });
    },
  };
}
