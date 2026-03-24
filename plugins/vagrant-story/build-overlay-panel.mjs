#!/usr/bin/env node
/**
 * RSK-vs12: Bundle `emulator-overlay-panel.ts` → `apps/web/public/pcsx-wasm/js/riskbreaker-vs-panel.js`.
 * Loaded by the emulator page separately from the main pcsx-wasm-shell boot bundle.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const pkgDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(pkgDir, "../..");
const outFile = path.join(
  root,
  "apps/web/public/pcsx-wasm/js/riskbreaker-vs-panel.js",
);

const menuOutFile = path.join(
  root,
  "apps/web/public/pcsx-wasm/js/riskbreaker-vs-menu.js",
);

await Promise.all([
  esbuild.build({
    absWorkingDir: pkgDir,
    entryPoints: [path.join("src", "emulator-overlay-panel.ts")],
    outfile: outFile,
    bundle: true,
    format: "iife",
    platform: "browser",
    target: "es2020",
    legalComments: "none",
    logLevel: "error",
    loader: { ".json": "json" },
  }),
  esbuild.build({
    absWorkingDir: pkgDir,
    entryPoints: [path.join("src", "vs-fullscreen-menu.ts")],
    outfile: menuOutFile,
    bundle: true,
    format: "iife",
    platform: "browser",
    target: "es2020",
    legalComments: "none",
    logLevel: "error",
  }),
]);

console.log(`vagrant-story overlay panel: → ${path.relative(root, outFile)}`);
console.log(`vagrant-story fullscreen menu: → ${path.relative(root, menuOutFile)}`);
