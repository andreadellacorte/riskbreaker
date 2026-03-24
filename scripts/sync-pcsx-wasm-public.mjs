#!/usr/bin/env node
/**
 * Copies freshly built PCSX-wasm artifacts into `apps/web/public/pcsx-wasm/`
 * so Vite can serve them at `/pcsx-wasm/`.
 *
 * Run after: `cd packages/pcsx-wasm-core && nix-shell -p emscripten --run 'make'`
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const pcsxWasmSrc = path.join(root, "packages", "pcsx-wasm-core");
const src = path.join(pcsxWasmSrc, "dist");
const dest = path.join(root, "apps", "web", "public", "pcsx-wasm");

const artifacts = ["pcsx_worker.js", "pcsx_worker.wasm", "pcsx_ww.js", "pcsx_ww.wasm"];

for (const name of artifacts) {
  const from = path.join(src, name);
  if (!fs.existsSync(from)) {
    console.error(`sync-pcsx-wasm-public: missing ${from} — run scripts/ensure-pcsx-wasm.mjs first.`);
    process.exit(1);
  }
}

fs.mkdirSync(path.join(dest, "css"), { recursive: true });
fs.mkdirSync(path.join(dest, "js"), { recursive: true });

for (const name of artifacts) {
  fs.copyFileSync(path.join(src, name), path.join(dest, name));
}

const docCss = path.join(src, "css", "pcsx.css");
const docUi = path.join(src, "js", "pcsx_ui.js");
if (!fs.existsSync(docCss) || !fs.existsSync(docUi)) {
  console.error("sync-pcsx-wasm-public: missing dist/css/pcsx.css or dist/js/pcsx_ui.js.");
  process.exit(1);
}
fs.copyFileSync(docCss, path.join(dest, "css", "pcsx.css"));
fs.copyFileSync(docUi, path.join(dest, "js", "pcsx_ui.js"));

// worker_funcs.js is a hand-authored companion to pcsx_worker.js — sync it from source.
const workerFuncsSrc = path.join(pcsxWasmSrc, "js", "worker_funcs.js");
if (fs.existsSync(workerFuncsSrc)) {
  fs.copyFileSync(workerFuncsSrc, path.join(dest, "js", "worker_funcs.js"));
}

console.log(`sync-pcsx-wasm-public: synced ${artifacts.length} wasm/js artifacts + css + pcsx_ui.js + worker_funcs.js → ${dest}`);
