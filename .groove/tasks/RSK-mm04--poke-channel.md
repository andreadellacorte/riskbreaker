---
# RSK-mm04
title: VS RAM — poke channel (main thread → WASM worker write)
status: todo
type: task
priority: normal
created_at: 2026-03-24T00:00:00Z
updated_at: 2026-03-24T00:00:00Z
parent: RSK-mm01
---

## Context

Child of **RSK-mm01**. Symmetric counterpart to the RSK-wbmb peek channel. Adds `{ cmd: "poke", address, bytes }` to the WASM worker so the main thread can write bytes into `HEAPU8` (PS1 main RAM region).

## Design

Worker side (`packages/pcsx-wasm-core/js/worker_funcs.js` + compiled artifact):
```js
case "poke":
  var pokeLo = data.address >>> 0;
  var pokeBytes = data.bytes; // Uint8Array
  if (pokeLo + pokeBytes.length <= HEAPU8.length) {
    HEAPU8.set(pokeBytes, pokeLo);
    postMessage({ cmd: "poke_ack", reqId: data.reqId });
  } else {
    postMessage({ cmd: "poke_error", reqId: data.reqId, msg: "address out of range" });
  }
  break;
```

Main thread (`packages/pcsx-wasm-shell/src/emulator-poke.ts`):
```ts
export function pokeWorkerMemory(address: number, bytes: Uint8Array): Promise<void>
```

`RiskbreakerEmulatorHost` gains optional `poke?: (address: number, bytes: Uint8Array) => Promise<void>`.

**Safety note:** poke bypasses any emulator-side locking. Only call between frames or when the game is at a known stable point (menu open, not mid-animation). Document this constraint clearly.

## Acceptance Criteria

- [ ] `case "poke"` in `packages/pcsx-wasm-core/js/worker_funcs.js` and compiled artifact `pcsx_worker.js`
- [ ] `packages/pcsx-wasm-shell/src/emulator-poke.ts` with `pokeWorkerMemory`
- [ ] `poke?` added to `RiskbreakerEmulatorHost` interface
- [ ] Wired in `pcsx-wasm-shell-boot.ts`
- [ ] Unit test: `pokeWorkerMemory` sends correct postMessage (mock worker)
- [ ] `pnpm typecheck` + `pnpm test` green

## Links

- Parent: **RSK-mm01**
- Mirrors: **RSK-wbmb** (peek channel)
- Precedes: **RSK-mm05** (MemoryAccessor uses both peek + poke)
