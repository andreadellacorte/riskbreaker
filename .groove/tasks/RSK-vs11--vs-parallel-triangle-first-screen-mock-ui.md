---
# RSK-vs11
title: VS remaster — parallel first Triangle screen (mock-fed web UI)
status: completed
type: task
priority: normal
created_at: 2026-03-22T16:00:00Z
updated_at: 2026-03-22T16:00:00Z
parent: RSK-uxvs
---

## Context

Child of **RSK-uxvs**. **North-star UX spike:** when the player would see the **first** screen after **Triangle** (Item root), show a **Riskbreaker web panel** (overlay / slide-over) with **mouse + touch** — data from **mock plugin fixtures** or static view models, **not** live RAM yet. **Native** in-game menu may still render underneath; **no** input interception or menu suppression in v1 — prove **layout, stacking, focus**, and **incremental story** (“we replace one surface first”).

**Does not require** **RSK-l7qs** if the route uses **`MockRuntimeAdapter`** only; **does** require a **play** surface (e.g. `/play/spike` or post-**RSK-l7qs** session route) and existing **apps/web** shell patterns.

## Goal

- **Trigger** (v1): dev-only hotkey, URL flag, or “Open Riskbreaker Item panel” control — **or** loose sync with Triangle if easy without kernel hooks (stretch).
- **UI:** List / grid matching **first** Item screen affordances (use item entry point); **sub-menus** remain **native** until later beans.
- **A11y basics:** focus trap in panel, ESC to close, visible close affordance.

## Acceptance Criteria

- [x] Panel lives in the **backtick overlay** on the emulator page — not a separate route; `apps/web` knows nothing about VS
- [x] Data: hardcoded fixture view model (spike); clearly labelled "mock fixture · RSK-vs12 will wire live decoder"
- [x] Renders item list with name, category badge, detail — inside existing `#rb-riskbreaker-overlay`
- [x] `pnpm typecheck` green; 31 tests pass; shell bundle rebuilt

## Manual QA

1. `pnpm dev` → navigate to `/play/spike`, load `240pTestSuitePS1-EMU.bin`
2. Press **`` ` ``** — Riskbreaker overlay opens
3. Scroll down: **Vagrant Story — Items** section shows character summary + item rows
4. Emulator keeps running behind the overlay

## Done (2026-03-24)

- `packages/pcsx-wasm-shell/src/riskbreaker-overlay.ts` — VS Items section added to overlay
- `apps/web/public/pcsx-wasm/js/riskbreaker-pcsx-wasm-boot.js` — rebuilt

## Links

- Parent: **RSK-uxvs**
- Informed by: **RSK-vs10** (recommended) — [vagrant-story-menu-research.md](../../docs/vagrant-story-menu-research.md) (GameFAQs menu FAQ, Reddit feedback, Figma UX proto)
- Fixture parity: [vagrant-story-inventory-reference.md](../../docs/vagrant-story-inventory-reference.md) (starting usable items)
- Precedes: **RSK-vs12** (real data)
