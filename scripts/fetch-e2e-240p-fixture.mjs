#!/usr/bin/env node
/**
 * Ensures e2e/fixtures/240pTestSuitePS1-EMU.bin exists for Playwright (GPL-2.0 homebrew).
 * See e2e/fixtures/README.md — safe to download in CI; no commercial game data.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixturesDir = path.join(repoRoot, "e2e", "fixtures");
const dest = path.join(fixturesDir, "240pTestSuitePS1-EMU.bin");
const zipUrl =
  "https://github.com/filipalac/240pTestSuite-PS1/releases/download/19122020/240pTestSuitePS1-EMU.zip";

if (fs.existsSync(dest)) {
  console.log(`[fetch-e2e-240p] already present: ${dest}`);
  process.exit(0);
}

fs.mkdirSync(fixturesDir, { recursive: true });

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "rb-240p-"));
const zipPath = path.join(tmp, "240pTestSuitePS1-EMU.zip");

console.log(`[fetch-e2e-240p] downloading ${zipUrl} …`);
const res = await fetch(zipUrl);
if (!res.ok) {
  console.error(`[fetch-e2e-240p] HTTP ${res.status}`);
  process.exit(1);
}
fs.writeFileSync(zipPath, Buffer.from(await res.arrayBuffer()));

const u = spawnSync("unzip", ["-o", zipPath, "-d", tmp], { stdio: "inherit" });
if (u.status !== 0) {
  console.error("[fetch-e2e-240p] unzip failed (install unzip, or extract manually)");
  process.exit(1);
}

const extracted = path.join(tmp, "240pTestSuitePS1-EMU.bin");
if (!fs.existsSync(extracted)) {
  console.error(`[fetch-e2e-240p] expected ${extracted} after unzip`);
  process.exit(1);
}

fs.copyFileSync(extracted, dest);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`[fetch-e2e-240p] wrote ${dest}`);
