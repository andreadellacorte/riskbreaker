---
# RSK-vs14
title: VS remaster — Equip flow surface (incremental menu replacement)
status: todo
type: task
priority: normal
created_at: 2026-03-22T16:00:00Z
updated_at: 2026-03-22T16:00:00Z
parent: RSK-uxvs
---

## Context

Child of **RSK-uxvs**. After the **first** Triangle / Item screen (**RSK-vs11–vs13**), replace or shadow the **Equip** branch with **Riskbreaker** UI: touch + mouse friendly, fewer steps than **Triangle → … → Equip → …**. Reuse **decoder** and **input** patterns from prior beans; **expand** view models in **Vagrant Story** plugin as needed.

## Goal

- **Parity:** Player can **change equipment** through Riskbreaker UI for the scoped subset (document limits).
- **Fallback:** Native Equip path still reachable if flag off or on error.

## Acceptance Criteria

- [ ] **Scope** written (which equipment slots / screens)
- [ ] **Data + input** paths reuse **RSK-vs12** / **RSK-vs13** patterns — no new architecture forks
- [ ] **Manual QA** checklist; automated tests where cheap
- [ ] **`pnpm typecheck` / `pnpm e2e`** green for regression suite

## Links

- Parent: **RSK-uxvs**
- Depends on: **RSK-vs13** (for real input), **RSK-vs10** (menu map)
- Starting loadout (fixtures / parity): [vagrant-story-equipment-reference.md](../../docs/vagrant-story-equipment-reference.md)
