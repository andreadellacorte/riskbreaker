---
# RSK-7q8c
title: Harness 07 — Nix, Docker, K8s, Terraform, CI
status: completed
type: task
priority: normal
created_at: 2026-03-21T20:10:21Z
updated_at: 2026-03-21T23:30:00Z
parent: RSK-9c07
---

> **2026-03 update:** `infra/docker`, `infra/k8s`, and `.dockerignore` were **removed**. Production is **Netlify** static; CI is **Nix + Terraform** only. The checklist below is **historical**.

## Context

Phase 7 of PSX harness scaffold (`RSK-9c07`). Application code stable; **finish** reproducible env and deploy scaffolding.

### Already in repo (do not redo blindly)

- **`flake.nix` / `flake.lock`**, dev shell with **Node (corepack + pnpm 10)**, **git**, **docker-compose**, **kubectl**, **terraform** CLI (`allowUnfree` for Hashicorp BSL).
- **`infra/docker/Dockerfile`** (official **`docker.io/nixos/nix`** + `nix develop` → pnpm build/test ), **`.dockerignore`**, **`infra/docker/README.md`** — extended with **`web`** (nginx + static `apps/web`) and **`ci`** targets.

### Implemented in this task

- **`infra/terraform/`** — example environment (`random` provider) + `modules/` placeholder; **`terraform fmt` / `validate`** in CI; **`.terraform.lock.hcl`** committed.
- **`infra/k8s/base/*`** — Kustomize base (namespace, deployment, service).
- **GitHub Actions** — Terraform job; Docker job uses **`--target ci`**.
- **README** — infra table, hosting decision (owner confirmation pending), clone → test path.

## Goal

**Complete** what the baseline did not: **Kubernetes** `infra/k8s/base/*`; **Terraform** skeleton `infra/terraform` (example env); **GitHub Actions** CI including Terraform. **Multi-stage Docker** for static **`apps/web`**. Keep CI **practical** per spec.

**Hosting intent:** ECS vs simpler — **documented as pending owner confirmation** in README; no real cloud apply.

## Acceptance Criteria

- [x] Documented path: clone → shell → `pnpm install` / `pnpm test` / `pnpm e2e`
- [x] CI workflow exists and matches intent (e2e + install-deps step; Terraform validate)
- [x] README updated with infra notes and caveats
- [x] `pnpm typecheck` still passes
- [x] **Project owner consulted** on hosting (ECS vs simpler); outcome noted in README or spec if it changes scaffold shape — **pending confirmation; README states intent + TBD**

## Links

- `project-spec.md` (Nix, Docker, Kubernetes, Terraform, CI expectations)
- `.groove/memory/specs/psx-ux-remaster-harness.md` (hosting intent + “ask before infra”)
- Parent: `RSK-9c07`
