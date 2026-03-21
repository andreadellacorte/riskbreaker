# Riskbreaker

**Riskbreaker** is the working name for this **PSX UX remaster platform** (see [`project-spec.md`](./project-spec.md) and [`.groove/memory/specs/psx-ux-remaster-harness.md`](./.groove/memory/specs/psx-ux-remaster-harness.md)). This repo is a **pnpm monorepo**: TypeScript packages, React/Vite web app, and game plugins — starting with **Vagrant Story**.

## Stack (intended from day one)

| Layer      | Role                                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **pnpm**   | Workspace installs and scripts (`packageManager` pinned in root `package.json`).                                                   |
| **Nix**    | Reproducible dev shell: **Node 25**, **pnpm 10** (corepack), git, docker-compose, kubectl, terraform (`flake.nix` + `flake.lock`). |
| **Docker** | CI image from official **`docker.io/nixos/nix`** + `nix develop` → pnpm build/test (`infra/docker/Dockerfile`).                    |

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

**Web app (Harness 05):** after `pnpm install`, run `pnpm dev` and open http://localhost:5173 . Click **Load mock session (Vagrant Story)** to run the mock pipeline (`SessionOrchestrator` + fixtures) in the browser: manifest, inventory view model, and a sample **EquipItem** command plan.

Root `tsconfig.json` maps `@riskbreaker/*` workspace packages to **source** `index.ts` files so `pnpm typecheck` works before `dist/` exists. Vite uses [`vite.workspace.mjs`](./vite.workspace.mjs) to resolve the same paths during `pnpm dev` / `pnpm build` without pre-building every package.

## Scripts (root)

| Script              | Description                                                                      |
| ------------------- | -------------------------------------------------------------------------------- |
| `pnpm dev`          | Vite dev server for **`apps/web`** (mock session UI) — http://localhost:5173     |
| `pnpm dev:docs`     | Vite for **`apps/docs`** placeholder — http://localhost:5174                     |
| `pnpm build`        | Builds all workspace packages that define `build`                                |
| `pnpm lint`         | ESLint (flat config, `eslint.config.mjs`)                                        |
| `pnpm format`       | Prettier write (config from `packages/shared-config`)                            |
| `pnpm format:check` | Prettier check                                                                   |
| `pnpm typecheck`    | Root `tsc` + `apps/web` TypeScript                                               |
| `pnpm test`         | Vitest — `packages/*/src/**/*.test.ts`, `plugins/*`, `tests/`                    |
| `pnpm test:watch`   | Vitest watch mode                                                                |
| `pnpm e2e`          | Playwright (`playwright.config.ts`, `e2e/`) — install browsers first (see below) |

### Playwright (local)

From `nix develop` or Node 25 + pnpm:

```bash
pnpm exec playwright install chromium   # Linux: add --with-deps if the browser fails to start
pnpm e2e
```

### CI (GitHub Actions)

[`.github/workflows/ci.yml`](./.github/workflows/ci.yml) runs on **push** and **pull_request** to `main`:

1. **Nix** — `nix develop` → `pnpm install` → `playwright install --with-deps chromium` → lint, typecheck, Vitest, build, Playwright.
2. **Docker** — `docker build` with [`infra/docker/Dockerfile`](./infra/docker/Dockerfile), then Vitest and Playwright **inside** the same Nix-based image (validates the CI container path).

## Layout (target)

Aligned with `project-spec.md`:

```text
apps/
  web/          # browser shell (Vite + React)
  docs/         # architecture / generated docs
packages/
  shared-config    # ESLint / Prettier presets (Harness 01)
  shared-types     # domain types (Harness 02)
  shared-utils     # generic helpers (Harness 02)
  plugin-sdk       # plugin contracts + registration (Harness 02)
  psx-runtime      # IRuntime + MockRuntimeAdapter (Harness 04)
  state-engine     # StateStore + plugin decoders (Harness 04)
  domain-engine    # ViewModelBuilder + IDomainPack (Harness 04)
  command-engine   # CommandBus + ICommandPack (Harness 04)
  asset-pipeline   # GameManifestBuilder + mocks (Harness 04)
  ux-platform      # screen registry / input placeholders (Harness 04)
  save-service     # SaveSlotBrowser + codec seam (Harness 04)
  devtools         # timeline + structured log hook (Harness 04)
  app-shell        # SessionOrchestrator + plugin resolution (Harness 04)
plugins/
  vagrant-story/   # mock plugin (Harness 03)
tests/
  pipeline.integration.test.ts  # plugin + app-shell slice (no game code in packages/*)
infra/          # nix, docker, k8s, terraform (Harness 07)
```

## Harness order

Work follows beans under epic **RSK-9c07** (see Groove task list). **Harness 01** workspace + tooling; **Harness 02** shared packages + Vitest; **Harness 03** mock `vagrant-story` plugin; **Harness 04** engine packages + `app-shell` + integration test under `tests/`; **Harness 05** Vite **`apps/web`** + docs placeholder **`apps/docs`**.

## Assets

Local ROM/BIOS files for future integration live under `bins/` (ignored by git). Not used by the mock scaffold.
