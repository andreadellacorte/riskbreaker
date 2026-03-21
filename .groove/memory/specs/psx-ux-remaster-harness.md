# Riskbreaker — Phase 1 foundation (PSX UX remaster platform)

**Aliases:** “PSX UX Remaster Harness” (historical title in `project-spec.md`), **Groove epic RSK-9c07** (“incremental scaffold” tasks).

**Source:** Integrated from [`project-spec.md`](../../../project-spec.md) (authoritative product text).

---

## Overview

**What:** Build **Riskbreaker** — a reusable **PS1 game runtime and UX remaster platform** in a pnpm monorepo, **Vagrant Story** first. Phase 1 delivers the **shared platform** in `packages/*`, a **mock game plugin** in `plugins/vagrant-story`, a runnable **mocked vertical slice** (browser + engines + fixtures), **tests** (Vitest + Playwright), and **CI/dev/infra scaffolding** — not a full emulator, real disc parsing, or production cloud.

**Why:** Lock **core vs glue vs plugin** boundaries so future emulation and real data plug in without rewiring.

**Success criterion:** Clone → install → `pnpm dev` / `pnpm test` / `pnpm e2e` (once wired) → mocked flow: manifest → plugin → mock runtime → decode → domain VM → inventory UI → command plan. **TDD** applies as soon as Vitest exists (see below).

---

## Terminology (avoid confusion)

| Term | Meaning |
|------|---------|
| **Riskbreaker** | The repo / platform (clearer than “generic harness”). |
| **Phase 1 foundation** | This outcome: mocks + contracts + tooling. |
| **Scaffold** (team meaning) | **Shared machinery in `packages/*`** that **`/plugins` plug into** — not “defer plugins until the end.” |
| **Test harness** (`project-spec.md`) | **Vitest + Playwright + fixtures** — part of Phase 1, **not** deferred to a single late task. |
| **Groove Harness 01–08** | **Delivery batches** in beans; **Harness 06** = wire root Vitest/Playwright/scripts — **not** “first time we write tests.” |

---

## Why we were misaligned (and how this doc fixes it)

1. **`project-spec.md` Phase 1** lists **Vitest sample tests** and a **mock Vagrant Story plugin** in the **same** deliverable as packages — tests and plugin work **grow with** the codebase, not only after all packages exist.
2. **Groove tasks** labeled **Harness 06** as “Vitest, Playwright” which read as **all testing happens there** — that collided with **TDD** and with the spec’s “test harness” alongside scaffold.
3. **Implementation order** must respect **plugin-provided decoders**: the **state engine** cannot precede a **concrete plugin** if we want real seams. Order is: **contracts → mock plugin (fixtures) → engines that call plugin types → app-shell → web → E2E.** (An older step list that put the plugin *after* all engines was **wrong** for decoder wiring.)
4. **“Harness”** in the spec title means **platform shell**, not **Groove task name** — easy to mix with “test harness.”

---

## Decisions

| Decision | Choice | Rationale |
|----------|--------|------------|
| Product name | **Riskbreaker** | Distinct; “platform” alone is vague. |
| Workspace / language | **pnpm** + **TypeScript** | Per `project-spec.md`. |
| App shell | **React + Vite** in `apps/web` | Browser-first. |
| UI skills | **shadcn**, **frontend-design** | Use when building UI (per team). |
| Tests | **TDD** (`test-driven-development` skill) + **Vitest** + **Playwright** | Spec + team; unit tests from early packages onward. |
| Vitest wiring | Root `vitest.workspace.ts` (or equivalent) **by end of foundation package setup** | Enables TDD before “Harness 06” label; Harness 06 = **full script matrix + CI + E2E smoke** if not already done. |
| Plugin art | **`ai-image-generation`** in scope for **Vagrant Story** visuals | Rood Inverse, Lea Monde, characters — assets live under plugin (e.g. `plugins/vagrant-story/…`); respect IP / fan-work norms in README. |
| Styling | Minimal first; shadcn-compatible structure | Per spec. |
| Hosting (intent) | **Likely AWS ECS**; simpler stacks possible | Confirm with owner before real Terraform apply (see Edge Cases). |
| Boundaries | No game logic outside `plugins/`; no raw memory in UI; generic packages **do not** depend on plugins | Non-negotiable. |

---

## Implementation order (corrected)

Dependency-safe **conceptual** order (Groove tasks may still chunk work, but **do not** implement state decode **before** a mock plugin + fixtures exist).

1. **Workspace + tooling** — `pnpm-workspace.yaml`, root scripts, `tsconfig.base.json`, ESLint, Prettier, `packages/shared-config` (done: Harness 01).
2. **`shared-types`**, **`shared-utils`**, **`plugin-sdk`** — contracts only.
3. **Wire Vitest at repo root** (minimal) so **TDD** can run on new packages — can land in Harness 02 or early 03.
4. **`plugins/vagrant-story` (mock)** — metadata, `canHandle`, fixtures (manifest, runtime snapshot, decoded state, command plans), mock decoder/domain/command/UI registrations.
5. **`psx-runtime`**, **`asset-pipeline`**, **`state-engine`**, **`domain-engine`**, **`command-engine`**, **`ux-platform`**, **`save-service`**, **`devtools`**, **`app-shell`** — mocks calling **plugin** interfaces; no game hardcoding in generic packages.
6. **`apps/web`** (+ `apps/docs` placeholder) — Vite + React; use **shadcn / frontend-design** skills per team.
7. **Playwright** smoke + expand Vitest coverage; **CI** runs unit + E2E.
8. **Nix, Docker, K8s, Terraform**, **GitHub Actions** — infra scaffolding; **ask owner** before provider-specific Terraform.
9. **Docs** — architecture + Mermaid.

**E2E timing:** Playwright runs the mocked inventory flow **after** the web app can execute the slice (step 6–7). **Unit tests** start earlier (steps 2–5).

---

## Edge Cases

| Area | Behavior |
|------|----------|
| **Terraform / hosting** | Placeholders until owner confirms (ECS vs simpler). |
| **Plugin art** | Generated or licensed assets documented in plugin README; do not assume commercial redistribution rights. |
| **Cursor vs `.agents` skills** | **Canonical:** `.agents/skills`. **Cursor** should symlink each skill into `.cursor/skills` (same basename). |

---

## Verification

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm e2e` succeed when Phase 1 complete.
- [ ] Mock end-to-end flow runs in browser; Playwright smoke passes.
- [ ] No game-specific code in generic `packages/*`.
- [ ] Implementation order respects **plugin before decode pipeline** that consumes plugin decoders.
