---
# RSK-wbmb
title: Spike — pcsx-wasm-core memory bus → IRuntime bridge (postMessage peek/poke)
status: completed
type: task
priority: high
created_at: 2026-03-23T00:00:00Z
updated_at: 2026-03-23T00:00:00Z
parent: RSK-uxvs
---

## Context

**RSK-l7qs** shipped a stub `EmulatorRuntimeAdapter` (mock snapshot factory, no real WASM memory read). **RSK-vs12** (snapshot decoder pipeline) requires live memory reads. This spike closes the gap: expose a real `peek(address, length)` / `savestate()` API from the WASM worker so `EmulatorRuntimeAdapter` can produce `RuntimeSnapshot` from actual emulator memory.

**Prerequisite to:** RSK-vs12, RSK-vs13, RSK-vs14, RSK-vs15.

## Goal

Wire `pcsx-wasm-core` (kxkx5150 vendor) memory bus to `IRuntime` / `IMemoryAccessor` so the Riskbreaker decoder pipeline can read live game state.

## Acceptance Criteria

- [x] **`postMessage` API:** WASM worker exposes `{ cmd: 'peek', address, length, reqId }` → `{ cmd: 'peek_result', reqId, data: Uint8Array }` round-trip. `worker_funcs.js` + compiled `pcsx_worker.js` (both copies) patched.
- [x] **`EmulatorRuntimeAdapter`** updated in `packages/psx-runtime`: accepts optional `IMemoryBridge` (2nd constructor arg); when present, `captureSnapshot()` is async and reads 2 MB from WASM offset 0, producing a live `RuntimeSnapshot` (no `mockStateTag`).
- [x] **`IMemoryBridge` interface** exported from `@riskbreaker/psx-runtime`.
- [x] **Host `peek` wired:** `pcsx-wasm-shell` → `emulator-peek.ts` → `peekWorkerMemory()` → `window.__riskbreakerEmulatorHost.peek`. `globalThis.__riskbreakerPcsxWorker` set in `pcsx_ui.js` after worker creation.
- [x] **Tests:** 4 new assertions in `emulator-runtime-adapter.test.ts` covering stub path, custom factory, bridge snapshot shape, and bridge address/length forwarding. 31 tests pass.
- [x] `pnpm typecheck` / `pnpm test:coverage` green.
- [ ] **PS1 virtual → WASM offset mapping** (deferred to RSK-vs12): `peek(0, 2MB)` is best-effort; actual PS1 RAM WASM offset needs verification via `_get_ptr` during a live session.
- [ ] **Live session on emulator page** (deferred to RSK-vs12): React app and emulator are separate pages; `EmulatorRuntimeAdapter` with bridge must be instantiated in the overlay context.

## Done (2026-03-24)

- `packages/pcsx-wasm-core/js/worker_funcs.js` — `case "peek"` in `main_onmessage`
- `packages/pcsx-wasm-core/pcsx_worker.js` + `apps/web/public/pcsx-wasm/pcsx_worker.js` — patch applied to compiled artifacts
- `apps/web/public/pcsx-wasm/js/pcsx_ui.js` — `globalThis.__riskbreakerPcsxWorker = pcsx_worker` after worker creation
- `packages/pcsx-wasm-shell/src/emulator-peek.ts` — NEW: `peekWorkerMemory(address, length): Promise<Uint8Array>`
- `packages/pcsx-wasm-shell/src/emulator-bridge.ts` — `peek?` added to `RiskbreakerEmulatorHost`
- `packages/pcsx-wasm-shell/src/pcsx-wasm-shell-boot.ts` — `peek` wired from `peekWorkerMemory`
- `packages/psx-runtime/src/contracts.ts` — `IMemoryBridge` interface
- `packages/psx-runtime/src/emulator-runtime-adapter.ts` — `IMemoryBridge` optional param; async `captureSnapshot`
- `packages/psx-runtime/src/index.ts` — `IMemoryBridge` exported
- `packages/psx-runtime/src/emulator-runtime-adapter.test.ts` — 4 new tests
- `apps/web/public/pcsx-wasm/js/riskbreaker-pcsx-wasm-boot.js` — rebuilt from shell

## Approach notes

- Target `packages/pcsx-kxkx-core` worker source for the `postMessage` additions.
- If full `peek` via postMessage is complex, a `savestate()` blob + in-process parse is an acceptable first pass.
- Keep `playstation-src/` free of `plugins/*` imports — bridge goes through `window.__riskbreakerEmulatorHost` or the existing `emulator-bridge.ts` hook.

## Links

- Parent epic: **RSK-uxvs** (Vagrant Story UI remaster + emulator bridge)
- Depends on: **RSK-l7qs** (stub adapter — done), **RSK-7lri** (bridge/host interface — done)
- Unblocks: **RSK-vs12** (snapshot decoder pipeline), **RSK-vs13** (input bridge), all VS UI surfaces
- `packages/pcsx-kxkx-core` — WASM worker source
- `packages/psx-runtime` — `EmulatorRuntimeAdapter`, `IRuntime`, `IMemoryAccessor`
- [`docs/emulator-runtime-gaps.md`](../../docs/emulator-runtime-gaps.md)
- [`docs/playstation-engine-hacking.md`](../../docs/playstation-engine-hacking.md)
