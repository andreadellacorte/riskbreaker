# Vagrant Story — menu topology & RAM feasibility (RSK-vs10)

Internal reference for **RSK-uxvs**: fixtures we own, **sourced** pointers for real menu behaviour, and **gaps** before **RSK-vs12** / **RSK-vs13**. Not a decompilation.

## Sourcing (read this first)

- **Brainstorm / thread examples** (e.g. Triangle → Item → sub-menus) were **illustrative product direction only** — **not** canonical documentation and **not** quotable as ground truth.
- **Authoritative menu write-up (community):** use the GameFAQs FAQ linked below for **actual** hierarchy, terminology, and flows. This repo does **not** reproduce that guide’s text (copyright); we **link** and summarise **process** only.

## Canonical reference — in-game menus (external)

**Primary:** [Vagrant Story — Miscellaneous Guide (FAQ)](https://gamefaqs.gamespot.com/ps/914326-vagrant-story/faqs/8331) (GameFAQs, Dan_GC, 2000 — US PSX focus).

**Detail & verification (2026):** [vagrant-story-menu-verification-playbook.md](./vagrant-story-menu-verification-playbook.md) — **TOC-level** FAQ summary, **Cloudflare** note, and a **local `/play/spike`** checklist (optional **`agent-browser`** for automation — **not** required to read GameFAQs).

**Full menu map (structure + state model):** [vagrant-story-menu-map.md](./vagrant-story-menu-map.md)

## UX pain points & loadouts (community discussion)

**Player feedback** (menus, friction, loadouts — useful for **why** we remaster, not for RAM addresses):

- [Reddit — *Vagrant Story*: a game that was too good for its time…](https://www.reddit.com/r/retrogaming/comments/1jl8jaz/vagrant_story_a_game_that_was_too_good_for_its/) (`r/retrogaming`)

## Visual exploration — modern UX direction (Figma)

**Concept / redesign prototype** (third party; **not** official Square; use as **inspiration** for Riskbreaker UI spikes such as **RSK-vs11**):

- [Figma prototype — “The Phantom Pain” (VS UX exploration)](https://www.figma.com/proto/roPMrnFqsqd8lths3rJG6n/The-Phantom-Pain?node-id=698-8896&viewport=440%2C278%2C0.18&scaling=contain&starting-point-node-id=429%3A804)

## Captured starting-state fixtures (in-repo)

Screenshot + tables for **parity** with native UI at new game — independent of the FAQ text.

| Topic | Doc |
| ----- | --- |
| Starting **usable items** (names + qty) | [vagrant-story-inventory-reference.md](./vagrant-story-inventory-reference.md) |
| Starting **equipment** (per slot) | [vagrant-story-equipment-reference.md](./vagrant-story-equipment-reference.md) |

## Candidate data sources (confidence)

| Source | Use | Confidence |
| ------ | --- | ---------- |
| **JSON fixtures** in `plugins/vagrant-story` | `RuntimeSnapshot` → mock decoder → view models | **High** — we own the pipeline |
| **Emulator `EmulatorRuntimeAdapter` stub** | Same shapes as mock; tag `psx-runtime-emulator-stub` | **High** — no live RAM yet ([emulator-runtime-gaps.md](./emulator-runtime-gaps.md)) |
| **GameFAQs FAQ** (menus) | Human-readable **correct** menu map for design / copy | **High** for UX; **not** machine-readable RAM |
| **PSX main RAM** via WASM / core | Raw bytes → plugin decoder | **Unknown** — **RSK-vs12** |
| **Memory card / save files** | Structured saves | **Medium** — community formats; **not** same as live RAM |
| **Screen / menu detection** | Know which UI is open | **Low** until variables identified |

## Risks

- **Timing:** menus animate; naive RAM read mid-transition can desync from what the player sees.
- **State machine:** internal **mode** flags TBD — decoder may need **scene id** / **menu id** from RAM.
- **Input:** web actions → pad semantics (**RSK-vs13**); errors can desync or soft-lock.

## Unknowns (for RSK-vs12 / RSK-vs13)

1. **Addresses / structs** for inventory, equipment, **current menu** in the target build (e.g. NTSC-U).
2. **Stable** memory export from lrusso/PlayStation into `RuntimeSnapshot` — see [emulator-runtime-gaps.md](./emulator-runtime-gaps.md).
3. **Input** strategy: pad events vs anything else — product / fragility tradeoffs.
4. **Locale:** fixtures and FAQ alignment per region — **RSK-vs16**.

## Other pointers (secondary)

- [The Cutting Room Floor — Vagrant Story](https://tcrf.net/Vagrant_Story) — dev / regional notes.
- [Vagrant Story Wiki — Gameplay](https://vagrantstory.fandom.com/wiki/Gameplay) — high-level mechanics.

Do **not** paste long copyrighted in-game or FAQ prose into this repo; **item names** in fixtures are for **parity testing** only.

## Links

- Epic: `.groove/tasks/RSK-uxvs--epic-vagrant-story-ui-remaster-and-emulator-bridge.md`
- Beans: **RSK-vs11** (mock parallel UI), **RSK-vs12** (snapshot pipe), **RSK-vs13** (input)
