# @riskbreaker/web

Vite + React shell for Riskbreaker. **`pnpm dev`** (from repo root) serves http://localhost:5173 .

- **`/`** — **mock** vertical slice: `SessionOrchestrator` + **Vagrant Story** plugin fixtures — manifest, inventory view model, and a sample command plan.
- **`/play/spike`** — browser **WASM PS1** spike (vendored lrusso/PlayStation); file picker for local `.bin` images; **not** wired to `psx-runtime` yet. See [`docs/playable-emulator-spike.md`](../../docs/playable-emulator-spike.md).

Workspace packages resolve to **sources** via the repo-root [`vite.workspace.mjs`](../../vite.workspace.mjs) alias map so you do not need `pnpm -r build` before `pnpm dev`.

## PlayStation emulator bundle (RSK-7lri)

- **Source:** [`playstation-src/`](./playstation-src/README.md) — TypeScript modules + `emscripten-glue.js`; **`pnpm build:playstation`** (repo root) runs **esbuild** (IIFE) to `public/playstation/PlayStation.js` (what `PlayStation.htm` loads). **`pnpm --filter @riskbreaker/web build`** runs **`build:playstation` first**, then `vite build`, so Netlify/CI never ship stale `PlayStation.js`.
- **Format:** `pnpm format:playstation` formats the emitted `PlayStation.js` (root `pnpm format` skips it).
