# @riskbreaker/web

Vite + React shell for Riskbreaker. **`pnpm dev`** (from repo root) serves http://localhost:5173 .

- **`/`** and **`/play/spike`** — redirect to the static **PCSX-wasm** shell at **`/pcsx-wasm/index.html?riskbreaker=1`** (`PlaySpikePage.tsx`).
- **`/mock`** — React **mock session** harness (Vagrant Story fixtures + `SessionOrchestrator`) for engine/UI work without the emulator.

The playable emulator is **not** wired to `psx-runtime` yet — see [`docs/playable-emulator-spike.md`](../../docs/playable-emulator-spike.md).

Workspace packages resolve to **sources** via the repo-root [`vite.workspace.mjs`](../../vite.workspace.mjs) alias map so you do not need `pnpm -r build` before `pnpm dev`.

## pcsx-wasm layout (canonical browser emulator)

| What | Where |
|------|--------|
| **Synced from dist** (`pnpm sync:pcsx-wasm`) | `pcsx_worker.js`, `pcsx_*.wasm`, `dist/js/pcsx_ui.js`, `dist/css/pcsx.css` → `public/pcsx-wasm/` |
| **Hand-owned shell** | `public/pcsx-wasm/index.html`, `css/pcsx-shell.css`, `js/pcsx-wasm-main.js`, `assets/` |
| **Riskbreaker overlay + host (built IIFE)** | [`packages/pcsx-wasm-shell`](../../packages/pcsx-wasm-shell/) → `public/pcsx-wasm/js/riskbreaker-pcsx-wasm-boot.js` |

**Build:** `pnpm build:pcsx-wasm-shell` (repo root) or **`pnpm --filter @riskbreaker/web build`** (runs the shell build before `vite build`). Overlay + host implementation: **`packages/pcsx-wasm-shell/src/`** (see [`packages/pcsx-wasm-shell/README.md`](../../packages/pcsx-wasm-shell/README.md)).
