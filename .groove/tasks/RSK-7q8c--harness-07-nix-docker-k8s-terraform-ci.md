---
# RSK-7q8c
title: Harness 07 — Nix, Docker, K8s, Terraform, CI
status: todo
type: task
priority: normal
created_at: 2026-03-21T20:10:21Z
updated_at: 2026-03-21T20:51:13Z
parent: RSK-9c07
---

## Context

Phase 7 of PSX harness scaffold (`RSK-9c07`). Application code stable; **finish** reproducible env and deploy scaffolding. Epic **RSK-9c07** requires the **end stack** early — Nix + Docker baseline may already exist; this task completes **IaC + orchestration + CI**.

### Already in repo (do not redo blindly)

- **`flake.nix` / `flake.lock`**, dev shell with **Node (corepack + pnpm 9.x)**, **git**, **docker-compose**, **kubectl**, **terraform** CLI (`allowUnfree` for Hashicorp BSL).
- **`infra/docker/Dockerfile`** (official **`docker.io/nixos/nix`** + `nix develop` → pnpm build/test ), **`.dockerignore`**, **`infra/docker/README.md`** — extend with a prod stage when `apps/web` is real.

### Still to implement here

- **`infra/terraform/`** skeleton (modules, envs, README, **placeholder** providers — confirm ECS vs simpler with owner first).
- **`infra/k8s/base/*`** (generic manifests).
- **GitHub Actions** workflow: install, lint, typecheck, test, build, e2e.
- **Nix shell:** optional **Playwright OS deps** or documented `pnpm exec playwright install` (may overlap Harness **RSK-0o5v**).

## Goal

**Complete** what the baseline did not: **Kubernetes** `infra/k8s/base/*`; **Terraform** skeleton `infra/terraform` (modules, envs); **GitHub Actions** CI (install, lint, typecheck, test, build, e2e). Evolve **Docker** to **multi-stage `apps/web`** when the Vite app exists. Keep CI **practical** per spec.

**Hosting intent:** We are *thinking* about something like **AWS ECS** (containers, Terraform-friendly). **Simpler options** (e.g. static hosting) stay on the table — see `.groove/memory/specs/psx-ux-remaster-harness.md`.

**Before implementing this task:** **Ask the project owner** to confirm hosting and how far Terraform should lean (ECS vs simpler). Do not provision real cloud resources or lock a provider without that answer.

## Acceptance Criteria

- [ ] Documented path: clone → shell → `pnpm install` / `pnpm test` / `pnpm e2e`
- [ ] CI workflow exists and matches intent (e2e may need install-deps step)
- [ ] README updated with infra notes and caveats
- [ ] `pnpm typecheck` still passes
- [ ] **Project owner consulted** on hosting (ECS vs simpler); outcome noted in README or spec if it changes scaffold shape

## Links

- `project-spec.md` (Nix, Docker, Kubernetes, Terraform, CI expectations)
- `.groove/memory/specs/psx-ux-remaster-harness.md` (hosting intent + “ask before infra”)
- Parent: `RSK-9c07`
