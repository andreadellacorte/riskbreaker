# Riskbreaker

**Riskbreaker** is the working name for this **PSX UX remaster platform** (see [`project-spec.md`](./project-spec.md) and [`.groove/memory/specs/psx-ux-remaster-harness.md`](./.groove/memory/specs/psx-ux-remaster-harness.md)). This repo is a **pnpm monorepo**: TypeScript packages, React/Vite web app, and game plugins — starting with **Vagrant Story**.

## Documentation

| Doc                                                                      | Purpose                                                                                                         |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| [**docs/architecture.md**](./docs/architecture.md)                       | **Package boundaries**, **plugin model**, **data flow**, **Mermaid diagrams** — read this for the system shape. |
| [**docs/playable-emulator-spike.md**](./docs/playable-emulator-spike.md) | Browser PS1 spike (`/play/spike` → `/pcsx-wasm/`), PCSX-wasm fork, BIOS / legal notes.                          |
| [**docs/README.md**](./docs/README.md)                                   | Index of spec + memory links.                                                                                   |
| [**project-spec.md**](./project-spec.md)                                 | Full Phase 1 product and technical spec.                                                                        |

## Stack (intended from day one)

| Layer      | Role                                                                                                                                                |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **pnpm**   | Workspace installs and scripts (`packageManager` pinned in root `package.json`).                                                                    |
| **Nix**    | Reproducible dev shell: **Node 24**, **pnpm 10** (corepack), git, **netlify-cli**, terraform (`flake.nix` + `flake.lock`). |
| **Docs**   | [`docs/architecture.md`](./docs/architecture.md) — architecture + diagrams; [`apps/docs`](./apps/docs/) optional Vite placeholder.                  |

## Prerequisites

