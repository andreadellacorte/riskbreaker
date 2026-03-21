# Groove memory — Riskbreaker

## Canonical docs

| Doc | Role |
|-----|------|
| [`project-spec.md`](../../project-spec.md) | Product / architecture source of truth |
| [`specs/psx-ux-remaster-harness.md`](./specs/psx-ux-remaster-harness.md) | Phase 1 outcome spec: naming, workflow order, TDD, tooling alignment |

## Product naming

- **Riskbreaker** — monorepo and working product name (PSX UX remaster **platform**).
- **Phase 1 (foundation)** — shared `packages/*` + mock **`plugins/vagrant-story`** + runnable mocked flow + test/deployment scaffolding. Not full emulation.
- **Groove “Harness 01–08”** — delivery slices (beans under epic **RSK-9c07**), not the same as “test harness” in `project-spec.md` (Vitest/Playwright).

## Agent skills (Cursor)

- **Canonical install path:** `.agents/skills/` (see `skills-lock.json`).
- **Cursor:** `.cursor/skills/*` should be **symlinks** to `.agents/skills/*` so both editors see the same skills. If a skill is missing under `.cursor/skills`, add the symlink.

## Repo state (audit)

**Harness 01 complete:** root pnpm workspace, `packages/shared-config`, ESLint/Prettier, `tsconfig` base, stubs for `apps/web`, `apps/docs`, `plugins/vagrant-story`.

**Harness 02 complete:** `packages/shared-types`, `packages/shared-utils`, `packages/plugin-sdk` (contracts + `resolvePluginForManifest`), root `vitest.config.mts` + `pnpm test`. Matches `project-spec.md`; no game logic in generic packages.

**Tooling baseline (end stack from the start):** `pnpm` + **`flake.nix` / `flake.lock`** (Nix dev shell: corepack/pnpm 10.x, Node 24, git, docker-compose, kubectl, **terraform CLI**) + **`infra/docker/Dockerfile`** (official **`docker.io/nixos/nix`** + `nix develop` for CI) + **`.dockerignore`**. Policy is in epic **RSK-9c07** (“Development stack”).

**Not started yet:** **`infra/terraform/`** (IaC skeleton), **`infra/k8s/`**, **GitHub Actions**, **`@playwright/test`** + real **`pnpm e2e`** — tracked under **RSK-7q8c** and **RSK-0o5v**.
