# Emulator runtime (`EmulatorRuntimeAdapter`) — gaps

`packages/psx-runtime` exposes **`EmulatorRuntimeAdapter`** next to **`MockRuntimeAdapter`**. Both implement **`IRuntime`** and feed **`SessionOrchestrator`** the same way.

## What works today (RSK-wbmb)

- **`loadManifest` → `captureSnapshot` → decode → domain → view model** for **Vagrant Story** when using the **stub** snapshot (or a custom `RuntimeSnapshotFactory` passed from `apps/web`).
- **`apps/web`**: the emulator adapter path can be bootstrapped end-to-end.
- **postMessage peek channel:** `window.__riskbreakerEmulatorHost.peek(address, length)` sends `{ cmd: "peek" }` to the PCSX WASM worker and receives raw bytes from `HEAPU8`. Implemented in:
  - `packages/pcsx-wasm-core/js/worker_funcs.js` — worker-side `case "peek"` handler
  - `packages/pcsx-wasm-shell/src/emulator-peek.ts` — main-thread helper (`peekWorkerMemory`)
  - `apps/web/public/pcsx-wasm/js/pcsx_ui.js` — exposes `globalThis.__riskbreakerPcsxWorker` after worker creation
- **`IMemoryBridge` interface:** `psx-runtime` exports `IMemoryBridge { peek(address, length): Promise<Uint8Array> }`. `EmulatorRuntimeAdapter` accepts an optional bridge as its second constructor argument. When present, `captureSnapshot()` reads 2 MB from WASM offset 0 and returns a real `RuntimeSnapshot` (no `mockStateTag`).

## What RSK-vs12 delivered

- **Generic overlay panel registry** (`packages/pcsx-wasm-shell/src/overlay-panels.ts`): `registerOverlayPanel` / `getOverlayPanels` / `patchOverlayPanel` + `window.__riskbreakerOverlayPanels` for external plugin scripts.
- **VS panel bundle** (`plugins/vagrant-story/src/emulator-overlay-panel.ts` → `apps/web/public/pcsx-wasm/js/riskbreaker-vs-panel.js`): registers "Vagrant Story — Items" with fixture data; ↻ refresh button calls `host.peek(0, 2MB)` and shows bytes read (proving the pipe).
- **Overlay renders plugin panels generically**: no VS-specific code in `packages/pcsx-wasm-shell`.
- **Architecture enforced**: `plugins/*` registers panels via `window.__riskbreakerOverlayPanels`; platform bundle has no game-specific imports.

## What is not wired yet

| Area | Gap | Tracking |
|------|-----|----------|
| **PS1 virtual → WASM heap offset** | `peek(0, 2MB)` returns raw WASM heap bytes. PS1 main RAM starts at an offset that depends on the emulator build. Needs `_get_ptr`-style probe during a live session to find the base. | RSK-vs12+ |
| **VS inventory struct decoding** | Once the PS1→WASM offset is known, VS item table address (NTSC-U) must be identified (e.g. via no-intro pSX memory viewer). Decoder logic lives in `emulator-overlay-panel.ts` as a TODO. | RSK-vs12+ |
| **Save states** | `savestates` on the adapter are still **mock** stores; no real emulator slot I/O. | RSK-vs12+ |
| **Input** | `input` is **mock**; forwarding web UI → pad → core is **RSK-vs13**. | RSK-vs13 |
| **Lifecycle fidelity** | `"running"` is set on first `captureSnapshot`; no sync with actual emulation **pause / reset**. | — |

## Console demo (run in `/pcsx-wasm/index.html` DevTools after loading a game)

```js
// Verify the peek channel works — reads first 16 bytes of WASM heap:
window.__riskbreakerEmulatorHost.peek(0, 16).then(b => console.log([...b]));

// Read likely PS1 main RAM region (first 64 bytes at offset 0):
window.__riskbreakerEmulatorHost.peek(0, 64).then(b => {
  console.log('first 8 words:', Array.from({length: 8}, (_, i) =>
    (b[i*4] | b[i*4+1]<<8 | b[i*4+2]<<16 | b[i*4+3]<<24) >>> 0
  ).map(n => '0x' + n.toString(16).padStart(8,'0')));
});
```

## Links

- Bean: **RSK-wbmb** — `.groove/tasks/RSK-wbmb--spike-pcsx-wasm-memory-bus-to-iruntime-bridge.md`
- Epic: **RSK-uxvs**
- Next: **RSK-vs13** (input bridge) — blocked on PS1→WASM offset mapping for real VS inventory decode
