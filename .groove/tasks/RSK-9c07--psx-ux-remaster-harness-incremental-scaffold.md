---
# RSK-9c07
title: Riskbreaker — Phase 1 foundation (incremental)
status: completed
type: epic
priority: normal
created_at: 2026-03-21T20:09:47Z
updated_at: 2026-03-22T14:00:00Z
---

## Context

Build **Riskbreaker** (PSX UX remaster platform) from `project-spec.md` in **incremental, package-by-package** steps. Prefer **working mocks** over empty stubs; the mocked end-to-end flow must run. **Scaffold** = shared `packages/*` that **`plugins/`** plug into — not “defer plugins.” ROM/BIOS under `bins/` for later integration. **Plugin art** (e.g. VS imagery via `ai-image-generation`) lives under the plugin; document usage.

### Development stack (policy)

Develop on the **target end stack from the beginning**, not “plain Node now, infra later.” Concretely:

- **pnpm** + **TypeScript** — monorepo default (always).
- **Nix** — `nix develop` / `flake.nix` + `flake.lock` for reproducible toolchain (Node via corepack + pinned pnpm, git, terraform CLI, netlify-cli).
- ~~**Docker**~~ — removed; **Netlify** builds static `apps/web`.
- **Terraform / CI / Playwright** — **Harness 06–07** delivered Vitest, Playwright, Nix CI, Terraform for GitHub (`infra/terraform/environments/github`). **Docker / K8s** were removed in favour of **Netlify** static deploys (see **RSK-7q8c** note).

## Goal

Deliver a runnable pnpm workspace with typed packages, builds, tests, and README updates at each phase; **typecheck must pass** before advancing to the next phase. **Stack alignment** above is non-optional for new work.

## Acceptance Criteria

- [x] Epic tracks 8 ordered child tasks (workspace → shared/sdk → **mock plugin + fixtures** → engines/app-shell → web → test/CI wiring + E2E → infra → docs) — **RSK-raps … RSK-slzy** completed
- [x] **End-stack policy** (see Context): pnpm + Nix early; Terraform + Playwright + CI in **06–07**; **no** Docker/K8s in-repo (Netlify for static)
- [x] Each phase ends with `pnpm typecheck` (and tests where applicable) green
- [x] Implementation follows `project-spec.md` and `.groove/memory/specs/psx-ux-remaster-harness.md` (ongoing product work continues outside this epic)

**Closed 2026-03-22:** All harness child tasks **RSK-raps** through **RSK-slzy**, plus **RSK-0o5v**, **RSK-7q8c**, **RSK-9nf7**, are **completed**. Phase 2 “Playable” beans (**RSK-l7qp** …) remain future work.

## Links

- Product: `project-spec.md`
- Outcome spec: `.groove/memory/specs/psx-ux-remaster-harness.md`
- Assets: `bins/` (ROM, BIOS — reference for later work)

### Browser play (Phase 2 — real emulator, not in Harness 01–08)

Baseline spikes:

1. **`RSK-l7qp`** — Playable 01: emulator WASM/core spike in the browser (boot to menu/title).
2. **`RSK-l7qr`** — Playable 02: dev-only loading from `bins/` + play page ergonomics (**scrapped**).

**Further work** (emulator-backed session, Vagrant Story remaster UI, incremental Triangle menu replacement) is tracked under epic **`RSK-uxvs`**, starting with **`RSK-l7qs`** (Playable 03: `IRuntime` / `EmulatorRuntimeAdapter`).

These depend on **Harness 05** (`RSK-gc8g`) for a real Vite shell; Playable 01 can start as a spike route in parallel if needed.
