# Emulator cores — PCSX-wasm (canonical) and legacy lrusso notes

**Status (2026):** The **playable** path is **`/pcsx-kxkx/`** — artifacts from [`third_party/kxkx5150-PCSX-wasm`](../third_party/kxkx5150-PCSX-wasm) synced via **`pnpm sync:pcsx-kxkx`** into [`apps/web/public/pcsx-kxkx/`](../apps/web/public/pcsx-kxkx/). The Riskbreaker overlay, perf HUD, runtime menu, and host bridge are **implemented in** [`packages/pcsx-kxkx-shell/src/`](../packages/pcsx-kxkx-shell/src/) and built to `public/pcsx-kxkx/js/riskbreaker-kxkx-boot.js` — **not** under `apps/web/legacy/`.

[`apps/web/legacy/playstation-src/`](../apps/web/legacy/playstation-src/) retains only **reference blobs** (`emscripten-glue.js`, `wasm-embed.ts`) from the removed lrusso pipeline; there is no active TypeScript entry chain there.

The sections below still describe the **old** lrusso architecture for **historical** context and for ideas that apply to **forking the kxkx worker** (speed hack, upscale, exports).

## Layout (after formatting)

| Region                                  | Role                                                                                                                          |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **`WASM_FILE`**                         | `data:application/wasm;base64,...` — the compiled emulator binary inlined for static hosting.                                 |
| **Riskbreaker bootstrap**               | Resolves `#rb-playstation-host`, **shadow DOM**, canvas pointer-events, `styleCustomText` injection (from `PlayStation.htm`). |
| **`Module` (Emscripten)**               | `preRun` / `postRun`, `canvas`, `locateFile`, FS hooks, `WASMpsx` namespace — standard Emscripten glue around the WASM.       |
| **Worker + `readFile`**                 | `pcsx_worker.postMessage({ cmd: "loadfile", file })` — disc load path from the HTML shell.                                    |
| **Context menu / `WASMpsx.fullscreen`** | Small UI; version string (`v2.3`) and upstream link in template literal.                                                      |

Nothing here has to stay a single file forever — it is one file today because upstream ships a **bundled** drop-in.

## Day-to-day: readable JS (legacy lrusso)

The old repo **ignored** generated **`PlayStation.js`** in root `pnpm format` (large, churn). That pipeline (`pnpm format:playstation` / `build:playstation`) has been **removed** with the **`public/playstation/`** tree.

## Splitting the bundle (recommended direction)

When edits get painful, split in **this order** (each step stays servable as static files):

1. **`wasm-embed.js`** (or `.ts` + build) — export `WASM_FILE` only, or load `.wasm` from `/playstation/pcsx.wasm` with `fetch` + `instantiate` if you want to drop base64 size from JS.
2. **`emscripten-glue.js`** — `Module`, worker bootstrap, anything that is clearly generated Emscripten output (often left as one chunk).
3. **`riskbreaker-bootstrap.js`** — shadow host, pointer-events, hooks for future `IRuntime` / `postMessage` to the React app.
4. **`PlayStation.htm`** — stays the shell; loads scripts in order (or a tiny ES module entry).

Use a **small build step** (e.g. esbuild concat, or Vite `public` multi-script) only when splitting; until then, one file is fine if formatted.

## Higher resolution, “better textures”, upscale

