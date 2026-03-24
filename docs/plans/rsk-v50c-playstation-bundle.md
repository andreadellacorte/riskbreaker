# Plan: RSK-v50c — PlayStation.js modular TypeScript, build, telemetry, in-game overlay

## Overview

Deliver the epic **RSK-v50c** by moving [`apps/web/public/playstation/PlayStation.js`](../../apps/web/public/playstation/PlayStation.js) to **TypeScript sources + a bundler** that still emits a **single** `PlayStation.js` at **`/playstation/PlayStation.js`** (see dynamic load in [`PlayStation.htm`](../../apps/web/public/playstation/PlayStation.htm) — `script.src = "/playstation/PlayStation.js"`). Add **dev-only** telemetry for optimisation.

**Product spike:** **`** (backtick) toggles a **shadcn-aligned Riskbreaker overlay** on top of the live emulator (Doom-console metaphor) — **RSK-74eh**; placeholder UI and host wiring are sufficient for v1.

**Every mergeable step keeps [`e2e/play-spike.spec.ts`](../../e2e/play-spike.spec.ts) green** (Playwright serves the app via [`playwright.config.ts`](../../playwright.config.ts) → `pnpm --filter @riskbreaker/web exec vite`).

Prior brainstorm exists: [`docs/brainstorms/playstation-js-modularize-typescript.md`](../brainstorms/playstation-js-modularize-typescript.md).

### Layer 2 ↔ 3 ↔ 4 (emulator ↔ plugins ↔ platform)

**Assume 3↔4 is settled:** plugin contracts, `SessionOrchestrator`, decoders on platform types — no redesign in this epic.

**2 must evolve at the edges** so a host can connect the WASM bundle to **4** (and thus **3**) without importing plugins into `playstation-src/`. **RSK-7lri** adds a **bridge module + minimal interface** (lifecycle / stub snapshot hooks). **RSK-wquv** documents the flow in `docs/architecture.md` or `playstation-engine-hacking.md`. Full `EmulatorRuntimeAdapter` wiring is **follow-up** work outside this epic’s closure criteria unless we explicitly expand scope.

## Decisions

- **Bundler:** Add **esbuild** as a **devDependency** at the **repo root** (or under `apps/web`) so the PlayStation bundle does not go through the React app’s Vite graph. Alternative **Vite library mode** in `apps/web` is heavier; esbuild matches the brainstorm’s “small TS bundle” criterion and keeps `public/` as **output-only** for Vite.
- **Entry/output:** Source under e.g. **`apps/web/playstation-src/entry.ts`** (name TBD) → **esbuild** writes **`apps/web/public/playstation/PlayStation.js`**. `PlayStation.htm` stays unchanged in the first milestone except if we add a **source map** query (optional).
- **WASM in v1:** Keep **`WASM_FILE` base64** in a dedicated module (imported string or `readFileSync` at build time from a checked-in `.txt` slice) to avoid changing runtime load semantics; external `.wasm` + `locateFile` is **RSK-wquv** or a follow-up.
- **TypeScript scope:** Strict types for **Riskbreaker bootstrap** and **message shapes**; allow `// @ts-nocheck` or ambient `Module` for the largest Emscripten paste until **RSK-7lri** splits it.
- **Telemetry / HUD / menu:** Gate with **`import.meta.env.DEV`** and/or **`URLSearchParams`** using **constant query keys** (`QUERY.DEBUG` etc.; `?riskbreaker=1` unchanged) so **`pnpm e2e`** never depends on debug output (epic **RSK-xfc8** — children **RSK-n8wk**, **RSK-p4jm**).
- **Root scripts:** Add **`pnpm build:playstation`** (and optionally wire **`apps/web` `build`** to run it **before** `vite build` once stable — document in **RSK-wquv**; start with **manual** `build:playstation` to avoid CI surprises).

## Implementation Steps

### Milestone A — **RSK-fye3** (build pipeline + layout)

1. Create **`apps/web/playstation-src/tsconfig.json`** extending repo base (or `apps/web/tsconfig.json` patterns) with **`noEmit`** for editor-only or emit to `dist-playstation/` ignored by git — prefer **esbuild-only** emit to `public/`.
2. Add **esbuild** + **`@types/node`** if needed only in the package that runs the script.
3. Add **`scripts/build-playstation.mjs`** (or `.ts` with `node --experimental-strip-types`) at repo root or `apps/web/scripts/` that:
   - Bundles `playstation-src/entry.ts` → `apps/web/public/playstation/PlayStation.js`;
   - Sets **IIFE** or **global** format consistent with current script (today: top-level `var WASM_FILE`, `Module`, etc. — **no ESM** in `PlayStation.htm`).
