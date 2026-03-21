---
# RSK-gc8g
title: Harness 05 — apps/web (and docs shell) integration
status: todo
type: task
created_at: 2026-03-21T20:10:21Z
updated_at: 2026-03-21T20:10:21Z
parent: RSK-9c07
---

## Context

Phase 5 of PSX harness scaffold (`RSK-9c07`). Depends on engines + VS plugin.

## Goal

**`apps/web`** (Vite + React): home, load mock manifest, plugin selection, render mock inventory from decoded state, trigger sample command, display command plan. **`apps/docs`** placeholder if spec requires. **Mocked end-to-end flow runs in the browser** (or dev server).

## Acceptance Criteria

- [ ] `pnpm dev` runs web app; user-visible flow matches `project-spec.md` example flow
- [ ] `pnpm typecheck` passes including app
- [ ] README updated with dev instructions

## Links

- `project-spec.md` (apps/web, Example development flow)
- Parent: `RSK-9c07`
