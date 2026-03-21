# Project Spec — PSX UX Remaster Harness

## Goal

Build the high-level harness for a reusable PS1 game runtime and UX remaster platform, targeting **Vagrant Story first**, while keeping the architecture reusable for other PS1 games later.

This first phase is **not** about building a full emulator or a full game mod.
It is about creating the **scaffold, package boundaries, interfaces, local developer environment, test harness, CI-ready structure, and deployment/dev tooling** so work can begin cleanly.

We want a monorepo using:

- **pnpm** for workspace/package management
- **TypeScript** as the default app/platform language
- **Nix** for reproducible developer environments
- **Docker** for container builds
- **Kubernetes** for deployable services/tooling where relevant
- **Terraform** for infrastructure scaffolding
- **Vitest** for unit/integration tests
- **Playwright** for e2e tests

Assume desktop/browser-first architecture with the possibility of Electron or Tauri later, but do not commit prematurely to either.
The first deliverable is a clean, runnable, testable monorepo skeleton with representative interfaces, mock implementations, and a basic UI shell.

---

## Product Direction

We are building a platform with these architectural layers:

1. **App Shell**
2. **Asset Pipeline**
3. **PSX Runtime Abstraction**
4. **State Engine**
5. **Domain Engine**
6. **Command Engine**
7. **UX Platform**
8. **Save Service**
9. **Devtools / Observability**
10. **Plugin SDK**
11. **Game Plugins**, starting with `vagrant-story`

We want the codebase structured so that:

- **core** code is reusable and game-agnostic
- **glue** code adapts between systems
- **game-specific** code lives in plugins

---

## Deliverable for this phase

Create a working monorepo that includes:

- root workspace config
- package boundaries
- shared tsconfig and lint/format setup
- Nix flake for dev shell
- Dockerfiles for local and CI use
- basic Kubernetes manifests or Helm-style structure for deployable services if any
- Terraform skeleton for future infra
- a minimal web app shell
- a plugin SDK
- a mock Vagrant Story plugin
- a mock runtime adapter
- a mock state decoder
- a mock domain/view-model flow
- Vitest setup with sample tests
- Playwright setup with one smoke test
- CI-friendly scripts
- README and architecture docs

Do **not** overbuild emulator internals yet.
Use mocks and contracts first.

---

## Monorepo structure

Create a pnpm workspace with this approximate structure:

/apps
/web
/docs

/packages
/app-shell
/asset-pipeline
/psx-runtime
/state-engine
/domain-engine
/command-engine
/ux-platform
/save-service
/devtools
/plugin-sdk
/shared-config
/shared-types
/shared-utils

/plugins
/vagrant-story

/infra
/docker
/k8s
/terraform
/nix

/.github
/workflows

Also include:

- `pnpm-workspace.yaml`
- root `package.json`
- root `tsconfig.base.json`
- root `vitest.workspace.ts` or equivalent
- root Playwright config
- root README
- architecture docs in `/docs` or `/apps/docs`

---

## Package responsibilities

### apps/web

Purpose:

- browser-hosted shell for launching sessions, loading plugins, and rendering mock UX

Initial features:

- home page
- load mock game manifest
- choose plugin
- render mock inventory screen from mock decoded state
- trigger sample command and show resulting command plan

Use:

- React
- TypeScript
- a simple component structure
- shadcn-compatible approach, but do not spend time fully styling yet

### apps/docs

Purpose:

- architecture notes and generated docs placeholder

Could be:

- simple static app or markdown-only docs setup

---

### packages/plugin-sdk

Purpose:

- central contracts/interfaces for plugins

Define interfaces such as:

- `IGamePlugin`
- `IStateDecoder`
- `IDomainPack`
- `ICommandPack`
- `IUIScreenPack`
- `ISaveCodec`
- `IPatchPack`

Also define plugin registration/discovery mechanisms.

This package is critical and should be clean.

---

### packages/shared-types

Purpose:

- core shared domain and infrastructure types

Include:

- `GameManifest`
- `RuntimeSnapshot`
- `GameSnapshot`
- `ViewModel`
- `CommandIntent`
- `CommandPlan`
- `PluginMetadata`
- `Region`
- `TitleId`
- `SessionState`

---

### packages/shared-utils

Purpose:

- small reusable helpers
- no game-specific logic

---

### packages/app-shell

Purpose:

- session orchestration
- plugin loading
- top-level application flows

Include:

- `SessionOrchestrator`
- `PluginRegistry`
- `ManifestResolver`
- mock startup flow

