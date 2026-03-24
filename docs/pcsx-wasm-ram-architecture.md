# pcsx-wasm RAM Architecture

## Overview

This document explains how PS1 RAM (psxM) works inside the pcsx-wasm WebAssembly build and how `psxM_base` is obtained so that peek/poke operations address the correct live game memory.

## WASM linear memory layout

The pcsx-wasm worker runs inside a WebAssembly module compiled by Emscripten with `TOTAL_MEMORY=419430400` (400 MB). WASM linear memory is a flat `Uint8Array` exposed as `HEAPU8` in JavaScript.

| Region | Approximate range | Contents |
|--------|------------------|----------|
| Static data | `0x00000000` – ~`0x00200000` | Emscripten runtime: string literals, stack, global variables compiled to static storage |
| WASM heap (mmap/malloc) | ~`0x00200000` onward | Dynamically allocated C structures, including psxM, psxVub, and the Emscripten FS buffers holding the mounted ISO |

## psxM is dynamically allocated

`psxM` (PS1 main RAM) is **not** a C global array. In the PCSX source it is allocated at startup via `mmap()`:

```c
psxM = mmap(NULL, 0x220000, PROT_READ | PROT_WRITE, MAP_ANONYMOUS | MAP_PRIVATE, -1, 0);
```

In WASM, `mmap()` is emulated by Emscripten as a heap allocation. The result is a pointer into `HEAPU8` at some runtime-determined offset — typically above `0x00200000` (2 MB).

**psxM size**: `0x220000` = 2,228,224 bytes (2 MB RAM + 128 KB hardware register mirror space).

## Why string-scanning was wrong (abandoned approach)

An earlier approach tried to locate psxM by scanning `HEAPU8` for the game-ID string `SLUS_010.40\0` (expected at a known offset within psxM for Vagrant Story NTSC-U). This failed because:

1. Emscripten's virtual filesystem stores the entire mounted ISO in the WASM heap. The ISO contains the game executable named `SLUS_010.40`, so that string appears in the FS buffer — **not** in psxM.
2. The scan found the FS copy first and computed a completely wrong `psxM_base`, pointing into ISO data rather than live PS1 RAM.
3. Consequence: `peek(0, 2MB)` returned ISO content. Known-good anchors like `bu10:BASLUS-01040VAG` (save buffer) appeared at plausible offsets by coincidence because the FS layout partially mirrors PS1 address space offsets. But live values (HP, MP) were never present — HP=250→237 after taking damage was undetectable in any encoding.

## The correct fix: export psxM from C

`draw_null.c` already exports a `get_ptr(int i)` function used by the worker JS. We added index `-3` to return `psxM` directly:

```c
// draw_null.c
#include "../../libpcsxcore/psxmem.h"

void * get_ptr(int i){
    if(i==-1) return psxVub;          // PS1 VRAM (1 MB)
    if(i==-2) return get_PadState_ptr(); // pad state
    if(i==-3) return psxM;            // PS1 main RAM (2 MB)
    return params_ptrs[i];
}
```

After `pcsx_init()` runs in `worker_funcs.js`, the base is obtained with one call:

```javascript
psxM_base = _get_ptr(-3);
```

No scanning, no game-specific sentinels, works for any game.

## peek / poke addressing

All subsequent `peek` and `poke` commands offset by `psxM_base`:

```javascript
// peek
var absLo = psxM_base + ps1_address;
HEAPU8.slice(absLo, absLo + length);

// poke
HEAPU8.set(bytes, psxM_base + ps1_address);
```

PS1 virtual `0x8XXXXXXX` → physical = `addr & 0x1FFFFF` → WASM = `psxM_base + (addr & 0x1FFFFF)`.

## PCSX-Redux address comparison

PCSX-Redux (desktop build) serves PS1 RAM via `GET /api/v1/cpu/ram/raw`. Addresses are PS1 physical offsets into psxM starting at 0. The same addresses work directly with pcsx-wasm peek/poke.

**HLE BIOS caveat:** pcsx-wasm uses a built-in HLE BIOS. PCSX-Redux typically uses a real BIOS. The real BIOS initialises the game executable's BSS section; HLE BIOS may not. Confirmed differences at game start:

| Region | riskbreaker (HLE BIOS) | PCSX-Redux (real BIOS) |
|--------|----------------------|----------------------|
| `0x11fa58` stat block | populated (HP/MP/stats visible in overlay) ✓ | populated ✓ |
| `0x2e4b0` save buffer | `bu10:BASLUS-01040VAG` ✓ | not yet initialised |
| `0x37c00` item table | populated ✓ | not yet initialised |

## Dev-mode RAM API

In Vite dev mode, `GET /api/v1/cpu/ram/raw` is served by the `psxRamApiPlugin` (see `apps/web/vite-plugin-psx-ram-api.ts`). The flow is:

1. External caller sends `GET /api/v1/cpu/ram/raw` to the Vite dev server (`localhost:5173`).
2. The plugin broadcasts a `reqId` via Server-Sent Events to `/api/v1/psxram-events`.
3. The browser's `installPsxRamApiClient()` listener (in `psx-ram-api-client.ts`) calls `host.peek(0, 2MB)` — which reads from `psxM_base` — and POSTs the binary back to `/api/v1/psxram-upload?reqId=…`.
4. The plugin returns the binary as `application/octet-stream` to the original caller.

This matches the PCSX-Redux API contract, allowing the same tooling to work against both.

## WASM memory constants

| Constant | Value | Notes |
|----------|-------|-------|
| `TOTAL_MEMORY` | `419430400` (400 MB) | Set at Emscripten compile time in Makefile |
| `psxM` size | `0x220000` (2,228,224 B) | 2 MB RAM + 128 KB HW registers |
| `psxVub` size | `0x100000` (1 MB) | PS1 VRAM |
| `_get_ptr(-3)` | runtime | Returns `psxM` WASM heap pointer |
| `_get_ptr(-1)` | runtime | Returns `psxVub` WASM heap pointer |
