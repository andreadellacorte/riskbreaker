#!/usr/bin/env node
/**
 * Bundle `kxkx-shell-boot.ts` + package sources → `apps/web/public/pcsx-kxkx/js/riskbreaker-kxkx-boot.js`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const pkgDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(pkgDir, "../..");
const outFile = path.join(root, "apps/web/public/pcsx-kxkx/js/riskbreaker-kxkx-boot.js");
const shimDir = path.join(pkgDir, "shims");

const entryTs = path.join(pkgDir, "src/kxkx-shell-boot.ts");
if (!fs.existsSync(entryTs)) {
  console.error(`pcsx-kxkx-shell: missing entry ${entryTs}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(outFile), { recursive: true });

await esbuild.build({
  absWorkingDir: pkgDir,
  entryPoints: [path.join("src", "kxkx-shell-boot.ts")],
  outfile: outFile,
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2020",
  legalComments: "none",
  logLevel: "error",
  alias: {
    fs: path.join(shimDir, "node-empty.cjs"),
    path: path.join(shimDir, "node-empty.cjs"),
    crypto: path.join(shimDir, "crypto-stub.cjs"),
  },
});

console.log(`pcsx-kxkx-shell: → ${path.relative(root, outFile)}`);