---

### packages/asset-pipeline

Purpose:

- ingest disc/game input and produce a canonical manifest

For now:

- create mock parsers and validators
- support loading a fake local JSON fixture standing in for ISO metadata
- define extension points for real BIN/CUE/ISO parsing later

Expose:

- `IAssetImporter`
- `IGameDetector`
- `GameManifestBuilder`

---

### packages/psx-runtime

Purpose:

- runtime abstraction layer

Do not implement a real emulator yet.
Create:

- `IRuntime`
- `IMemoryAccessor`
- `IInputInjector`
- `ISavestateStore`
- `MockRuntimeAdapter`

Mock runtime should support:

- loading a manifest
- returning mock memory snapshots
- accepting mock commands
- exposing lifecycle states

---

### packages/state-engine

Purpose:

- transform raw runtime state into normalized snapshot data

Include:

- struct decoding framework
- polling or snapshot interfaces
- decoder registry
- `StateStore`
- diff utility

Do not hardcode Vagrant Story here.
Use plugin-provided decoders.

---

### packages/domain-engine

Purpose:

- map normalized state into domain meaning and view models

Include:

- `RulesEngine`
- `SnapshotMapper`
- `ViewModelBuilder`
- generic recommendation mechanism

Should be usable with any plugin pack.

---

### packages/command-engine

Purpose:

- translate user intent into runtime action plans

Include:

- `CommandBus`
- `PolicyEngine`
- `MacroEngine`
- `CommandTranslator`

Support output modes such as:

- input sequence
- direct write plan
- hook invocation plan

For now, just mock them.

---

### packages/ux-platform

Purpose:

- reusable UI-facing abstractions and view-model contracts

Include:

- screen registration types
- route/screen model
- input mapping model
- accessibility/remapping placeholders

---

### packages/save-service

Purpose:

- generic save browsing/parsing framework

Do not implement full save parsing yet.
Create:

- `ISaveCodec`
- slot metadata types
- backup/rollback interfaces
- mock implementations

---

### packages/devtools

Purpose:

- internal debugging and observability helpers

Include:

- structured logging
- event timeline model
- debug panel data contracts
- trace recorders

---

### plugins/vagrant-story

Purpose:

- first concrete plugin, but still mostly mocked

Structure:
/plugins/vagrant-story
/src
/core
/decode
/domain
/commands
/ui
/save
/patches
/fixtures
index.ts

Implement:

- plugin metadata
- `canHandle(manifest)`
- mock decoder for a fake Vagrant Story memory snapshot fixture
- mock domain rules for inventory/equipment comparison
- mock command pack for `EquipItem`
- mock UI screen registration for an inventory screen
- mock save codec placeholder

Fixtures should include:

- sample manifest JSON
- sample runtime snapshot JSON
- sample decoded inventory state
- sample expected command plans

The plugin should be the example others can copy.

---

## Architectural rules

### Layering

All packages should respect:

- **core**: reusable logic
- **glue**: adapters/integration
- **game-specific**: only inside plugins

Do not let game-specific code leak into generic packages.

### Dependency direction

Allowed direction:

- apps -> packages -> plugin-sdk/shared packages
- plugins -> plugin-sdk/shared packages + generic packages
- generic packages must not depend on plugins

### UI boundary

UI must consume:

- domain view models
- command intents
  Never raw runtime memory.

### Runtime boundary

Runtime package must expose contracts and mock adapters.
Do not couple it to any specific emulator project yet.

### Testability

Every package should be independently testable.

---

## Tech choices

### Language

Use TypeScript across all app and package layers for now.

### Package build

Use:

- `tsup` or `tsx`/`tsc` for package builds
- keep it simple
- avoid premature complexity

### Web app

Use:

- React
- Vite
- TypeScript

### Styling

Keep minimal.
Set up component structure so shadcn can be layered in later.
Do not spend time on visual polish.

### Lint/format

Use:

- ESLint
- Prettier

### Optional extras

You may add:

- Zod for schemas/validation
- Zustand or similar for lightweight state where appropriate

Do not add heavy state machinery unless clearly justified.

---

## Nix requirements

Create a `flake.nix` that provides a reproducible dev shell with at least:

- node
- pnpm
- git
- docker client
- kubectl
- terraform
- playwright dependencies where feasible

The dev shell should let a developer clone the repo and run:

- `pnpm install`
- `pnpm dev`
- `pnpm test`
- `pnpm e2e`

Document any caveats.

---

## Docker requirements

Create Docker support for:

