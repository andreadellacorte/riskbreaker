#!/usr/bin/env node
/**
 * Copies freshly built kxkx5150 PCSX-wasm artifacts into `apps/web/public/pcsx-kxkx/`
 * so Vite can serve them at `/pcsx-kxkx/`.
 *
 * Run after: `cd third_party/kxkx5150-PCSX-wasm && nix-shell -p emscripten --run 'make'`
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const src = path.join(root, "third_party", "kxkx5150-PCSX-wasm");
const dest = path.join(root, "apps", "web", "public", "pcsx-kxkx");

const artifacts = ["pcsx_worker.js", "pcsx_worker.wasm", "pcsx_ww.js", "pcsx_ww.wasm"];

for (const name of artifacts) {
  const from = path.join(src, name);
  if (!fs.existsSync(from)) {
    console.error(`sync-pcsx-kxkx-public: missing ${from} — build the submodule first.`);
    process.exit(1);
  }
}

fs.mkdirSync(path.join(dest, "css"), { recursive: true });
fs.mkdirSync(path.join(dest, "js"), { recursive: true });

for (const name of artifacts) {
  fs.copyFileSync(path.join(src, name), path.join(dest, name));
}

const docCss = path.join(src, "docs", "css", "pcsx.css");
const docUi = path.join(src, "docs", "js", "pcsx_ui.js");
if (!fs.existsSync(docCss) || !fs.existsSync(docUi)) {
  console.error("sync-pcsx-kxkx-public: missing docs/css or docs/js from submodule.");
  process.exit(1);
}
fs.copyFileSync(docCss, path.join(dest, "css", "pcsx.css"));
fs.copyFileSync(docUi, path.join(dest, "js", "pcsx_ui.js"));

console.log(`sync-pcsx-kxkx-public: synced ${artifacts.length} wasm/js artifacts + css + pcsx_ui.js → ${dest}`);
