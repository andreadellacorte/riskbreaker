# Emulator runtime (`EmulatorRuntimeAdapter`) — gaps (RSK-l7qs)

`packages/psx-runtime` exposes **`EmulatorRuntimeAdapter`** next to **`MockRuntimeAdapter`**. Both implement **`IRuntime`** and feed **`SessionOrchestrator`** the same way.

## What works today

- **`loadManifest` → `captureSnapshot` → decode → domain → view model** for **Vagrant Story** when using the **stub** snapshot (or a custom `RuntimeSnapshotFactory` passed from `apps/web`).
- **`apps/web`**: “Load emulator session (stub)” uses the emulator adapter path end-to-end for **boot** (same orchestration types as mock).

## What is not wired yet

| Area | Gap |
|------|-----|
| **Live PSX RAM** | No read of lrusso/PlayStation WASM memory into `RuntimeSnapshot.memorySegments[].bytes` — **RSK-vs12**. |
| **`window.__riskbreakerEmulatorHost`** | Bridge is registered from **`packages/pcsx-kxkx-shell`** (built into `public/pcsx-kxkx/js/riskbreaker-kxkx-boot.js`); **psx-runtime** does not call into the emulator (by design — no `plugins/*` ↔ emulator coupling in this package). |
| **Save states** | `savestates` on the adapter are still **mock** stores; no real emulator slot I/O. |
| **Input** | `input` is **mock**; forwarding web UI → pad → core is **RSK-vs13**. |
| **Lifecycle fidelity** | `"running"` is set on first `captureSnapshot`; no sync with actual emulation **pause / reset**. |

## Links

- Bean: **RSK-l7qs** — `.groove/tasks/RSK-l7qs--playable-03-iruntime-emulator-adapter.md`
- Epic: **RSK-uxvs**
- Playable spike: [playable-emulator-spike.md](./playable-emulator-spike.md)
