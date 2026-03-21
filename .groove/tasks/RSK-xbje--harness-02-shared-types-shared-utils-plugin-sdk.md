---
# RSK-xbje
title: Harness 02 — shared-types, shared-utils, plugin-sdk
status: completed
type: task
priority: normal
created_at: 2026-03-21T20:10:21Z
updated_at: 2026-03-21T21:05:00Z
parent: RSK-9c07
---

## Context

Phase 2 of PSX harness scaffold (`RSK-9c07`). Depends on workspace root from phase 1.

## Goal

Implement **`packages/shared-types`**, **`packages/shared-utils`**, and **`packages/plugin-sdk`** with real TypeScript exports: contracts (`IGamePlugin`, decoders, packs, codecs per spec), shared domain types (`GameManifest`, `RuntimeSnapshot`, etc.). Prefer **small, explicit types**; Zod optional where it helps.

## Acceptance Criteria

- [x] All three packages build and `pnpm typecheck` passes
- [x] `plugin-sdk` exports discovery/registration shapes; no game-specific code
- [x] README or package stubs updated
- [x] Changes committed in logical groups

## Links

- `project-spec.md` (Package responsibilities: plugin-sdk, shared-types, shared-utils)
- `.groove/memory/specs/psx-ux-remaster-harness.md`
- Parent: `RSK-9c07`
