# Vagrant Story — RAM Map (NTSC-U, WASM emulator)

**Status:** Discovery in progress (RSK-mm02)
**Last updated:** 2026-03-24
**Dumps analysed:** 4 (three in-game)

---

## Memory layout overview

| PS1 phys range | Content |
|----------------|---------|
| `0x00000–0x00fff` | BIOS / kernel vectors |
| `0x01000–0x10fff` | Kernel / system |
| `0x11000–0x1bffff` | VS NTSC-U game executable (SLUS-01040) |
| `0x1c0000–0x1fffff` | Game data / BSS — text tables, lookup tables, display buffers |
| `0x2e4b0+` | Memory card save-slot header (`bu10:BASLUS-01040VAG?`) |
| `0x37b80–0x37c20` | Live game state — changes across menu states |
| `0x37c00+` | Partial item table area (stride ~0x80, 128 bytes/entry) |
| `0x37d40` | `"MC"` memory-card marker |

Dump offset 0 = PS1 physical address 0 directly.
PS1 virtual `0x8XXXXXXX` → physical = `addr & 0x1FFFFF`.

---

## Known anchors (new game, NTSC-U)

| Field | Value | Hex |
|-------|-------|-----|
| HP current / max | 250 | `0xFA` |
| MP current / max | 50 | `0x32` |
| Risk | 0 | `0x00` |
| STR / INT / AGL | 100 | `0x64` (at New Game; Clear Game resets to same values) |
| MISC slots used | 5 | `0x05` |
| Cure Root qty | 10 | `0x0A` |
| Vera Root qty | 10 | `0x0A` |
| Yggdrasil's Tears qty | 5 | `0x05` |
| Faerie Chortle qty | 5 | `0x05` |
| Spirit Orison qty | 5 | `0x05` |

---

## Confirmed findings

### Item table (partial)

| Field | PS1 phys offset | Notes |
|-------|-----------------|-------|
| Item table area | `0x37c00` | Partially confirmed; stride ~`0x80` (128 bytes/entry) |
| Entry 0 id | `0x37c00` | `u32LE = 1` |
| Entry 0 ptr | `0x37c08` | `u32LE = 0x086a` (in-game pointer) |
| Entry 0 qty candidate | `0x37c10` | `u32LE = 0x0f` (15) — **does not match expected Cure Root ×10; needs re-verification** |
| Entry 0 name marker | `0x37c30` | `ff 41 5a ff ff` — possible range or encoding header |
| MC marker | `0x37d40` | `"MC"` (memory-card region boundary) |

**Item entry layout** (128 bytes, offsets from entry base):

```
+0x00  id        u32LE   item type ID
+0x04  unknown   u32LE
+0x08  ptr       u32LE   in-game pointer (e.g. 0x086a)
+0x0C  timestamp u32LE   changes on menu navigation
+0x10  qty?      u32LE   candidate quantity field — needs confirmation
+0x30  ???       5 bytes ff 41 5a ff ff — possible encoding range marker
... (remaining bytes: gems, affinities, stat bonuses TBD)
```

### Text table

VS custom text encoding table located at `0x1fbb35–0x1fedd6` (inside game BSS/data).
Encoding key (confirmed from PPF + MIPS code analysis):

| Byte | Char | Byte | Char |
|------|------|------|------|
| `0x0a` | `0` | `0x24` | `A` |
| `0x0b` | `1` | `0x25` | `B` |
| ... | ... | ... | ... |
| `0x13` | `9` | `0x3d` | `Z` |
| `0xe7` | EOL | `0xfa 0x06` | line break / separator |
| `0x00` | space | — | — |

Confirmed from spell names "NOTHING" (`31 32 37 2b 2c 31 2a`), "TERRA THRUST" in PPF patches.

### Game executable

| Range | Content |
|-------|---------|
| `0x11000–0x1bffff` | MIPS R3000A code + data |
| `0x1fbb35–0x1fedd6` | VS text string table (spell/ability/item names, VS encoding) |
| `0x1ff4c0` | Sequential byte table (encoding or sine-like lookup) |

### Save data

Memory-card save buffer at `0x2e4b0`:
- Header: `bu10:BASLUS-01040VAG?` (confirms NTSC-U)
- Index table at `0x2e520–0x2e7ff`: sequential u32 values 0x46→0x05 with 0x06 as "empty slot" sentinels

