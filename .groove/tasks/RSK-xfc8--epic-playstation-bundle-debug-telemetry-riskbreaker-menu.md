---
# RSK-xfc8
title: 'Epic: PlayStation bundle — debug telemetry, perf HUD, Riskbreaker menu runtime controls'
status: completed
type: epic
priority: normal
created_at: 2026-03-22T00:47:56Z
updated_at: 2026-03-22T03:43:23Z
---

## Context

Child of **RSK-v50c**. Combines **dev-only telemetry** (no third-party analytics) with **user-facing runtime switches** exposed from the **Riskbreaker overlay** (`RSK-74eh`), so tuning does not depend on URL hacks alone.

Per [brainstorm](../../docs/brainstorms/playstation-js-modularize-typescript.md): gate signals with **`QUERY.DEBUG`-style constants** (not raw string literals in call sites), optional **`import.meta.env.DEV`**, optional **`localStorage`**, default **off** on prod-like paths.

**Perf focus:** steady-state **where time goes inside the bundle** (e.g. `Browser.mainLoop` / `runIter`, WASM vs glue vs audio), not only init — including an **on-screen HUD** when enabled, so “speed hack” runs can be read without DevTools alone.

**Menu focus:** extend the backtick **Riskbreaker** panel with toggles for **(1) perf HUD on/off**, **(2) speed hack on/off** (main-loop timing / uncapped iteration), **(3) upscaling on/off** (canvas / `scaleMode` / resolution-scale path in the vendored shell). Wiring goes through **named host or Module-adjacent hooks** (`__riskbreakerEmulatorHost` / **RSK-7lri** bridge direction) — **no** plugin imports in `playstation-src/`.

## Goal

1. **Epic-level “done”:** documented opt-in; **`pnpm e2e`** never depends on debug/HUD/toggles; child tasks below are trackable units of work.
2. **Telemetry / HUD:** frame-zone timing (and optional `performance.mark` / `measure`) usable later for **2→host** bridge metrics.
3. **Menu:** three controls persist intent (session or `localStorage` — decide per child) and call into the bundle safely when the emulator is live.

## Acceptance Criteria (epic)

- [ ] **RSK-n8wk** closed — query constants, central debug flag, perf HUD pipeline (off by default).
- [ ] **RSK-p4jm** closed — Riskbreaker menu implements HUD / speed hack / upscaling toggles and wires to hook points.
- [ ] **`pnpm e2e` passes** throughout (smoke does not assert on HUD or menu state unless explicitly gated).

## Suggested child order

1. **RSK-n8wk** — **Debug flags & perf HUD** (constants, instrumentation zones, on-screen HUD element; menu can call into the same API later).
2. **RSK-p4jm** — **Riskbreaker menu runtime toggles** (three switches + bridge into `_emscripten_set_main_loop_timing` / canvas scale path as applicable).

## Links

- [docs/brainstorms/playstation-js-modularize-typescript.md](../../docs/brainstorms/playstation-js-modularize-typescript.md)
- Overlay spike **RSK-74eh** — `apps/web/playstation-src/riskbreaker-overlay.ts`
- Bridge / hooks **RSK-7lri**

## Children

- **RSK-n8wk** — PlayStation bundle — debug query constants & perf HUD
- **RSK-p4jm** — PlayStation bundle — Riskbreaker menu runtime toggles (HUD, speed hack, upscaling)
