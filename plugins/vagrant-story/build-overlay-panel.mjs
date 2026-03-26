#!/usr/bin/env node
/**
 * RSK-vs12: Bundle `emulator-overlay-panel.ts` → `apps/web/public/pcsx-wasm/js/riskbreaker-vs-panel.js`.
 * Loaded by the emulator page separately from the main pcsx-wasm-shell boot bundle.
 */
import path from "node:path";
import fs from "node:fs";
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

const watch = process.argv.includes("--watch");
const rootPkgJson = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
);
const buildStamp = `${rootPkgJson.version ?? "0.0.0"}+${new Date().toISOString()}`;

/** @type {import("esbuild").BuildOptions[]} */
const configs = [
  {
    absWorkingDir: pkgDir,
    entryPoints: [path.join("src", "emulator-overlay-panel.ts")],
    outfile: outFile,
    bundle: true,
    format: "iife",
    platform: "browser",
    target: "es2020",
    legalComments: "none",
    logLevel: "info",
    loader: { ".json": "json" },
  },
  {
    absWorkingDir: pkgDir,
    entryPoints: [path.join("src", "vs-fullscreen-menu.ts")],
    outfile: menuOutFile,
    bundle: true,
    format: "iife",
    platform: "browser",
    target: "es2020",
    legalComments: "none",
    logLevel: "info",
    loader: { ".png": "dataurl", ".gif": "dataurl" },
    define: {
      __RB_VS_MENU_BUILD__: JSON.stringify(buildStamp),
    },
  },
];

if (watch) {
  const contexts = await Promise.all(configs.map((c) => esbuild.context(c)));
  await Promise.all(contexts.map((ctx) => ctx.watch()));
  console.log("vagrant-story overlay: watching for changes…");
} else {
  await Promise.all(configs.map((c) => esbuild.build(c)));
  console.log(`vagrant-story overlay panel: → ${path.relative(root, outFile)}`);
  console.log(`vagrant-story fullscreen menu: → ${path.relative(root, menuOutFile)}`);
}
