# @riskbreaker/web

Vite + React shell for Riskbreaker. **`pnpm dev`** (from repo root) serves http://localhost:5173 .

- **`/`** and **`/play/spike`** — redirect to the static **PCSX-wasm (kxkx)** shell at **`/pcsx-kxkx/index.html?riskbreaker=1`** (`PlaySpikePage.tsx`).
- **`/mock`** — React **mock session** harness (Vagrant Story fixtures + `SessionOrchestrator`) for engine/UI work without the emulator.

The playable emulator is **not** wired to `psx-runtime` yet — see [`docs/playable-emulator-spike.md`](../../docs/playable-emulator-spike.md).

Workspace packages resolve to **sources** via the repo-root [`vite.workspace.mjs`](../../vite.workspace.mjs) alias map so you do not need `pnpm -r build` before `pnpm dev`.

## pcsx-kxkx layout (canonical browser emulator)

| What | Where |
|------|--------|
| **Synced from submodule** (`pnpm sync:pcsx-kxkx`) | `pcsx_worker.js`, `pcsx_*.wasm`, `docs/js/pcsx_ui.js`, `docs/css/pcsx.css` → `public/pcsx-kxkx/` |
| **Hand-owned shell** | `public/pcsx-kxkx/index.html`, `css/pcsx-shell.css`, `js/kxkx-main.js`, `assets/` |
| **Riskbreaker overlay + host (built IIFE)** | [`packages/pcsx-kxkx-shell`](../../packages/pcsx-kxkx-shell/) → `public/pcsx-kxkx/js/riskbreaker-kxkx-boot.js` |

**Build:** `pnpm build:pcsx-kxkx-shell` (repo root) or **`pnpm --filter @riskbreaker/web build`** (runs the shell build before `vite build`). Overlay + host implementation: **`packages/pcsx-kxkx-shell/src/`** (see [`packages/pcsx-kxkx-shell/README.md`](../../packages/pcsx-kxkx-shell/README.md)). **`apps/web/legacy/playstation-src/`** holds only historical **emscripten** / **wasm-embed** blobs — not the live overlay sources.

## Legacy lrusso bundle

The old **lrusso/PlayStation** static tree and **`build:playstation`** pipeline were removed. Historical sources and notes: **`apps/web/legacy/playstation-src/README.md`**.
