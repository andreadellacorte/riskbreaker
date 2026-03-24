# @riskbreaker/plugin-vagrant-story

**Mock** Vagrant Story plugin for Riskbreaker Phase 1 — reference for how a game plugin wires into `@riskbreaker/plugin-sdk`.

## What’s here

- **`createVagrantStoryPlugin()`** — full `IGamePlugin`: metadata, `canHandle`, state decoder, domain/command/UI packs, save codec (stub), patch pack (stub).
- **JSON fixtures** under [`src/fixtures/`](./src/fixtures/) — manifest, runtime snapshot, decoded `GameSnapshot`, inventory view model, sample `CommandPlan` JSON.
- **Coherent mocks** — decoder and domain pack return structured inventory/character data (not empty placeholders).

## `canHandle`

Matches when:

- `manifest.titleId` is one of the known IDs (e.g. **SLUS-01040**, **SLES-02754**), or
- `manifest.pluginHints` contains `vagrant-story`, `riskbreaker.plugin.vagrant-story`, or `com.riskbreaker.vagrant-story`.

## ROM / `bins/`

Mocks **do not** read disc images or BIOS files. Nothing under `bins/` is required for tests or fixture-driven flows. When real emulation lands, asset loading can plug in behind the same interfaces; the save codec README note describes the current stub.

## RAM abstraction library (`src/ram/`)

An OO memory-map layer for the US version of the game (SLUS-010.40).
No magic constants in plugin code — everything goes through typed accessors:

```ts
import { VagrantStoryRam } from "./ram/index.js";

const ram = new VagrantStoryRam(emulatorHost.peek);

// Character vitals (single batch peek)
const { hpCur, hpMax, mpCur, mpMax, risk } = await ram.ashley.vitals();

// Mode / position
const mode = await ram.ashley.mode();         // "normal" | "battle"
const x    = await ram.ashley.x();

// Equipped weapon
const name  = await ram.ashley.equip.weaponName();
const blade = await ram.ashley.equip.weaponBlade();
// blade.dpCur / blade.dpMax / blade.ppCur / blade.ppMax / blade.materialName

// Shield (blade.equipped = false when no shield is in the slot)
const shield = await ram.ashley.equip.shield();

// Current room
const zone = await ram.room.zoneId();
const room = await ram.room.roomId();

// Actors in the current room (linked list)
const enemies = await ram.actors.all();

// Skills table
const allSkills = await ram.skills.all();

// Battle engine code addresses (constants — not RAM reads)
console.log(ram.battleEngine.listWeapon.toString(16));   // "6b8c0"
console.log(ram.battleEngine.killCharacter.toString(16)); // "6c1cc"
```

Modules:
| File | Contents |
|---|---|
| `ram/addresses.ts` | All named RAM / code address constants + `toPhysical()` |
| `ram/tbl.ts` | VS charset (TBL) decoder — `decodeVsString()` |
| `ram/structs.ts` | `readEquipData()`, `readSkillData()`, `readActorData()` |
| `ram/vs-ram.ts` | `VagrantStoryRam`, `Ashley`, `EquippedItems`, `ActorList`, `SkillsTable`, `CurrentRoom`, `battleEngine` |
| `ram/index.ts` | Public re-export barrel |

## References

- [DataCrystal — Vagrant Story](https://datacrystal.tcrf.net/wiki/Vagrant_Story) — game data wiki
  - [RAM map](https://datacrystal.tcrf.net/wiki/Vagrant_Story/RAM_map)
  - [TBL (text encoding)](https://datacrystal.tcrf.net/wiki/Vagrant_Story/TBL)
  - [Data Structures](https://datacrystal.tcrf.net/wiki/Vagrant_Story/Data_Structures)

## Related projects

- [rood-reverse](https://github.com/ser-pounce/rood-reverse) — ongoing decompilation of Vagrant Story; may eventually allow replacing the ISO with source-built assets.

## Copy-paste as a template

Add a new folder under `plugins/`, depend on `workspace:*` for `plugin-sdk` + `shared-types`, copy the `src/*.ts` layout, replace fixtures and pack logic, and register the new plugin in app-shell (Harness 04+).
