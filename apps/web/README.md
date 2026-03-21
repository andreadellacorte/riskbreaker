# @riskbreaker/web

Vite + React shell for Riskbreaker. **`pnpm dev`** (from repo root) serves http://localhost:5173 .

The home page runs the **mock** vertical slice: `SessionOrchestrator` + **Vagrant Story** plugin fixtures — manifest, inventory view model, and a sample command plan. No emulator or `bins/` ROMs yet (see Groove tasks **RSK-l7qp** onward).

Workspace packages resolve to **sources** via the repo-root [`vite.workspace.mjs`](../../vite.workspace.mjs) alias map so you do not need `pnpm -r build` before `pnpm dev`.
