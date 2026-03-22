#!/usr/bin/env node
/**
 * RSK-7lri: bundle `playstation-src/entry.ts` → `public/playstation/PlayStation.js` (IIFE for PlayStation.htm).
 * RSK-74eh: `riskbreaker-overlay-boot.ts` → `riskbreaker-overlay-boot.js` (early spike overlay before disc load).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = fileURLToPath(new URL("..", import.meta.url));
const playstationSrc = path.join(root, "apps/web/playstation-src");
const entryMain = path.join(playstationSrc, "entry.ts");
const entryOverlayBoot = path.join(playstationSrc, "riskbreaker-overlay-boot.ts");
const outdir = path.join(root, "apps/web/public/playstation");
const shimDir = path.join(playstationSrc, "shims");

if (!fs.existsSync(entryMain)) {
  console.error(`build-playstation: missing entry ${entryMain}`);
  process.exit(1);
}

fs.mkdirSync(outdir, { recursive: true });

await esbuild.build({
  absWorkingDir: root,
  entryPoints: {
    PlayStation: entryMain,
    "riskbreaker-overlay-boot": entryOverlayBoot,
  },
  outdir,
  entryNames: "[name]",
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2020",
  legalComments: "none",
  logLevel: "warning",
  alias: {
    fs: path.join(shimDir, "node-empty.cjs"),
    path: path.join(shimDir, "node-empty.cjs"),
    crypto: path.join(shimDir, "crypto-stub.cjs"),
  },
});

console.log(
  `build-playstation: ${path.relative(root, entryMain)} + overlay-boot → ${path.relative(root, outdir)}/`,
);