- web app container
- docs container if relevant
- a generic CI/test image if useful

At minimum provide:

- production-oriented Dockerfile for `apps/web`
- dev-oriented Dockerfile or compose setup for local work
- `.dockerignore`

Prefer multi-stage builds.

---

## Kubernetes requirements

Create Kubernetes scaffolding for future deployment of:

- web app
- docs app if applicable

Keep it simple:

- namespace
- deployment
- service
- ingress placeholder
- configmap if useful

Do not assume a cloud provider yet.
Use generic manifests or a simple Helm-like directory shape.

Suggested:
/infra/k8s/base
namespace.yaml
web-deployment.yaml
web-service.yaml
ingress.yaml

---

## Terraform requirements

Create Terraform scaffolding under `/infra/terraform` for future infrastructure work.

Do not overbuild real cloud infra yet.
Set up:

- module structure
- environments directory
- README
- placeholder providers/variables/outputs

Suggested:
/infra/terraform
/modules
/web_app
/network
/envs
/dev
/prod

This is mostly structural for now.

---

## Testing requirements

### Vitest

Set up workspace-wide Vitest.

Include example tests for:

- plugin registration
- manifest detection
- mock runtime lifecycle
- state decoding
- domain mapping
- command planning

Use fixtures heavily.

### Playwright

Set up Playwright for `apps/web`.

Create at least one smoke test:

- launch app
- load mock Vagrant Story manifest
- render inventory screen
- verify sample item appears
- trigger sample action
- verify command plan is displayed

### Test scripts

Root scripts should include at least:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:watch`
- `pnpm e2e`
- `pnpm dev`
- `pnpm build`

---

## CI expectations

Create a GitHub Actions workflow that runs on PRs and main branch with:

- install
- lint
- typecheck
- unit tests
- build
- e2e smoke test if feasible

Keep it practical.
Do not do anything heroic.

---

## Documentation requirements

Create:

- root README with setup, scripts, architecture summary
- package READMEs or at least generated placeholders
- architecture doc explaining:
  - package boundaries
  - plugin model
  - data flow
  - dependency rules

Include at least one Mermaid diagram in docs summarizing the system.

---

## Example contracts to implement

Implement representative interfaces and mock implementations for these concepts:

### GameManifest

Fields such as:

- `title`
- `titleId`
- `region`
- `version`
- `discFormat`
- `pluginHints`
- `executableHash`

### RuntimeSnapshot

Fields such as:

- `timestamp`
- `memorySegments`
- `registers`
- `activeScene`
- `mockStateTag`

### GameSnapshot

Fields such as:

- `runtimeState`
- `uiState`
- `inventoryState`
- `characterState`
- `worldState`
- `combatState`

### CommandIntent

Examples:

- `OpenInventory`
- `EquipItem`
- `SortInventory`
- `ShowComparePanel`

### CommandPlan

Should support variants like:

- `input-sequence`
- `direct-write`
- `hook-call`
- `composite`

---

## Example development flow to support

The initial scaffold should let a developer do this:

1. start the web app
2. load a mock manifest for Vagrant Story
3. plugin registry resolves the Vagrant Story plugin
4. mock runtime starts
5. state engine reads a mock snapshot
6. plugin decoder produces normalized game snapshot
7. domain engine produces view model
8. UI renders inventory screen
9. user clicks "Equip"
10. command engine returns a mock command plan
11. UI shows the resulting plan

This end-to-end mocked flow is the first success criterion.

---

## Non-goals for this phase

Do **not** do these yet:

- real PS1 emulation internals
- real ISO binary parsing beyond placeholders
- real patch injection
- real memory editing
- full save codec
- deep visual design
- multiplayer/cloud syncing
- production infrastructure complexity

This phase is about the harness and the seams.

---

## Coding guidance

- Prefer small, explicit interfaces
- Keep package APIs clean
- Avoid giant god objects
- Use fixtures and example data to prove architecture
- Keep the first pass readable over clever
- Add TODOs where real emulator integration would later land
- Make the code pleasant to extend

---

## Output expected from Cursor

Produce:

1. the monorepo file/folder structure
2. all workspace/package config files
3. minimal implementations for each package
4. one working mock plugin for Vagrant Story
5. one working mock UI flow in the web app
6. unit tests and one e2e smoke test
7. Nix/Docker/K8s/Terraform scaffolding
8. initial docs

Where choices are ambiguous, choose the simplest option that preserves the architecture.

The result should be something a senior engineer can clone, run, inspect, and confidently start building on.
