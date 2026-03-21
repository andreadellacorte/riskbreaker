---
# RSK-0o5v
title: Harness 06 — Vitest, Playwright, scripts
status: completed
type: task
priority: normal
created_at: 2026-03-21T20:10:21Z
updated_at: 2026-03-21T22:00:00Z
parent: RSK-9c07
---

## Context

Phase 6 of Riskbreaker Phase 1 (`RSK-9c07`). Depends on runnable app and packages.

## Goal

**Playwright** for `apps/web` + root **`pnpm e2e`** + **one smoke test** aligned with `project-spec.md`. **CI-friendly** test story (document Nix/Docker for browsers).

**Vitest:** root **`vitest.config.mts`** and **`pnpm test`** / **`pnpm test:watch`** — keep green; extend coverage as packages grow.

## Acceptance Criteria

- [x] `pnpm test` passes; `pnpm e2e` passes in supported env (document Nix/caveats in README)
- [x] `pnpm typecheck` passes
- [x] README documents test commands

## Links

- `project-spec.md` (Testing requirements, CI expectations)
- `.groove/memory/specs/psx-ux-remaster-harness.md`
- Parent: `RSK-9c07`
