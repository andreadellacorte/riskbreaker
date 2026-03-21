---
# RSK-raps
title: Harness 01 — Workspace and root config
status: completed
type: task
priority: normal
created_at: 2026-03-21T20:10:21Z
updated_at: 2026-03-21T21:05:00Z
parent: RSK-9c07
---

## Context

Phase 1 of PSX harness scaffold (`RSK-9c07`). Establishes the monorepo foundation before any feature packages.

## Goal

Root **pnpm workspace** and tooling: `pnpm-workspace.yaml`, root `package.json` with core scripts (`dev`, `build`, `lint`, `typecheck`, `test`, `e2e` placeholders as needed), `tsconfig.base.json`, ESLint + Prettier + `packages/shared-config` (or equivalent). **Commits/changes grouped logically.**

## Acceptance Criteria

- [x] `pnpm install` works; workspace globs `apps/*`, `packages/*`, `plugins/*`
- [x] `pnpm typecheck` passes at root (empty packages OK if configured)
- [x] README updated with current scripts and layout
- [x] Matches `project-spec.md` monorepo expectations for this layer

## Addendum (stack baseline)

After Harness 01, the repo also picked up **end-stack** tooling so development matches the target stack (see epic **RSK-9c07** “Development stack”): **`flake.nix` / `flake.lock`**, **`.envrc`** (optional direnv), **`infra/docker/Dockerfile`**, **`.dockerignore`**. **Terraform** and **Playwright** full setup remain **Harness 07** and **Harness 06** respectively.

## Links

- `project-spec.md` (Monorepo structure, Tech choices)
- Parent: `RSK-9c07`
