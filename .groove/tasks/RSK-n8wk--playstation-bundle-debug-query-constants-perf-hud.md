---
# RSK-n8wk
title: PlayStation bundle — debug query constants & perf HUD
status: in-progress
type: task
created_at: 2026-03-22T18:00:00Z
updated_at: 2026-03-22T18:00:00Z
parent: RSK-xfc8
---

## Context

Child of epic **RSK-xfc8** (telemetry + Riskbreaker menu). Foundation for **RSK-p4jm**: the perf **HUD** toggle in the menu should drive the same surface implemented here.

## Goal

- Introduce **typed / constant query keys** (e.g. `const QUERY = { DEBUG: "debug", … } as const`) and a **single place** that resolves “debug / telemetry on” from URL, optional `localStorage`, and optionally dev build policy — **no** scattered `'debug'` string literals.
- Add **steady-state** timing zones around the Emscripten **main loop** (`runIter`, optional audio flush) in **`playstation-src`** (emit to `public/playstation/` via existing pipeline).
- **On-screen perf HUD** (DOM or canvas) that shows zone ms / share when enabled — **off** by default; **`pnpm e2e`** does not depend on it.

## Acceptance Criteria

- [ ] `QUERY.DEBUG` (or equivalent) used for URL parsing; documented in `playstation-src/README.md` or `docs/playstation-engine-hacking.md`
- [x] Legacy URL alias **`rbdebug`** removed (use **`?debug=1`**)
- [ ] Frame-zone instrumentation + HUD render path behind the same **central flag** (menu will reuse in **RSK-p4jm**)
- [ ] Optional: `performance.mark` / `measure` for DevTools parity with HUD zones
- [ ] **`pnpm e2e` passes**

## Links

- Epic **RSK-xfc8**
- **RSK-7lri** — glue / hook placement
- [docs/brainstorms/playstation-js-modularize-typescript.md](../../docs/brainstorms/playstation-js-modularize-typescript.md)