- **Recommended:** [Nix](https://nixos.org/) with flakes (`nix develop`) for the toolchain above.
- **Otherwise:** Node.js **24.x** and **pnpm 10** (`corepack enable` or [pnpm.io](https://pnpm.io)) — align with `packageManager` in root `package.json`.

## Setup

**Nix (recommended):**

```bash
nix develop
pnpm install
```

**Without Nix:** install Node **24.x** and **pnpm 10**, then `pnpm install`.

**direnv:** optional `.envrc` runs `use flake` — run `direnv allow` once if you use [direnv](https://direnv.net/).

**Web app (Harness 05):** after `pnpm install`, run `pnpm dev` and open http://localhost:5173/mock . Click **Load mock session (Vagrant Story)** to run the mock pipeline (`SessionOrchestrator` + fixtures) in the browser: manifest, inventory view model, and a sample **EquipItem** command plan. The site root **`/`** redirects to the PCSX browser emulator (`/pcsx-wasm/`).

**Playable emulator spike (Playable 01):** open http://localhost:5173/play/spike (redirects to **`/pcsx-wasm/index.html`**) for a **WASM PS1** proof-of-concept (**PCSX-wasm** / kxkx5150). It is **not** wired to Riskbreaker engines yet — see [`docs/playable-emulator-spike.md`](./docs/playable-emulator-spike.md). **Do not commit** BIOS or disc images; keep dumps under local **`bins/`** only if you have the right to use them for testing.

Root `tsconfig.json` maps `@riskbreaker/*` workspace packages to **source** `index.ts` files so `pnpm typecheck` works before `dist/` exists. Vite uses [`vite.workspace.mjs`](./vite.workspace.mjs) to resolve the same paths during `pnpm dev` / `pnpm build` without pre-building every package.

## Scripts (root)

| Script              | Description                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm dev`          | Vite dev server for **`apps/web`** (mock session UI) — http://localhost:5173                                                               |
| `pnpm dev:docs`     | Vite for **`apps/docs`** placeholder — http://localhost:5174                                                                               |
| `pnpm build`        | Builds all workspace packages that define `build`                                                                                          |
| `pnpm lint`         | ESLint (flat config, `eslint.config.mjs`)                                                                                                  |
| `pnpm format`       | Prettier write (config from `packages/shared-config`)                                                                                      |
| `pnpm format:check` | Prettier check                                                                                                                             |
| `pnpm typecheck`    | Root `tsc` + `apps/web` TypeScript                                                                                                         |
| `pnpm test`         | Vitest — `packages/*/src/**/*.test.ts`, `plugins/*`, `tests/`                                                                              |
| `pnpm test:watch`   | Vitest watch mode                                                                                                                          |
| `pnpm e2e`          | Playwright — `e2e/`; auto-starts `apps/web` Vite on 127.0.0.1:5173 (reuses if already running locally); install browsers first (see below) |
| `pnpm e2e:ui`       | Playwright UI mode                                                                                                                         |

### Playwright (local)

From `nix develop` or Node 24 + pnpm:

```bash
pnpm exec playwright install chromium   # Linux: add --with-deps if the browser fails to start
pnpm e2e
```

`pnpm e2e` uses Playwright’s **`webServer`** to run Vite for **`apps/web`** on `http://127.0.0.1:5173`. Locally, if you already run `pnpm dev` on that port, the existing server is reused (not in CI). To target another origin, set **`PLAYWRIGHT_BASE_URL`** and **`PLAYWRIGHT_SKIP_WEBSERVER=1`** so Playwright does not start its own Vite process.

### CI (GitHub Actions)

[`.github/workflows/ci.yml`](./.github/workflows/ci.yml) runs on **push** and **pull_request** to `main`:

1. **Nix** — `nix develop` → `pnpm install` → `playwright install --with-deps chromium` → lint, **build** (workspace `dist/` for package `"types"` entries), typecheck, Vitest, Playwright.
2. **Terraform** — `terraform fmt -check`, `validate`, `plan`, and on **`main` pushes** `apply` for [`infra/terraform/environments/github`](./infra/terraform/environments/github) (uses **`TERRAFORM_GITHUB_TOKEN`**; configure a remote backend for repeatable CI state — see [`infra/terraform/README.md`](./infra/terraform/README.md)).

**Production** static assets are built and hosted by **Netlify**; CI does not use Docker or Kubernetes.

## Infrastructure (Harness 07)

| Area           | Location                                 | Notes                                                                                                       |
| -------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Nix**        | [`flake.nix`](./flake.nix)               | Dev shell: Node 24, pnpm via corepack, git, **netlify-cli** (nixpkgs), terraform. |
| **Terraform**  | [`infra/terraform/`](./infra/terraform/) | **GitHub** repo settings (`integrations/github`); **`modules/`** reserved for cloud stacks. See [`infra/terraform/README.md`](./infra/terraform/README.md). |
| **Netlify**    | [`netlify.toml`](./netlify.toml)         | Static **`apps/web`** — pnpm monorepo build + SPA redirect. Connect the repo in the Netlify UI (see below). |

**Hosting:** **Netlify** (static CDN) is the chosen path for **`apps/web`** ([`netlify.toml`](./netlify.toml)). Terraform in-repo manages **GitHub** settings; cloud IaC is optional until you add providers. See [`.groove/memory/specs/psx-ux-remaster-harness.md`](./.groove/memory/specs/psx-ux-remaster-harness.md). First-site setup was tracked in Groove bean **`RSK-9nf7`** (completed).

### Netlify (static `apps/web`)

This environment cannot log into your Netlify account. You link the site once:

1. In [Netlify](https://app.netlify.com/), **Add new site** → **Import an existing project** → connect **GitHub** and select **`riskbreaker`**.
2. Leave **base directory** empty (build runs from the **repository root**; [`netlify.toml`](./netlify.toml) sets command and publish dir).
3. Deploy: Netlify runs **`pnpm install --frozen-lockfile`** and **`pnpm --filter @riskbreaker/web build`**, publishes **`apps/web/dist`**. **Node 24.x** for builds ([`netlify.toml`](./netlify.toml) and [`flake.nix`](./flake.nix) — same major everywhere). This repo does **not** use **`.nvmrc`**; Node version is pinned in **`flake.nix`** (local) and **`netlify.toml`** (Netlify).

**CLI:** With **`nix develop`**, the **`netlify`** command comes from **nixpkgs** (`netlify-cli` in [`flake.nix`](./flake.nix)) — no separate npm global install. Run `netlify login` / `netlify deploy` locally; do not commit tokens.

## Layout (target)

Aligned with `project-spec.md`:

```text
docs/
  architecture.md   # boundaries, plugin model, Mermaid (Harness 08)
apps/
  web/          # browser shell (Vite + React)
  docs/         # optional Vite doc site — see docs/ for canonical architecture
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
infra/          # terraform (Harness 07); Nix lives at repo root (`flake.nix`)
```

## Harness order

Work follows beans under epic **RSK-9c07** (see Groove task list). **Harness 01** workspace + tooling; **Harness 02** shared packages + Vitest; **Harness 03** mock `vagrant-story` plugin; **Harness 04** engine packages + `app-shell` + integration test under `tests/`; **Harness 05** Vite **`apps/web`** + docs placeholder **`apps/docs`**; **Harness 06–07** tests/CI/infra; **Harness 08** [`docs/architecture.md`](./docs/architecture.md) + doc index.

## Assets

Local ROM/BIOS files for future integration live under **`bins/`** (ignored by git). Not used by the **mock** scaffold.

For the **`/play/spike`** browser emulator test, place **BIOS / disc images you may legally use** only on your machine (e.g. under `bins/`); the app reads discs via **file picker** — nothing is committed to the repo. See [`docs/playable-emulator-spike.md`](./docs/playable-emulator-spike.md).
