#!/usr/bin/env node
/**
 * Ensure static PCSX-wasm artifacts exist under `apps/web/public/pcsx-wasm/`.
 *
 * Policy:
 * - Build PCSX-wasm WASM/JS only when missing.
 * - Always (re)build the small Riskbreaker overlay IIFE if boot bundle is missing.
 *
 * Netlify / CI without system Nix: set `NIX_PORTABLE` to the nix-portable binary; see
 * `scripts/netlify-build.sh` ([nix-portable](https://github.com/DavHau/nix-portable),
 * [nix-netlify-poc](https://github.com/justinas/nix-netlify-poc/blob/master/build.sh)).
 * Else use `nix develop`, `nix-shell`, or `emcc`+`make` on PATH.
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
  path.join("js", "worker_funcs.js"),
];

const riskbreakerBoot = path.join(
  publicDir,
  "js",
  "riskbreaker-pcsx-wasm-boot.js",
);
const vsPanelJs = path.join(publicDir, "js", "riskbreaker-vs-panel.js");
const vsMenuJs = path.join(publicDir, "js", "riskbreaker-vs-menu.js");
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

function nixPortablePath() {
  const p = process.env.NIX_PORTABLE;
  return p && exists(p) ? p : null;
}

function buildPcsxWasm() {
  const np = nixPortablePath();
  if (np) {
    run(np, [
      "nix-shell",
      "-p",
      "emscripten",
      "gnumake",
      "--run",
      `cd "${pcsxWasmSrc}" && make clean && make`,
    ]);
    return;
  }

  const haveNixShell =
    spawnSync("sh", ["-lc", "command -v nix-shell >/dev/null 2>&1"], { stdio: "ignore" }).status ===
    0;

  if (haveNixShell) {
    run("nix-shell", [
      "-p",
      "emscripten",
      "gnumake",
      "--run",
      `cd "${pcsxWasmSrc}" && make clean && make`,
    ]);
    return;
  }

  if (haveEmcc()) {
    run("sh", ["-lc", `cd "${pcsxWasmSrc}" && make clean && make`]);
    return;
  }

  throw new Error(
    "Cannot build pcsx-wasm: set NIX_PORTABLE to nix-portable, or install nix-shell (emscripten+gnumake), " +
      "or emcc+make on PATH. See scripts/netlify-build.sh.",
  );
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

/** Hand-authored shell under runtime/ must reach public/ even when wasm artifacts already exist (CI cache). */
function syncRuntimePcsxShellIntoPublic() {
  if (!fs.existsSync(pcsxWasmSrc)) {
    return;
  }
  const runtimeUi = path.join(pcsxWasmSrc, "runtime", "js", "pcsx_ui.js");
  const runtimeCss = path.join(pcsxWasmSrc, "runtime", "css", "pcsx.css");
  const destUi = path.join(publicDir, "js", "pcsx_ui.js");
  const destCss = path.join(publicDir, "css", "pcsx.css");
  if (!exists(runtimeUi) || !exists(runtimeCss)) {
    return;
  }
  fs.mkdirSync(path.dirname(destUi), { recursive: true });
  fs.mkdirSync(path.dirname(destCss), { recursive: true });
  function copyIfNewer(src, dst) {
    if (!exists(dst) || fs.statSync(src).mtimeMs > fs.statSync(dst).mtimeMs) {
      fs.copyFileSync(src, dst);
    }
  }
  copyIfNewer(runtimeUi, destUi);
  copyIfNewer(runtimeCss, destCss);
}

function main() {
  // Overlay is small enough that "missing" is the only thing we care about.
  if (!exists(riskbreakerBoot) || forceBuild) {
    run("node", [path.join(root, "packages", "pcsx-wasm-shell", "build.mjs")], {
      cwd: root,
    });
  }

  // VS plugin IIFEs (gitignored) — must run on CI/Netlify, not only when dev runs the plugin package.
  if (!exists(vsPanelJs) || !exists(vsMenuJs) || forceBuild) {
    run("node", [path.join(root, "plugins", "vagrant-story", "build-overlay-panel.mjs")], {
      cwd: root,
    });
  }

  syncRuntimePcsxShellIntoPublic();

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

