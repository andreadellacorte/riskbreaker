#!/usr/bin/env node
/**
 * Ensure static PCSX-wasm artifacts exist under `apps/web/public/pcsx-wasm/`.
 *
 * Policy:
 * - Build PCSX-wasm WASM/JS only when missing.
 * - Always (re)build the small Riskbreaker overlay IIFE if boot bundle is missing.
 *
 * This lets local dev + CI work without committing large generated artifacts.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const pcsxWasmSrc = path.join(root, "packages", "pcsx-wasm-core");
const pcsxWasmDist = path.join(pcsxWasmSrc, "dist");
const publicDir = path.join(root, "apps", "web", "public", "pcsx-wasm");

const requiredPcsx = [
  "pcsx_worker.js",
  "pcsx_worker.wasm",
  "pcsx_ww.js",
  "pcsx_ww.wasm",
  path.join("css", "pcsx.css"),
  path.join("js", "pcsx_ui.js"),
];

const riskbreakerBoot = path.join(
  publicDir,
  "js",
  "riskbreaker-pcsx-wasm-boot.js",
);
const forceBuild = process.env.RISKBREAKER_FORCE_PCSX_WASM === "1";

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function run(cmd, args, opts) {
  const res = spawnSync(cmd, args, { stdio: "inherit", ...opts });
  if (res.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(" ")}`);
  }
}

function haveEmcc() {
  const res = spawnSync("sh", ["-lc", "command -v emcc >/dev/null 2>&1"], {
    stdio: "ignore",
  });
  return res.status === 0;
}

function buildPcsxWasm() {
  // Always build via nix to ensure a reproducible toolchain.
  // CI runs inside `nix develop` (emcc already on PATH); locally we use nix-shell as a wrapper.
  const haveNixShell = spawnSync(
    "sh",
    ["-lc", "command -v nix-shell >/dev/null 2>&1"],
    { stdio: "ignore" },
  ).status === 0;

  if (!haveNixShell) {
    throw new Error("nix-shell not found. Run inside `nix develop` or install Nix.");
  }

  run("nix-shell", [
    "-p",
    "emscripten",
    "gnumake",
    "--run",
    `cd "${pcsxWasmSrc}" && make clean && make`,
  ]);
}

function materializePcsxWasmDist() {
  // Dist is the single “sync source of truth” for the web runtime.
  // We keep build outputs under the wasm core tree, then copy the stable
  // runtime artifacts into `packages/pcsx-wasm-core/dist/` for consumption.
  fs.rmSync(pcsxWasmDist, { recursive: true, force: true });
  fs.mkdirSync(pcsxWasmDist, { recursive: true });
  fs.mkdirSync(path.join(pcsxWasmDist, "css"), { recursive: true });
  fs.mkdirSync(path.join(pcsxWasmDist, "js"), { recursive: true });

  const artifacts = ["pcsx_worker.js", "pcsx_worker.wasm", "pcsx_ww.js", "pcsx_ww.wasm"];
  for (const name of artifacts) {
    const from = path.join(pcsxWasmSrc, name);
    const to = path.join(pcsxWasmDist, name);
    if (!fs.existsSync(from)) throw new Error(`Missing pcsx-wasm build artifact: ${from}`);
    fs.copyFileSync(from, to);
  }

  const runtimeCss = path.join(pcsxWasmSrc, "runtime", "css", "pcsx.css");
  const runtimeUi = path.join(pcsxWasmSrc, "runtime", "js", "pcsx_ui.js");
  if (!fs.existsSync(runtimeCss) || !fs.existsSync(runtimeUi)) {
    throw new Error(
      "Missing pcsx-wasm runtime/css/pcsx.css or runtime/js/pcsx_ui.js for materializing dist.",
    );
  }

  fs.copyFileSync(runtimeCss, path.join(pcsxWasmDist, "css", "pcsx.css"));
  fs.copyFileSync(runtimeUi, path.join(pcsxWasmDist, "js", "pcsx_ui.js"));
}

function main() {
  // Overlay is small enough that "missing" is the only thing we care about.
  if (!exists(riskbreakerBoot) || forceBuild) {
    run("node", [path.join(root, "packages", "pcsx-wasm-shell", "build.mjs")], {
      cwd: root,
    });
  }

  const needPcsx = requiredPcsx.some((rel) => !exists(path.join(publicDir, rel)));
  if (!needPcsx && !forceBuild) {
    // Nothing else required.
    return;
  }

  if (!fs.existsSync(pcsxWasmSrc)) {
    throw new Error(`Missing pcsx-wasm source tree: ${pcsxWasmSrc}`);
  }

  buildPcsxWasm();
  materializePcsxWasmDist();
  run("node", [path.join(root, "scripts", "sync-pcsx-wasm-public.mjs")], { cwd: root });
}

main();

