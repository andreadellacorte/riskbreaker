---
# RSK-mm02
title: VS RAM — discovery session (anchor scan, NTSC-U)
status: todo
type: task
priority: high
created_at: 2026-03-24T00:00:00Z
updated_at: 2026-03-24T00:00:00Z
parent: RSK-mm01
---

## Context

Child of **RSK-mm01**. We have a live `peek(0, 2MB)` channel and known starting-state values for Vagrant Story (NTSC-U). Use them as anchors to locate the in-RAM structs for character state, inventory, and equipment.

## Known anchors (new game, NTSC-U) — confirmed from screenshots

| Field | Value | Hex | Notes |
|-------|-------|-----|-------|
| HP current | 250 | `0xFA` | Ashley starting HP |
| HP max | 250 | `0xFA` | Same at new game |
| MP current | 50 | `0x32` | |
| MP max | 50 | `0x32` | |
| Risk | 0 | `0x00` | Zero at new game start |
| Weapon slot | Fandango | — | Bronze Sword (Edged/One-Handed); sheathed |
| Shield slot | NONE | — | |
| R.ARM | Bandage | — | |
| L.ARM | Bandage | — | |
| HEAD | Bandana | — | |
| BODY | Jerkin | — | |
| LEGS | Sandals | — | |
| ACCESSORY | Rood Necklace | — | |
| MISC slots used | 5 | `0x05` | Out of 64 total |
| Cure Root qty | 10 | `0x0A` | |
| Vera Root qty | 10 | `0x0A` | |
| Yggdrasil's Tears qty | 5 | `0x05` | |
| Faerie Chortle qty | 5 | `0x05` | |
| Spirit Orison qty | 5 | `0x05` | |
| Gems | 0 | — | None at new game |

## Approach

1. Load VS NTSC-U on `/play/spike?riskbreaker=1`. Do **not** pick up any items or take damage.
2. Open DevTools → call `window.__riskbreakerEmulatorHost.peek(0, 2097152)` → save the `Uint8Array` to a variable.
3. Search for anchor byte sequences (e.g. `78 00 78 00` for HP/maxHP as adjacent u16LE, `12 00` for Risk nearby).
4. Cross-reference with community resources:
   - [Vagrant Story no-intro / decompilation threads](https://github.com/morris/vagrantlord) — `vagrantlord` has partial struct offsets
   - PSX memory viewer (any PSX emulator with a debugger, e.g. DuckStation memory scanner)
5. Document each field: **WASM heap offset**, **PS1 virtual address** (offset − WASM RAM base), **size**, **type** (u8/u16/u32/LE).
6. Confirm by writing to the field via `poke` (once RSK-mm04 is done) and observing in-game change.

## Partial findings — updated 2026-03-24 (3 in-game dumps analysed)

| Field | PS1 phys offset | Notes |
|-------|-----------------|-------|
| Item area base | `0x37c00` | One entry confirmed (id=1, ptr=0x086a); qty field unconfirmed |
| Item entry stride | ~`0x80` | 128 bytes/entry, 64 slots max |
| MC marker | `0x37d40` | `"MC"` memory-card region boundary |
| Memory card save header | `0x2e4b0` | `bu10:BASLUS-01040VAG?` confirms NTSC-U |
| Save index table | `0x2e520–0x2e7ff` | Sequential u32 IDs, `0x06` = empty slot |
| Game executable | `0x11000–0x1bffff` | MIPS R3000A code |
| Text string table | `0x1fbb35–0x1fedd6` | VS-encoded spell/item/ability names |
| Character stat block | **NOT FOUND** | 0x37700–0x37900 all zeros in all 3 in-game dumps; HP=250 not found in any encoding outside known lookup tables |

**Item entry layout** (128 bytes, offsets relative to entry base):
```
+0x00  id        u32LE   item type ID
+0x04  unknown   u32LE
+0x08  ptr       u32LE   in-game pointer (e.g. 0x086a)
+0x0C  timestamp u32LE   changes on menu navigation
+0x10  qty?      u32LE   candidate qty — value seen as 0x0f (15), not matching expected 10
+0x30  ???       5 bytes ff 41 5a ff ff — unknown range/encoding marker
... (remaining bytes: gems, affinities, stat bonuses TBD)
```

**VS text encoding** (A=0x24, B=0x25, …, Z=0x3d; 0=0x0a…9=0x13; space=0x00; EOL=0xe7; separator=0xfa 0x06):
confirmed from "NOTHING", "TERRA", "THRUST" in MIPS code and PPF patches.

**PPF analysis (zenith_192.ppf = VS Zenith ~v1.9.x):**
- ~307,890 patch records patching disc offsets 0x52d10+ (game executable text: spell/ability names)
- v1.8.3 confirms: Clear Game resets to **250 HP / 50 MP / 100 STR-INT-AGL**
- v1.9.2 introduces Polaris/Galerian gems — Galerian enables Square-button weapon-type switching at runtime (relevant for future riskbreaker write targets)
- vagrantlord GitHub repo (referenced in task) returns 404

**Stat block hypotheses:**
1. Pointer-indirected — struct is at a virtual address resolved at runtime, not at a fixed PS1 phys offset
2. May require new dump taken **during active combat** (not menus) or immediately after taking 1 damage to isolate offset via diff

**Next dump needed:** open STATUS menu, verify HP shows 250, then fight one enemy and take 1 damage — take dump immediately after. Compare with pre-fight dump to isolate HP field.

## Acceptance Criteria

- [ ] WASM heap offsets identified for: HP current/max, Risk, PP, item table base (address + stride + count), equipment slots (weapon, shield, helm, armour)
- [ ] PS1 virtual address base offset (WASM heap start → PS1 `0x80000000`) confirmed
- [ ] Results written to `docs/vagrant-story-ram-map.md` (new file)
- [ ] At least one field verified by live read showing expected value in the overlay panel

## Links

- Parent: **RSK-mm01**
- Reference: [`docs/vagrant-story-inventory-reference.md`](../../docs/vagrant-story-inventory-reference.md) (anchor values)
- Reference: [`docs/emulator-runtime-gaps.md`](../../docs/emulator-runtime-gaps.md) (peek channel docs)
- Precedes: **RSK-mm03** (schema), **RSK-mm05** (live decode)
