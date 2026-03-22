---
# RSK-xfc8
title: PlayStation bundle — dev-only debug telemetry
status: todo
type: task
created_at: 2026-03-22T00:47:56Z
updated_at: 2026-03-22T00:47:56Z
parent: RSK-v50c
---

## Context

Child of **RSK-v50c**. Per brainstorm: dev-only telemetry (`?debug=1`, or dev build, or `localStorage`) — Performance marks, structured console logs for load phases / worker / frame pacing. No third-party analytics.

## Goal

Opt-in signals to guide optimisation before WASM C++ work. Telemetry should be **usable for the 2→host bridge** later (e.g. mark phases the adapter will care about), without coupling to plugins.

## Acceptance Criteria

- [ ] Telemetry off in default prod-like path; documented toggle
- [ ] Optional: log/measure **overlay** open/close if **RSK-74eh** lands — still **off** unless debug mode
- [ ] **`pnpm e2e` passes** (no reliance on debug flag for smoke tests)

## Links

- [brainstorm](../../docs/brainstorms/playstation-js-modularize-typescript.md)
