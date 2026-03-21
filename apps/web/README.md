# @riskbreaker/web

Vite + React shell for Riskbreaker. **`pnpm dev`** (from repo root) serves http://localhost:5173 .

- **`/`** — **mock** vertical slice: `SessionOrchestrator` + **Vagrant Story** plugin fixtures — manifest, inventory view model, and a sample command plan.
- **`/play/spike`** — browser **WASM PS1** spike (vendored lrusso/PlayStation); file picker for local `.bin` images; **not** wired to `psx-runtime` yet. See [`docs/playable-emulator-spike.md`](../../docs/playable-emulator-spike.md).

Workspace packages resolve to **sources** via the repo-root [`vite.workspace.mjs`](../../vite.workspace.mjs) alias map so you do not need `pnpm -r build` before `pnpm dev`.
