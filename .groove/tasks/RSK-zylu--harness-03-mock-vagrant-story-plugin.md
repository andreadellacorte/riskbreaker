---
# RSK-zylu
title: Harness 03 — mock Vagrant Story plugin
status: todo
type: task
created_at: 2026-03-21T20:10:21Z
updated_at: 2026-03-21T20:10:21Z
parent: RSK-9c07
---

## Context

Phase 3 of PSX harness scaffold (`RSK-9c07`). Depends on plugin-sdk + shared types.

## Goal

**`plugins/vagrant-story`**: first game plugin with **working mocks** — metadata, `canHandle(manifest)`, JSON fixtures (manifest, runtime snapshot, decoded inventory, command plans), mock decoder/domain/command/UI/save registrations. Should be copy-pasteable as the reference plugin.

## Acceptance Criteria

- [ ] Plugin builds; `pnpm typecheck` passes for repo
- [ ] Fixtures under `plugins/vagrant-story/.../fixtures` (or as specified in spec)
- [ ] Mocks return coherent data (not no-ops)
- [ ] README updated
- [ ] `bins/` ROM/BIOS not required for mocks; document future hook if useful

## Links

- `project-spec.md` (plugins/vagrant-story)
- Parent: `RSK-9c07`
