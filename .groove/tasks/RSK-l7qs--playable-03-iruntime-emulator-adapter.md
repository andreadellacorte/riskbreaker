---
# RSK-l7qs
title: Playable 03 — `IRuntime` / session bridge to the emulator (minimal)
status: completed
type: task
priority: normal
created_at: 2026-03-21T23:00:00Z
updated_at: 2026-03-23T04:00:00Z
parent: RSK-uxvs
---

## Context

**Id:** **`RSK-l7qs`** is reserved for **this** task (Playable 03). The lrusso/PlayStation migration work is **`RSK-l7qt`** ([`RSK-l7qt--playable-migrate-lrusso-playstation.md`](./RSK-l7qt--playable-migrate-lrusso-playstation.md)) — completed; do not confuse the two.

Depends on **Playable 01** (`RSK-l7qp`) — emulator spike in place. **Playable 02** (`RSK-l7qr`, dev `bins/` auto-load) was **scrapped**; this work can proceed from the file-picker + `/play/spike` flow. The platform already has **`MockRuntimeAdapter`** and **`SessionOrchestrator`**; real play requires a **second implementation** of the runtime seam (or an adapter that wraps the emulator) so future **state decode / plugins** can attach without rewriting the web app.

## Goal

- Introduce something like **`EmulatorRuntimeAdapter`** (name TBD) implementing **`IRuntime`** (or a narrowed interface if the spec splits “headless tick” vs “present frame”) behind a **factory** or **session mode** (`mock` | `emulator`).
- **Session flow:** user selects game manifest (or fixed VS profile) → orchestrator resolves plugin → **when in emulator mode**, runtime is the WASM core; **snapshots** may still be mock or **first-pass** memory read if the core exposes it (document gaps).
- **Tests:** at least one **unit** or **integration** test for adapter wiring (mocked core if needed); E2E optional (Harness 06 Playwright can smoke `/play`).

## Acceptance Criteria

- [x] `packages/psx-runtime` exports both mock and emulator adapters without importing `plugins/*`.
- [x] `apps/web` can start a **play session** that uses the emulator path end-to-end for **boot** (second button on `/` — `EmulatorRuntimeAdapter` + fixture snapshot factory).
- [x] Gaps documented: [`docs/emulator-runtime-gaps.md`](../../docs/emulator-runtime-gaps.md)
- [x] `pnpm typecheck` / `pnpm test` green.

## Done (2026-03-23)

- **`EmulatorRuntimeAdapter`**, **`defaultEmulatorStubSnapshot`**, **`SessionRuntimeFactory`** in `@riskbreaker/psx-runtime`.
- **`SessionOrchestrator`** third argument: optional runtime factory; **`ActiveSession.runtime`** typed as **`IRuntime`**.
- **`apps/web`**: “Load emulator session (stub)” on **`MockShellPage`**; re-exports **`EmulatorRuntimeAdapter`** from **`@riskbreaker/app-shell`** for convenience.

## Links

- Parent epic: **`RSK-uxvs`** (Vagrant Story UI remaster + emulator bridge)
- Depends on: `RSK-l7qp` (see scrapped `RSK-l7qr` for deferred `bins/` work)
- `packages/psx-runtime`, `packages/app-shell`
- `project-spec.md` (runtime boundary)
