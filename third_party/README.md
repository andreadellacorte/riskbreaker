# Third-party emulator sources (spike)

Git **submodules** for **PCSX-in-browser** builds. Riskbreaker ships the **kxkx5150** artifacts under [`apps/web/public/pcsx-kxkx/`](../apps/web/public/pcsx-kxkx/) (`pnpm sync:pcsx-kxkx`).

| Submodule | Upstream | Role |
|-----------|----------|------|
| [`tjwei-pcsxjs/`](./tjwei-pcsxjs/) | [tjwei/pcsxjs](https://github.com/tjwei/pcsxjs) | Canonical **pcsxjs** tree — `Makefile`, `libpcsxcore`, Emscripten → WASM. GPL-3.0. |
| [`kxkx5150-PCSX-wasm/`](./kxkx5150-PCSX-wasm/) | [kxkx5150/PCSX-wasm](https://github.com/kxkx5150/PCSX-wasm) | Alternative packaging based on pcsxjs; [demo](https://kxkx5150.github.io/PCSX-wasm/). GPL-3.0. |

**License:** Both are **GPL-3.0** emulator cores. Combining or redistributing with proprietary app code has obligations — review before shipping.

## Clone (fresh checkout)

```bash
git submodule update --init --recursive
```

If submodules were added after you cloned **riskbreaker**:

```bash
git pull
git submodule update --init --recursive
```

## Build kxkx5150 (PCSX-wasm)

Tested with **Emscripten 4.0.x** (e.g. `nix-shell -p emscripten` on macOS). From the submodule root:

```bash
cd third_party/kxkx5150-PCSX-wasm
nix-shell -p emscripten --run 'make clean && make'
```

Outputs: `pcsx_worker.js` / `pcsx_worker.wasm` (worker core) and `pcsx_ww.js` / `pcsx_ww.wasm` (UI thread).

**Riskbreaker patches** (in-tree, not upstream): `gui/Linux.h` + `gui/Config.c` — `cfgfile` / `cfgfile_basename` moved out of the header so **wasm-ld** does not see duplicate symbols; `Makefile` drops a stale `_lzd` export (no such symbol in source); **`Makefile` UI link adds `-lidbfs.js`** because `gui/wwGUI.cc` calls `FS.mount(IDBFS, …)` — without it, the UI thread throws `IDBFS is not defined` on modern Emscripten; `js/worker_funcs.js` adds **`loaddisc`** so the browser can mount a **cue + multiple bin tracks** in one go. Older Emscripten may have tolerated the header globals / missing export.

**Web spike (local):** after `make`, run `pnpm sync:pcsx-kxkx` from the repo root, then `pnpm dev` and open [`/pcsx-kxkx/index.html`](http://localhost:5173/pcsx-kxkx/index.html) — static assets live under `apps/web/public/pcsx-kxkx/`.

## Spike checklist (manual)

1. Read each submodule’s `README.md` and top-level `Makefile` / build scripts.
2. For **kxkx5150**, use the recipe above; **tjwei** is largely stale — prefer kxkx for a current Emscripten build path.
3. Run generated HTML against a legal test image (e.g. GPL **240p Test Suite** — see [`e2e/fixtures/README.md`](../e2e/fixtures/README.md)).
4. Decide which tree to fork for **WASM exports** / `postMessage` bridge → [`packages/psx-runtime`](../packages/psx-runtime/) (`EmulatorRuntimeAdapter`).

**Tracking:** Groove **RSK-vcvj** (`.groove/tasks/RSK-vcvj--wasmpsx-lineage-split-artifacts-wasm-fork-for-memo.md`). Cross-doc: [`docs/playstation-engine-hacking.md`](../docs/playstation-engine-hacking.md) § “Where the C / Emscripten sources live”.
