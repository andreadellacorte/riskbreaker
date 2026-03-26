#!/usr/bin/env node
/**
 * Bundle `pcsx-wasm-shell-boot.ts` + package sources → `apps/web/public/pcsx-wasm/js/riskbreaker-pcsx-wasm-boot.js`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const pkgDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(pkgDir, "../..");
const outFile = path.join(
  root,
  "apps/web/public/pcsx-wasm/js/riskbreaker-pcsx-wasm-boot.js",
);
const shimDir = path.join(pkgDir, "shims");

const entryTs = path.join(pkgDir, "src/pcsx-wasm-shell-boot.ts");
if (!fs.existsSync(entryTs)) {
  console.error(`pcsx-wasm-shell: missing entry ${entryTs}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(outFile), { recursive: true });

const watch = process.argv.includes("--watch");
const rootPkgJson = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
);
const buildStamp = `${rootPkgJson.version ?? "0.0.0"}+${new Date().toISOString()}`;

const ctx = await esbuild.context({
  absWorkingDir: pkgDir,
  entryPoints: [path.join("src", "pcsx-wasm-shell-boot.ts")],
  outfile: outFile,
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2020",
  legalComments: "none",
  logLevel: watch ? "info" : "error",
  alias: {
    fs: path.join(shimDir, "node-empty.cjs"),
    path: path.join(shimDir, "node-empty.cjs"),
    crypto: path.join(shimDir, "crypto-stub.cjs"),
  },
  define: {
    __RB_OVERLAY_BUILD__: JSON.stringify(buildStamp),
  },
});

if (watch) {
  await ctx.watch();
} else {
  await ctx.rebuild();
  await ctx.dispose();
  console.log(`pcsx-wasm-shell: → ${path.relative(root, outFile)}`);
}
