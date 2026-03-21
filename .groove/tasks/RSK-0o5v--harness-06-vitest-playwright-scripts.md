---
# RSK-0o5v
title: Harness 06 — Vitest, Playwright, scripts
status: todo
type: task
priority: normal
created_at: 2026-03-21T20:10:21Z
updated_at: 2026-03-21T20:47:54Z
parent: RSK-9c07
---

## Context

Phase 6 of Riskbreaker Phase 1 (`RSK-9c07`). Depends on runnable app and packages.

## Goal

**Playwright** for `apps/web` + root **`pnpm e2e`** (real runner, not placeholder) + **one smoke test** per `project-spec.md`. **CI-friendly** test story (document Nix/Docker for browsers).

**Vitest:** root **`vitest.config.mts`** and **`pnpm test`** / **`pnpm test:watch`** landed in **Harness 02** — keep them green; extend coverage as packages grow.

**Playwright:** **not started** in the repo yet (no `@playwright/test`, no `playwright.config`, root `e2e` still echoes). This task **adds Playwright** and replaces the **`e2e` script** with `playwright test` (or equivalent).

**Note:** “Harness 06” is **not** the first unit tests — it **completes** E2E + final test/CI wiring. Epic **RSK-9c07** expects the **end stack** early; Playwright belongs here even if a minimal install is possible once `apps/web` runs (Harness 05).

## Acceptance Criteria

- [ ] `pnpm test` passes; `pnpm e2e` passes in supported env (document Nix/caveats in README)
- [ ] `pnpm typecheck` passes
- [ ] README documents test commands

## Links

- `project-spec.md` (Testing requirements, CI expectations)
- `.groove/memory/specs/psx-ux-remaster-harness.md`
- Parent: `RSK-9c07`
