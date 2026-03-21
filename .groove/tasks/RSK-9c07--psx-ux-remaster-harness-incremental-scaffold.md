---
# RSK-9c07
title: Riskbreaker — Phase 1 foundation (incremental)
status: in-progress
type: epic
priority: normal
created_at: 2026-03-21T20:09:47Z
updated_at: 2026-03-21T23:00:00Z
---

## Context

Build **Riskbreaker** (PSX UX remaster platform) from `project-spec.md` in **incremental, package-by-package** steps. Prefer **working mocks** over empty stubs; the mocked end-to-end flow must run. **Scaffold** = shared `packages/*` that **`plugins/`** plug into — not “defer plugins.” ROM/BIOS under `bins/` for later integration. **Plugin art** (e.g. VS imagery via `ai-image-generation`) lives under the plugin; document usage.

### Development stack (policy)

Develop on the **target end stack from the beginning**, not “plain Node now, infra later.” Concretely:

- **pnpm** + **TypeScript** — monorepo default (always).
- **Nix** — `nix develop` / `flake.nix` + `flake.lock` for reproducible toolchain (Node via corepack + pinned pnpm, git, docker-compose, kubectl, terraform CLI).
- **Docker** — `infra/docker/Dockerfile` + `.dockerignore` for CI-style builds; evolve with `apps/web`.
- **Terraform / K8s / CI / Playwright** — introduced in **Harness 06–07** as **full scaffolding** (`infra/terraform`, K8s manifests, GHA, `@playwright/test`, Nix notes for browser deps). **Status today:** Terraform **CLI** is in the Nix shell; **IaC layout** and **Playwright** are **not** in the repo yet (see child tasks **RSK-0o5v**, **RSK-7q8c**).

## Goal

Deliver a runnable pnpm workspace with typed packages, builds, tests, and README updates at each phase; **typecheck must pass** before advancing to the next phase. **Stack alignment** above is non-optional for new work.

## Acceptance Criteria

- [ ] Epic tracks 8 ordered child tasks (workspace → shared/sdk → **mock plugin + fixtures** → engines/app-shell → web → test/CI wiring + E2E → infra → docs)
- [ ] **End-stack policy** (see Context): pnpm + Nix + Docker baseline early; Terraform **modules** + Playwright **install** completed in Harness **06–07** (not only at the very end)
- [ ] Each phase ends with `pnpm typecheck` (and tests where applicable) green
- [ ] Implementation follows `project-spec.md` and `.groove/memory/specs/psx-ux-remaster-harness.md`

## Links

- Product: `project-spec.md`
- Outcome spec: `.groove/memory/specs/psx-ux-remaster-harness.md`
- Assets: `bins/` (ROM, BIOS — reference for later work)

### Browser play (Phase 2 — real emulator, not in Harness 01–08)

Ordered beans to reach **test the game in the browser** using local `bins/`:

1. **`RSK-l7qp`** — Playable 01: emulator WASM/core spike in the browser (boot to menu/title).
2. **`RSK-l7qr`** — Playable 02: dev-only loading from `bins/` + play page ergonomics.
3. **`RSK-l7qs`** — Playable 03: `IRuntime` / session bridge (`EmulatorRuntimeAdapter` vs `MockRuntimeAdapter`).

These depend on **Harness 05** (`RSK-gc8g`) for a real Vite shell; Playable 01 can start as a spike route in parallel if needed.
