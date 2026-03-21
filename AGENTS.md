# Agent instructions

Load `project-spec.md`, `.groove/memory/index.md`, and the task list from `/groove-utilities-task-list` to see what we are doing.

Run /using-superpowers skill.

**Product:** **Riskbreaker** — PSX UX remaster platform (Phase 1 = shared `packages/*` + mock `plugins/vagrant-story` + mocked vertical slice + tests + infra scaffolding). Groove “Harness 01–08” is delivery order, not “tests only at the end.”

**Stack:** Target **end stack from the start** — **pnpm**, **`nix develop`**, **Docker** (see epic **RSK-9c07**). **Terraform modules**, **K8s**, **GHA**, **Playwright** are Harness **06–07** (**RSK-0o5v**, **RSK-7q8c**); Terraform **CLI** is already in the Nix shell; **IaC + Playwright npm** are not in the repo until those tasks.

Implement incrementally per `.groove/memory/specs/psx-ux-remaster-harness.md` (plugin + fixtures **before** engines that consume plugin decoders; **TDD** once Vitest is wired).

Rules:

- work package by package
- keep commits or changes logically grouped
- prefer mock implementations over stubs that do nothing
- make the mocked end-to-end flow actually run
- ensure all packages build
- ensure tests pass
- keep README updated as you go

As you implement, enforce these architectural constraints:

- no game-specific logic outside `/plugins`
- no UI component may access raw runtime memory directly
- no package may import from an app
- generic packages must not depend on plugins
- every package must expose a clean public API via `index.ts`
- tests must use fixtures where possible
- prefer composition over inheritance
- annotate extension points with comments for future real emulator integration

Also:

- follow **test-driven-development** for new behavior where practical
- create at least one fixture-driven **decoder** test and one **command-planning** test
- one **Playwright** smoke test for the mocked inventory flow (after `apps/web` runs the slice)
- **Plugin art:** `ai-image-generation` is in scope for Vagrant Story visuals (e.g. Rood Inverse, Lea Monde, characters); keep assets under `plugins/vagrant-story/` and document usage rights in the plugin README

**Skills layout:** canonical skills live in **`.agents/skills/`**; **`.cursor/skills/`** should symlink to the same paths (one symlink per skill name).

## Groove

This repo uses [groove](https://github.com/andreadellacorte/groove) for workflow. Session context: `/groove-utilities-prime` (optional: install Cursor hooks via `/groove-admin-cursor-hooks`). Daily rhythm: `/groove-daily-start` and `/groove-daily-end`.

<!-- groove:task:start -->

Tasks use beans (`.groove/tasks/`). Use `/groove-utilities-task-list`, `/groove-utilities-task-create`, and related `/groove-utilities-task-*` skills as needed.

<!-- groove:task:end -->