- **Output resolution / canvas scale** is mostly **JS + WebGL**: search for canvas sizing, `styleCustomText`, and fullscreen handling — often adjustable without recompiling WASM.
- **Internal PS1 GPU accuracy, texture filtering, HD packs** live in the **C/C++ core** that produced `WASM_FILE`. Meaningful upgrades usually mean:
  - rebuilding WASM from a forked [wasmpsx](https://github.com/js-emulators/wasmpsx) / PCSX-derived tree, or
  - swapping the backend later (different core) while keeping Riskbreaker seams (`IRuntime`, app shell).

Document expectations in PRs: **JS-only patch** vs **WASM rebuild** vs **core replacement**.

## PCSX worker / speed hack (`fakeRequestAnimationFrame`)

The PCSX core runs in a **Web Worker** (no `window`). A **removed** experiment, **`scripts/patch-pcsx-worker-fake-raf.mjs`**, tried to rewrite the **minified** worker from the JS layer for the **lrusso** bundle; it did not ship reliably. **Preferred direction:** implement timing / internal scale in the **forked** `pcsx_worker` + expose **`postMessage`** config from the shell (see **`packages/pcsx-kxkx-shell`** overlay → host). Gameplay may still report **~30 FPS** when the title’s own pacing is 30 Hz; **true “HD” internal rendering** remains a **WASM** concern.

## [wasmpsx](https://github.com/js-emulators/wasmpsx) — artifacts vs “build from scratch”

The public **js-emulators/wasmpsx** repository ships **ready-to-serve files only**: `wasmpsx.min.js`, `wasmpsx_worker.js`, `wasmpsx_worker.wasm`, `wasmpsx_ww.wasm`, and `index.html`. The README covers **hosting** (`.wasm` MIME type) and **usage** (`wasmpsx-player`, `loadUrl` / `readFile`); it does **not** include Emscripten/Makefiles, C/C++ PCSX sources, or steps to recompile the worker WASM.

**Implication:** “Building wasmpsx from scratch” is **not** defined inside that repo. You need a **separate** tree (historically described as a fork of **TJWei**’s PlayStation emulator — see wasmpsx README) plus an Emscripten pipeline, then you can **replace** the published `.js`/`.wasm` artifacts. Riskbreaker’s vendored bundle follows the **[lrusso/PlayStation](https://github.com/lrusso/PlayStation)** drop-in (wasmpsx-based, with shell improvements), not the split wasmpsx file layout.

**Practical alignment:** To get closer to **inspectable** worker + WASM (file URLs instead of mega-base64), treat **wasmpsx’s on-disk layout** as the integration target and keep **lrusso-style** UX changes as a **diff** against that layout — see Groove bean **RSK-vcvj** ([`.groove/tasks/RSK-vcvj--wasmpsx-lineage-split-artifacts-wasm-fork-for-memo.md`](../.groove/tasks/RSK-vcvj--wasmpsx-lineage-split-artifacts-wasm-fork-for-memo.md)).

### Where the C / Emscripten sources live (compile path)

| Upstream | Notes |
| -------- | ----- |
| **[tjwei/pcsxjs](https://github.com/tjwei/pcsxjs)** | PCSX-derived core (`libpcsxcore` etc.), **GPL-3.0**, built with **Emscripten** to WASM; [live demo](https://tjwei.github.io/pcsxjs/). This is the lineage wasmpsx’s README points at. |
| **[kxkx5150/PCSX-wasm](https://github.com/kxkx5150/PCSX-wasm)** | Another Emscripten packaging of PCSX — useful reference for build flags / worker layout. |

**Local spike:** both are vendored as **git submodules** under [`third_party/`](../third_party/README.md) (`tjwei-pcsxjs`, `kxkx5150-PCSX-wasm`) — `git submodule update --init --recursive`.
| **[js-emulators/wasmpsx](https://github.com/js-emulators/wasmpsx)** | **No** sources in-repo — only **published** `.js` / `.wasm` for embedding. |

**Riskbreaker:** To add **WASM exports** (peek, savestate, hooks), fork **pcsxjs** or **PCSX-wasm**, patch C/JS glue, **rebuild**, then sync into **`apps/web/public/pcsx-kxkx/`** via **`pnpm sync:pcsx-kxkx`**. License compatibility: **GPL-3.0** (pcsxjs) — **verify** before distributing combined binaries.

## Upstream and license

- **Canonical build:** **[kxkx5150/PCSX-wasm](https://github.com/kxkx5150/PCSX-wasm)** submodule + [`third_party/README.md`](../third_party/README.md) patches.
- **wasmpsx** ([MIT](https://github.com/js-emulators/wasmpsx/blob/main/LICENSE)) — artifact reference for worker/main split; not a full core source mirror.
- Historical **lrusso** notice files were removed with **`public/playstation/`**; if you revive that lineage, restore license text in-repo.

## Related

- [`playable-emulator-spike.md`](./playable-emulator-spike.md) — route, legal, E2E.
- [`architecture.md`](./architecture.md) — emulator vs `packages/*` boundaries.
