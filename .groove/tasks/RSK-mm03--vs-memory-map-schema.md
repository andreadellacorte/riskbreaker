---
# RSK-mm03
title: VS RAM — MemoryMap schema (typed field definitions, NTSC-U)
status: todo
type: task
priority: normal
created_at: 2026-03-24T00:00:00Z
updated_at: 2026-03-24T00:00:00Z
parent: RSK-mm01
---

## Context

Child of **RSK-mm01**. Once RSK-mm02 has identified addresses, encode them as a typed, region-aware schema in `plugins/vagrant-story`. This becomes the single source of truth for all read/write operations — no magic numbers at call sites.

## Design

```ts
// plugins/vagrant-story/src/ram-map.ts

export type FieldType = "u8" | "u16le" | "u32le" | "i16le";
export type WriteMode = "scalar" | "structural" | "readonly";

export interface MemoryField {
  name: string;
  offset: number;       // WASM heap offset
  type: FieldType;
  writeMode: WriteMode; // scalar = safe direct poke; structural = needs care; readonly = never poke
  description?: string;
}

export interface ArrayField {
  name: string;
  baseOffset: number;
  stride: number;
  maxCount: number;
  countOffset?: number; // offset of u8/u16 that holds live count
  fields: MemoryField[];
  writeMode: WriteMode;
}

export interface VsMemoryMap {
  region: "NTSC-U" | "NTSC-J" | "PAL";
  wasmRamBase: number;     // WASM heap offset where PS1 main RAM begins
  character: {
    hp: MemoryField;
    hpMax: MemoryField;
    risk: MemoryField;
    pp: MemoryField;
    ppMax: MemoryField;
  };
  inventory: ArrayField;
  equipment: {
    weapon: MemoryField;
    shield: MemoryField;
    helm: MemoryField;
    armour: MemoryField;
    accessory: MemoryField;
  };
}
```

Region variants live in separate constants (`VS_MEMORY_MAP_NTSC_U`, etc.) — not selected at runtime in production, just the right one imported for the target build.

## Acceptance Criteria

- [ ] `plugins/vagrant-story/src/ram-map.ts` with `VsMemoryMap` type + `VS_MEMORY_MAP_NTSC_U` constant (populated from RSK-mm02 results)
- [ ] All fields tagged with `writeMode` — no field is poke-able without explicit `"scalar"` designation
- [ ] `pnpm typecheck` green
- [ ] Unit test: schema is internally consistent (offsets > wasmRamBase, strides > 0, etc.)

## Links

- Parent: **RSK-mm01**
- Depends on: **RSK-mm02** (addresses)
- Precedes: **RSK-mm04** (poke), **RSK-mm05** (accessor + live decode)
