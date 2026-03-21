# Riskbreaker

**Riskbreaker** is the working name for this **PSX UX remaster platform** (see [`project-spec.md`](./project-spec.md) and [`.groove/memory/specs/psx-ux-remaster-harness.md`](./.groove/memory/specs/psx-ux-remaster-harness.md)). This repo is a **pnpm monorepo**: TypeScript packages, React/Vite web app, and game plugins — starting with **Vagrant Story**.

## Stack (intended from day one)

| Layer      | Role                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------ |
| **pnpm**   | Workspace installs and scripts (`packageManager` pinned in root `package.json`).                             |
| **Nix**    | Reproducible dev shell: **Node 25**, **pnpm 10** (corepack), git, docker-compose, kubectl, terraform (`flake.nix` + `flake.lock`). |
| **Docker** | CI image from official **`docker.io/nixos/nix`** + `nix develop` → pnpm build/test (`infra/docker/Dockerfile`). |

## Prerequisites

- **Recommended:** [Nix](https://nixos.org/) with flakes (`nix develop`) for the toolchain above.
- **Otherwise:** Node.js **25+** and **pnpm 10** (`corepack enable` or [pnpm.io](https://pnpm.io)) — align with `packageManager` in root `package.json`.
- **Docker:** optional for local builds; required to build `infra/docker/Dockerfile`.

## Setup

**Nix (recommended):**

```bash
nix develop
pnpm install
```

**Without Nix:** install Node **25+** and **pnpm 10**, then `pnpm install`.

**Docker build** (from repo root; requires Docker daemon):

```bash
docker build -f infra/docker/Dockerfile -t riskbreaker:local .
```

See [`infra/docker/README.md`](./infra/docker/README.md). On macOS, use Docker Desktop or Colima for the daemon; the Nix shell provides the `docker-compose` CLI, not the Docker engine.

**direnv:** optional `.envrc` runs `use flake` — run `direnv allow` once if you use [direnv](https://direnv.net/).

Root `tsconfig.json` maps `@riskbreaker/*` workspace packages to **source** `index.ts` files so `pnpm typecheck` works before `dist/` exists.

## Scripts (root)

| Script              | Description                                                 |
| ------------------- | ----------------------------------------------------------- |
| `pnpm dev`          | Runs `apps/web` dev server (stub until Harness 05)          |
| `pnpm build`        | Builds all workspace packages that define `build`           |
| `pnpm lint`         | ESLint (flat config, `eslint.config.mjs`)                   |
| `pnpm format`       | Prettier write (config from `packages/shared-config`)       |
| `pnpm format:check` | Prettier check                                              |
| `pnpm typecheck`    | `tsc --noEmit` (workspace paths map to package sources)     |
| `pnpm test`         | Vitest (`vitest.config.mts`, `packages/*/src/**/*.test.ts`) |
| `pnpm test:watch`   | Vitest watch mode                                           |
| `pnpm e2e`          | Placeholder until Playwright (Harness 06)                   |

## Layout (target)

Aligned with `project-spec.md`:

```text
apps/
  web/          # browser shell (Vite + React)
  docs/         # architecture / generated docs
packages/
  shared-config  # ESLint / Prettier presets (Harness 01)
  shared-types   # domain types (Harness 02)
  shared-utils   # generic helpers (Harness 02)
  plugin-sdk     # plugin contracts + registration (Harness 02)
  …              # engines, app-shell, etc. (later harness tasks)
plugins/
  vagrant-story/
infra/          # nix, docker, k8s, terraform (Harness 07)
```

## Harness order

Work follows beans under epic **RSK-9c07** (see Groove task list). **Harness 01** added workspace + tooling; **Harness 02** added `shared-types`, `shared-utils`, `plugin-sdk`, and Vitest.

## Assets

Local ROM/BIOS files for future integration live under `bins/` (ignored by git). Not used by the mock scaffold.
