---
# RSK-p4jm
title: PlayStation bundle — Riskbreaker menu runtime toggles (HUD, speed hack, upscaling)
status: in-progress
type: task
created_at: 2026-03-22T18:00:00Z
updated_at: 2026-03-22T18:00:00Z
parent: RSK-xfc8
---

## Context

Child of epic **RSK-xfc8**. **RSK-74eh** delivered the backtick **Riskbreaker** overlay shell; this task adds **runtime controls** and connects them to the **PlayStation bundle** without game-specific or plugin code in `playstation-src/`.

Depends on **RSK-n8wk** for the **perf HUD** enable API (or parallelise only if HUD stub is agreed first).

## Goal

Extend `#rb-riskbreaker-overlay` (`riskbreaker-overlay.ts` + emitted boot script) with a small **menu** section:

1. **Perf HUD** — enable / disable the on-screen timing HUD from **RSK-n8wk** (not the whole overlay; overlay stays backtick-toggled).
2. **Speed hack** — enable / disable **uncapped or fast main-loop timing** via **`_emscripten_set_main_loop_timing` / `Browser.mainLoop`** (or equivalent hook exported through **`window.__riskbreakerEmulatorHost`** / Module-adjacent API). Document “native” vs “unlimited” behaviour.
3. **Upscaling** — enable / disable **canvas upscaling** (vendored shell **`scaleMode` / `canvasResolutionScaleMode`** or documented canvas CSS path). Must not break fullscreen / letterbox modes without noting tradeoffs.

Persist user choices where reasonable (**`localStorage`** namespaced `riskbreaker:`) so reloads keep state; keep **defaults safe** for CI and first-time users.

## Acceptance Criteria

- [ ] Three labeled controls (checkboxes or switches) in the Riskbreaker panel; keyboard focus order sane; **`Escape`** still closes overlay
- [ ] **HUD** toggle calls into perf HUD API from **RSK-n8wk** (no-op or hidden if bundle not ready — document)
- [ ] **Speed hack** toggles documented timing mode; fails gracefully if Module/main loop not initialised
- [ ] **Upscaling** toggles documented scale path; document interaction with `PlayStation.htm` canvas sizing
- [ ] **`pnpm e2e`** passes (extend smoke only if toggles are no-ops under test URL, or assert stable defaults)

## Links

- Epic **RSK-xfc8**
- **RSK-74eh** — overlay
- **RSK-n8wk** — perf HUD + debug flags
- **RSK-7lri** — host registration / hook points