4. **Copy current** `PlayStation.js` content into **`entry.ts`** as a **single re-export or verbatim** first PR if needed, then immediately split in **RSK-7lri**; or move file and **import** — goal is **byte- or behaviour-parity** before edits.
5. Document in **`apps/web/README.md`** (already mentions spike): `pnpm build:playstation` + when to run.
6. Run **`pnpm e2e`** — must pass.

### Milestone B — **RSK-7lri** (split modules + 2↔3 edge)

1. Extract **`wasm-embed.ts`**: export `WASM_FILE` string (or loader).
2. Extract **`riskbreaker-bootstrap.ts`**: `#rb-playstation-host`, shadow DOM, pointer-events (matches [`playstation-engine-hacking.md`](../playstation-engine-hacking.md) table).
3. Add **`emulator-bridge.ts`**: minimal **`RiskbreakerEmulatorHost`** (name TBD) interface + registration (`registerRiskbreakerHost` or `window.__riskbreakerEmulatorHost`); **stubs** for snapshot/export until a later adapter task. **No** `plugins/*` imports.
4. Keep **Emscripten bulk** in **`emscripten-glue.ts`** or **`.js` + side-effect import** if typing is impractical; call into bridge at safe lifecycle points only when wiring is ready (may be no-ops first).
5. Re-run **`pnpm build:playstation`**; **`pnpm e2e`**.

### Milestone C — **RSK-74eh** (backtick Riskbreaker overlay)

1. Implement **global backtick** listener (or capture path that works with canvas focus); toggle overlay visibility.
2. Render **shadcn-aligned** shell (React island, separate chunk, or CSS — match `apps/web` stack where feasible); **z-index** above canvas; pointer/focus behaviour documented.
3. Placeholder content OK; **no** full `SessionOrchestrator` / plugin wiring required for done.
4. **`pnpm e2e`** passes; optional lightweight keyboard test or manual QA in docs.

### Milestone D — **RSK-xfc8** (epic: telemetry, perf HUD, Riskbreaker menu)

**RSK-n8wk** — debug query constants, central flag, **steady-state** frame zones (`Browser.mainLoop` / `runIter`, optional audio), **on-screen perf HUD** when enabled; optional `performance.mark` / `measure`.

**RSK-p4jm** — Riskbreaker overlay **menu**: toggles for **perf HUD**, **speed hack** (main-loop timing), **upscaling** (canvas / `scaleMode` path); persist via namespaced `localStorage`; wire through **`__riskbreakerEmulatorHost`** / glue hooks (**RSK-7lri**).

**Epic criteria:** default **off** on prod-like paths; **`pnpm e2e`** unchanged / never depends on HUD or toggles.

### Milestone E — **RSK-wquv** (docs, LICENSE, CI)

1. Update [`docs/playstation-engine-hacking.md`](../playstation-engine-hacking.md) with **build commands** and module map.
2. Add a short **2→host→4→3** subsection to [`docs/architecture.md`](../architecture.md) (or extend hacking doc) pointing at the bridge interface in source; add **backtick overlay** QA notes.
3. Extend [`LICENSE.playstation.txt`](../../apps/web/public/playstation/LICENSE.playstation.txt) if the repo adds **substantial** new authored code (summarise in PR).
4. Decide **CI:** optional **`pnpm build:playstation && pnpm build`** in `.github/workflows` if present; else document **manual** pre-release step.
5. Final **`pnpm e2e`**.

## Edge Cases

- **IIFE vs ESM:** `PlayStation.htm` uses **classic** `script.src` load — the bundle must not rely on `import` in the browser unless the shell is updated. Esbuild **`format: "iife"`** (or **`format: "esm"`** + `type="module"` change — avoid in v1).
- **COOP/COEP:** [`apps/web/vite.config.ts`](../../apps/web/vite.config.ts) sets **COOP/COEP** for dev/preview; **`public/`** files are served by the same Vite server — do not strip headers during refactor.
- **Worker URL / blob:** If the glue uses **`new Worker(blob)`** or relative worker paths, changing public paths can break WASM; keep **output basename** `PlayStation.js` until a dedicated worker task.
- **Overlay vs shadow DOM / canvas:** **RSK-74eh** may need a mount **outside** the canvas shadow root or explicit stacking context — align with **RSK-7lri** mount-point notes.
- **Prettier:** Root **`pnpm format:playstation`** formats **output**; add **`playstation-src/**/\*.ts`** to normal Prettier once sources exist (exclude generated `public/playstation/PlayStation.js` or regenerate after format).
- **Large file Git:** First commit of split may touch **WASM string** — expect large diff; use **git LFS** only if team policy requires (not assumed here).

## Mapping to Groove tasks

| Bean         | This plan   |
| ------------ | ----------- |
| **RSK-fye3** | Milestone A |
| **RSK-7lri** | Milestone B |
| **RSK-74eh** | Milestone C |
| **RSK-xfc8** | Milestone D (epic; **RSK-n8wk** + **RSK-p4jm**) |
| **RSK-wquv** | Milestone E |
