---
# RSK-mm01
title: 'Epic: VS RAM — memory map discovery + typed read/write layer'
status: in-progress
type: epic
priority: normal
created_at: 2026-03-24T00:00:00Z
updated_at: 2026-03-24T00:00:00Z
parent: RSK-uxvs
---

## Context

**RSK-vs12** proved the peek pipe (2 MB live read, panel renders). The next layer is knowing **what** is in those bytes and being able to **write** them safely.

Input-sequence simulation (navigating VS menus programmatically) is **explicitly out of scope** here — VS menus are clunky enough that simulating button presses to equip an item or use a consumable would be brittle and slow. The preferred path is **direct memory write** for scalar fields (item quantities, HP, equipment slot values) where the game reads them on the next frame rather than caching them in registers.

**Design principle:** distinguish two write modes early —
- **Scalar poke** — safe for fields the game reads fresh each frame (HP, Risk, item qty, equipped slot ID). Write directly, effect is immediate on next frame render.
- **Structural write** — anything involving pointers, linked lists, or state machine transitions (add/remove item slots, unlock abilities) — defer until we understand the struct well enough; may still require simulated input or save-state round-trip for some cases.

## Goal

1. **Discover** key VS (NTSC-U) RAM addresses and struct layouts via the live peek channel + known anchor values.
2. **Define** a typed `MemoryMap` schema in the VS plugin — one source of truth for all field addresses, sizes, and read/write safety.
3. **Add poke** — a symmetric write channel from main thread → WASM worker (`postMessage { cmd: "poke" }`).
4. **Wire** `MemoryAccessor` (typed read/write facade) in the VS plugin, backed by peek/poke.
5. **Decode** real inventory + character state in the overlay panel (replacing the TODO in RSK-vs12).

## Children

| Order | Bean | Summary |
|------:|------|---------|
| 1 | [**RSK-mm02**](./RSK-mm02--vs-ram-discovery-session.md) | Discovery session — scan 2 MB dump with anchor values; map item table, HP, Risk, PP, equipment slots |
| 2 | [**RSK-mm03**](./RSK-mm03--vs-memory-map-schema.md) | `MemoryMap` schema — typed field definitions in `plugins/vagrant-story`; region-aware (NTSC-U first) |
| 3 | [**RSK-mm04**](./RSK-mm04--poke-channel.md) | Poke channel — `{ cmd: "poke" }` in WASM worker; `pokeWorkerMemory` in `pcsx-wasm-shell` |
| 4 | [**RSK-mm05**](./RSK-mm05--memory-accessor-and-live-decode.md) | `MemoryAccessor` + live overlay decode — real inventory rows in the panel; replaces fixture fallback |

## Links

- Parent: **RSK-uxvs**
- Depends on: **RSK-wbmb** (peek channel — done), **RSK-vs12** (overlay panel — done)
- Precedes: **RSK-vs13** (input bridge — may be partially superseded by direct poke for scalar ops)
