# PlayStation.js — maintaining and extending the vendored core

**Canonical sources:** [`apps/web/playstation-src/entry.ts`](../apps/web/playstation-src/entry.ts) pulls in **`wasm-embed.ts`** (WASM data URL), **`riskbreaker-bootstrap.ts`**, **`emulator-bridge.ts`**, and **`emscripten-glue.js`** (Emscripten bulk). **`pnpm build:playstation`** (repo root) runs **esbuild** (IIFE) to [`apps/web/public/playstation/PlayStation.js`](../apps/web/public/playstation/PlayStation.js) and [`riskbreaker-overlay-boot.js`](../apps/web/public/playstation/riskbreaker-overlay-boot.js) (early spike overlay before disc load; **`riskbreaker-overlay.ts`**). See [`apps/web/playstation-src/README.md`](../apps/web/playstation-src/README.md).

The bundle is **our forked artifact**, not an opaque dependency — from **[lrusso/PlayStation](https://github.com/lrusso/PlayStation)** (WASMpsx / PCSX lineage). We vendor it so we can **read, format, split, and patch** it like any other platform code.

## Layout (after formatting)

| Region                                  | Role                                                                                                                          |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **`WASM_FILE`**                         | `data:application/wasm;base64,...` — the compiled emulator binary inlined for static hosting.                                 |
| **Riskbreaker bootstrap**               | Resolves `#rb-playstation-host`, **shadow DOM**, canvas pointer-events, `styleCustomText` injection (from `PlayStation.htm`). |
| **`Module` (Emscripten)**               | `preRun` / `postRun`, `canvas`, `locateFile`, FS hooks, `WASMpsx` namespace — standard Emscripten glue around the WASM.       |
| **Worker + `readFile`**                 | `pcsx_worker.postMessage({ cmd: "loadfile", file })` — disc load path from the HTML shell.                                    |
| **Context menu / `WASMpsx.fullscreen`** | Small UI; version string (`v2.3`) and upstream link in template literal.                                                      |

Nothing here has to stay a single file forever — it is one file today because upstream ships a **bundled** drop-in.

## Day-to-day: readable JS

The repo **ignores** this file in root `pnpm format` (large, churn). To **pretty-print** after upstream merges or manual edits:

```bash
pnpm format:playstation
```

That formats the emitted **`PlayStation.js`** (large generated file; `wasm-embed.ts` / `emscripten-glue.js` stay Prettier-ignored). Re-run after `build:playstation` when you need a readable diff of the output.

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

## Upstream and license

- Track **lrusso/PlayStation** (or your fork) for security and compatibility fixes.
- Keep [`LICENSE.playstation.txt`](../apps/web/public/playstation/LICENSE.playstation.txt) accurate; note substantive changes in commit messages.

## Related

- [`playable-emulator-spike.md`](./playable-emulator-spike.md) — route, legal, E2E.
- [`architecture.md`](./architecture.md) — emulator vs `packages/*` boundaries.
