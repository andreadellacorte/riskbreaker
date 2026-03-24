# Vagrant Story — RAM Map (NTSC-U, WASM emulator)

**Status:** Discovery in progress (RSK-mm02)
**Last updated:** 2026-03-24
**Dumps analysed:** 5 (four in-game, one via PCSX-Redux REST API)

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

**pcsx-wasm note:** The game executable region (`0x11000–0x1bffff`) appears as `0xFF` in pcsx-wasm WASM heap dumps despite the game running correctly. The stat block at `0x11fa58` (confirmed in PCSX-Redux) is not present in this region in pcsx-wasm. Working RAM (`0x2e4b0`, `0x37c00`, `0x37d40`) maps 1:1 and is confirmed in both emulators.

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

### Character stat block — FOUND at `0x11fa58` (PCSX-Redux)

Discovered 2026-03-24 using PCSX-Redux web server (`GET /api/v1/cpu/ram/raw`).
Method: took 41 total damage (HP 250→211), fetched 2MB RAM, searched for u16LE=211 adjacent to u16LE=250 — exactly one unique hit outside lookup tables.

Location: inside the game executable BSS/data region (`0x11000–0x1bffff`). This offset does **not** appear in pcsx-wasm WASM heap dumps — that region shows `0xFF` in pcsx-wasm. The correct WASM offset for the live riskbreaker overlay is still to be determined (RSK-mm02 open item).

#### Stat block layout (PS1 phys `0x11fa58`, confirmed in PCSX-Redux)

```
Offset    Bytes    Value   Field
0x11fa58  fa 00     250    HP current       (u16LE)  ← confirmed writable
0x11fa5a  fa 00     250    HP max           (u16LE)
0x11fa5c  32 00      50    MP current       (u16LE)
0x11fa5e  32 00      50    MP max           (u16LE)
0x11fa60  00 00       0    Risk             (u16LE) — zero at new game
0x11fa62  64 00     100    stat[0]          (u16LE) — STR/INT/AGL, identity TBD
0x11fa64  64 00     100    stat[1]          (u16LE)
0x11fa66  64 00     100    stat[2]          (u16LE)
0x11fa68  64 00     100    stat[3]          (u16LE)
0x11fa6a  64 00     100    stat[4]          (u16LE)
0x11fa6c  64 00     100    stat[5]          (u16LE)
0x11fa6e  09 12    4617    (combat / derived data — TBD)
...
```

VS Zenith 1.8.3 changelog confirms Clear Game resets to **250 HP / 50 MP / 100 STR/INT/AGL**, consistent with this block.

#### Write-path test results (PCSX-Redux, 2026-03-24)

**API:** `POST /api/v1/cpu/ram/raw?offset=<decimal>&size=<n>` with raw body bytes. Offset **must be decimal**.

**`0x11fa58` = 1178200 decimal** (not 1178712 — that is `0x11fc58`, 512 bytes past the stat block).

**No pause required.** The game only updates HP_cur on damage/heal events, not every frame. A write persists until the next combat event. Confirmed: write to 250 held stable across 2.5s of live emulation.

**In-game visual confirmation:** after writing HP_cur=250, the body-part health indicators on the STATUS screen changed from blue (damaged) to green (fully healed) for head, torso, and left arm. **End-to-end write path verified.**

#### Fields still to map

| Field | Status | Next step |
|-------|--------|-----------|
| Risk (non-zero) | unconfirmed | Enter combat, take hits, re-read `0x11fa60` |
| stat[0..5] identity | unconfirmed | Equip STR+/INT+/AGL+ item, re-read block |
| PP / Phantom Points | not located | Scan near stat block when using Break Arts |
| Equipment slots | not located | Equip/unequip weapon; scan for item ID changes |

---

### pcsx-wasm WASM heap offset — RESOLVED (2026-03-24)

**Root cause (string-scan approach was wrong):** The initial fix scanned `HEAPU8` for `SLUS_010.40\0` to locate psxM. This failed because Emscripten's virtual filesystem stores the entire mounted ISO in the WASM heap — the FS buffer contains the game executable (named `SLUS_010.40`) and thus the sentinel string. The scan found the FS copy, not psxM. All dumps read ISO data; live values (HP/MP) were never present.

**Fix (2026-03-24):** `draw_null.c` `get_ptr()` was extended with index `-3` to return `psxM` directly. `worker_funcs.js` now does `psxM_base = _get_ptr(-3)` after disc load — no scanning, no game-specific sentinels, works for any game.

**Confirmed working:** stat block at `0x11fa58` is correctly read; HP/MP/stats are live in the riskbreaker overlay. The overlay reads HP=250 at new game, updates on damage. ✓

---

### Item table (partial)

| Field | PS1 phys offset | Notes |
|-------|-----------------|-------|
| Item table area | `0x37c00` | Confirmed 1:1 in both PCSX-Redux and pcsx-wasm |
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

1. ~~Where is the character stat block?~~ **Resolved — `0x11fa58` (confirmed in both PCSX-Redux and pcsx-wasm)**
2. ~~What is the correct WASM heap offset for the stat block in pcsx-wasm?~~ **Resolved — `psxM_base + 0x11fa58` via `_get_ptr(-3)`**
3. What are stat[0..5] at `0x11fa62`? (STR, INT, AGL + 3 more — order unknown)
4. What is the item ID→name mapping? (item 1 = Cure Root? But qty field doesn't match.)
5. Is `0x37c10` really qty, or is qty at a different offset within the 128-byte entry?
6. What does `ff 41 5a ff ff` at `+0x30` of item entries represent?
7. Where are equipment slot fields (weapon ID, shield ID, helm ID, armour ID)?
8. Does Risk actually live at `0x11fa60`, or is it a separate field elsewhere?
