---
# RSK-l7qs
title: Playable 03 — `IRuntime` / session bridge to the emulator (minimal)
status: todo
type: task
priority: normal
created_at: 2026-03-21T23:00:00Z
updated_at: 2026-03-21T23:00:00Z
parent: RSK-9c07
---

## Context

Depends on **Playable 01** (`RSK-l7qp`) — emulator spike in place. **Playable 02** (`RSK-l7qr`, dev `bins/` auto-load) was **scrapped**; this work can proceed from the file-picker + `/play/spike` flow. The platform already has **`MockRuntimeAdapter`** and **`SessionOrchestrator`**; real play requires a **second implementation** of the runtime seam (or an adapter that wraps the emulator) so future **state decode / plugins** can attach without rewriting the web app.

## Goal

- Introduce something like **`EmulatorRuntimeAdapter`** (name TBD) implementing **`IRuntime`** (or a narrowed interface if the spec splits “headless tick” vs “present frame”) behind a **factory** or **session mode** (`mock` | `emulator`).
- **Session flow:** user selects game manifest (or fixed VS profile) → orchestrator resolves plugin → **when in emulator mode**, runtime is the WASM core; **snapshots** may still be mock or **first-pass** memory read if the core exposes it (document gaps).
- **Tests:** at least one **unit** or **integration** test for adapter wiring (mocked core if needed); E2E optional (Harness 06 Playwright can smoke `/play`).

## Acceptance Criteria

- [ ] `packages/psx-runtime` exports both mock and emulator adapters without importing `plugins/*`.
- [ ] `apps/web` can start a **play session** that uses the emulator path end-to-end for **boot** (same as Playable 02, but through shared orchestration types).
- [ ] Gaps documented: what is **not** yet wired (plugin decoders on real RAM, save states, etc.).
- [ ] `pnpm typecheck` / `pnpm test` green.

## Links

- Parent: `RSK-9c07`
- Depends on: `RSK-l7qp` (see scrapped `RSK-l7qr` for deferred `bins/` work)
- `packages/psx-runtime`, `packages/app-shell`
- `project-spec.md` (runtime boundary)
