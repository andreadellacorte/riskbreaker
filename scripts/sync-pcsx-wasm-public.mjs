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
const distDir = path.join(pcsxWasmSrc, "dist");
const dest = path.join(root, "apps", "web", "public", "pcsx-wasm");

const artifacts = ["pcsx_worker.js", "pcsx_worker.wasm", "pcsx_ww.js", "pcsx_ww.wasm"];

/** Prefer newest of package-root (`make` output) vs `dist/` (ensure materialization). */
function artifactSource(name) {
  const inTree = path.join(pcsxWasmSrc, name);
  const inDist = path.join(distDir, name);
  const t = fs.existsSync(inTree) ? fs.statSync(inTree).mtimeMs : 0;
  const d = fs.existsSync(inDist) ? fs.statSync(inDist).mtimeMs : 0;
  if (t >= d && t > 0) return inTree;
  if (d > 0) return inDist;
  return null;
}

for (const name of artifacts) {
  const from = artifactSource(name);
  if (!from) {
    console.error(
      `sync-pcsx-wasm-public: missing ${name} under ${pcsxWasmSrc} or ${distDir} — run make or scripts/ensure-pcsx-wasm.mjs.`,
    );
    process.exit(1);
  }
}

fs.mkdirSync(path.join(dest, "css"), { recursive: true });
fs.mkdirSync(path.join(dest, "js"), { recursive: true });

for (const name of artifacts) {
  fs.copyFileSync(artifactSource(name), path.join(dest, name));
}

const docCss =
  [path.join(distDir, "css", "pcsx.css"), path.join(pcsxWasmSrc, "runtime", "css", "pcsx.css")].find((p) =>
    fs.existsSync(p),
  ) ?? "";
const docUi =
  [path.join(distDir, "js", "pcsx_ui.js"), path.join(pcsxWasmSrc, "runtime", "js", "pcsx_ui.js")].find((p) =>
    fs.existsSync(p),
  ) ?? "";
if (!docCss || !docUi) {
  console.error(
    "sync-pcsx-wasm-public: missing pcsx.css or pcsx_ui.js (expected under dist/ or packages/pcsx-wasm-core/runtime/).",
  );
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
