---
# RSK-mm05
title: VS RAM — MemoryAccessor + live overlay decode (real inventory rows)
status: todo
type: task
priority: normal
created_at: 2026-03-24T00:00:00Z
updated_at: 2026-03-24T00:00:00Z
parent: RSK-mm01
---

## Context

Child of **RSK-mm01**. Brings together RSK-mm02 (addresses), RSK-mm03 (schema), and RSK-mm04 (poke) into a typed `MemoryAccessor` in `plugins/vagrant-story`. Replaces the "offsets TBD" TODO in the RSK-vs12 overlay panel with real decoded inventory rows.

## Design

```ts
// plugins/vagrant-story/src/memory-accessor.ts

export class VsMemoryAccessor {
  constructor(
    private readonly peek: (address: number, length: number) => Promise<Uint8Array>,
    private readonly poke: (address: number, bytes: Uint8Array) => Promise<void>,
    private readonly map: VsMemoryMap,
  ) {}

  async readField(field: MemoryField): Promise<number> { ... }
  async writeField(field: MemoryField, value: number): Promise<void> {
    if (field.writeMode !== "scalar") throw new Error(`field ${field.name} is not scalar-poke-safe`);
    ...
  }
  async readInventory(): Promise<VsItem[]> { ... }
  async readCharacter(): Promise<VsCharacterState> { ... }
}
```

The VS overlay panel (`emulator-overlay-panel.ts`) uses `VsMemoryAccessor.readInventory()` and `readCharacter()` in its refresh callback, replacing the current "bytes read" placeholder rows.

## Acceptance Criteria

- [ ] `plugins/vagrant-story/src/memory-accessor.ts` with typed read/write; `writeField` guards on `writeMode`
- [ ] Overlay panel refresh shows real item names + quantities from live RAM
- [ ] Character summary shows live HP / Risk / PP
- [ ] Unit tests: read path with a synthetic `Uint8Array` matching the schema layout; write path rejects non-scalar fields
- [ ] `pnpm typecheck` + `pnpm test` green

## Links

- Parent: **RSK-mm01**
- Depends on: **RSK-mm02** (addresses), **RSK-mm03** (schema), **RSK-mm04** (poke)
- Completes: the "TODO" in `plugins/vagrant-story/src/emulator-overlay-panel.ts`
