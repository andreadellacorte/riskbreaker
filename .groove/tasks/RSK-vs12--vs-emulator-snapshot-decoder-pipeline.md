---
# RSK-vs12
title: VS remaster — emulator snapshot → decoder → view model (inventory-first)
status: todo
type: task
priority: normal
created_at: 2026-03-22T16:00:00Z
updated_at: 2026-03-22T16:00:00Z
parent: RSK-uxvs
---

## Context

Child of **RSK-uxvs**. Replace **mock-fed** panel data (**RSK-vs11**) with at least **one** real path: **emulator** exposes memory or save-adjacent blob → **Vagrant Story** plugin **decoder** (extend existing mocks) → **shared view model** consumed by the **same** web panel. May be **dev-only**, **throttled**, or **on-demand** (“refresh” button) — prove the **pipe**, not performance.

**Depends on** **RSK-l7qs** (`EmulatorRuntimeAdapter` / shared session types) so snapshots flow through **`SessionOrchestrator`** without ad-hoc globals.

## Goal

- **Snapshot source:** Document chosen approach (core callback, periodic read, save-state capture) — minimal viable.
- **Decoder:** Inventory-relevant fields first (align with **RSK-vs10** findings).
- **UI:** Wire **RSK-vs11** panel to live data path behind a **flag** (`?vsLive=1` or similar).

## Acceptance Criteria

- [ ] End-to-end path **typed** through `packages/*` / plugin boundaries — **no** plugin imports from emulator bundle
- [ ] **Gaps documented** (what is not decoded yet, latency, failure modes)
- [ ] **Unit or integration** test for decoder input → view model (fixture binary or recorded buffer if needed)
- [ ] **`pnpm typecheck` / `pnpm test`** green; E2E optional if environment-heavy

## Links

- Parent: **RSK-uxvs**
- Depends on: **RSK-l7qs**
- Uses: **RSK-vs10**, **RSK-vs11**
- Precedes: **RSK-vs13**
