---
# RSK-t1mq
title: Harness 04 — mock runtime, state, domain, command, app-shell
status: completed
type: task
created_at: 2026-03-21T20:10:21Z
updated_at: 2026-03-21T22:45:00Z
parent: RSK-9c07
---

## Context

Phase 4 of PSX harness scaffold (`RSK-9c07`). Wires **engine layer** packages with mocks so data can flow plugin → engines.

## Goal

Implement **`packages/psx-runtime`** (`MockRuntimeAdapter` + contracts), **`packages/state-engine`** (registry, `StateStore`, plugin decoders), **`packages/domain-engine`**, **`packages/command-engine`**, plus **`packages/app-shell`** glue (`SessionOrchestrator`, `PluginRegistry`, `ManifestResolver`) and supporting packages as needed (**asset-pipeline** mock path, **ux-platform**, **save-service**, **devtools** minimal). **Mocked pipeline must be callable in code** (integration-ready for web).

## Acceptance Criteria

- [x] Each package builds; **repo-wide `pnpm typecheck` passes**
- [x] Prefer mocks that exercise real interfaces (memory snapshot → decode → VM → command plan)
- [x] Dependency rules: generic packages do not import plugins
- [x] README(s) updated

## Links

- `project-spec.md` (Architectural rules, package responsibilities)
- Parent: `RSK-9c07`