---

## Character stat block — NOT YET FOUND

Exhaustive search results (all 4 dumps, multiple encodings):

| Encoding tried | u16LE=250 hits outside lookup table | u16LE=50 hits (stable) |
|----------------|-------------------------------------|------------------------|
| Direct u16LE | 8 occurrences, all in lookup tables | 728 (most in code) |
| u8=0xFA | Hundreds, all in MIPS code / lookup tables | — |
| u32LE=250 | Only at `0x2d010` (repeated-value lookup table) | — |
| u16BE | — | — |
| float32 | — | — |

**No HP/MP pair found in adjacent or nearby memory** across stable multi-dump comparison.

### Hypotheses for missing stat block

1. **Not yet initialised** — first dump taken before game fully loaded; confirmed no VS strings present. Later dumps (in STATUS menu) still show `0x37700–0x37900` as all-zeros.

2. **Pointer indirection** — the game may store stats at a virtual address that's resolved at runtime via a pointer. The stat struct address might change each session.

3. **Scratch Pad** — PS1 has 1KB Scratch Pad at physical `0x1f800000`, not in main RAM dump. Unlikely for persistent state but possible for display/calc values.

4. **Non-standard encoding** — VS may store HP as a fixed-point value, scaled value (e.g. HP×10 = 2500), or as a packed bitfield. Search for u16LE=2500 found only one hit at `0x1f08c0` (lookup table).

5. **Region above 0xff000** — most searches covered `0x20000–0xff000`. High data region `0x1c0000–0x1fffff` has many `0xfa` bytes but they appear to be MIPS instruction immediates, not character stats.

### Next steps

- Take a new dump **during active gameplay** (not menus) — walk Ashley in Snowfly Forest
- Compare with a dump taken **immediately after taking 1 damage** — the HP should change by exactly 1, making the offset trivially locatable
- Alternatively: inspect the PPF patch binary for hardcoded PS1 addresses in MIPS `lui/addiu` instruction pairs that reference the character struct

---

## PPF analysis (zenith_192.ppf — VS Zenith v1.9.x)

- Format: PPF3 (`PPF30`) method=2 (ISO binary mode)
- ~307,890 patch records
- Target ISO size: ~336MB (consistent with PS1 BIN/CUE image)
- Patch offset range: `0x52d10–0x25be6xxx`

### What the PPF patches

| Disc offset range | Content patched |
|-------------------|-----------------|
| `0x52d10–0x534xx` | Game executable text — spell names, ability names, UI strings |
| `0x25be60xx` | Binary/graphical data near end of disc |
| `0x465f4e…` | PPF metadata: "FILE_ID.DIZ — STARBEE PRESENTS: PPF-Studio 1.01b" |

### VS Zenith version context

**v1.8.3 highlights** (from changelog):
- Clear Game resets Ashley to **250 HP / 50 MP / 100 STR-INT-AGL** (confirms our anchor values)
- Shields 50% less effective; chaining + defense timing made harder
- New grimoires (Warlock spells), 10 new weapon combos, 3 new gems, Sovnya grip
- Teleportation free; Analyze 100% hit rate

**v1.9.2 highlights** (2026-01-01 blog post):
- **Polaris gem (Staff)**: grants Tornado, Thunderburst, Fire Storm, Gravity, Acid Flow, Judgment, Apocalypse
- **Galerian gem (Polearm)**: Square button cycles weapon type (Blunt/Edged/Piercing) mid-combat
- Powerfist bonus 50%→40%, White Queen 80%→60%
- Enemy spell cast rates modified for Crimson Blades / Gremlins

The Galerian mechanic (runtime weapon-type switching) is very relevant to riskbreaker Phase 2 — it demonstrates that VS's weapon type is a mutable field we may want to expose.

---

## Open questions

1. Where is the character stat block (HP/MP/Risk/STR/INT/AGL)? Suspected: pointer-addressed, not at a fixed PS1 address.
2. What is the item ID→name mapping? (item 1 = Cure Root? But qty field doesn't match.)
3. Is `0x37c10` really qty, or is qty at a different offset within the 128-byte entry?
4. What does `ff 41 5a ff ff` at `+0x30` of item entries represent?
5. Does the game use Scratch Pad for working stat values?
