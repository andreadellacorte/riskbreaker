# Documentation

| Doc                                                                                                              | Purpose                                                                                              |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [**architecture.md**](./architecture.md)                                                                         | Package boundaries, plugin model, data flow, Mermaid diagrams — **start here** for the system shape. |
| [**playable-emulator-spike.md**](./playable-emulator-spike.md)                                                   | Browser PS1 spike (`/play/spike`), lrusso/PlayStation, BIOS / legal testing notes.                   |
| [**playstation-engine-hacking.md**](./playstation-engine-hacking.md)                                             | Formatting, splitting, and extending `PlayStation.js` / WASM (not a black box).                      |
| [**brainstorms/playstation-js-modularize-typescript.md**](./brainstorms/playstation-js-modularize-typescript.md) | Brainstorm: TS modules, build, dev telemetry (epic **RSK-v50c** + child tasks).                      |
| [**plans/rsk-v50c-playstation-bundle.md**](./plans/rsk-v50c-playstation-bundle.md)                               | Plan: esbuild, `playstation-src/`, **RSK-74eh** overlay, milestones **RSK-fye3**–**RSK-wquv**, E2E.  |
| **Groove: RSK-l7qt**                                                                                             | Done: migrate spike to [lrusso/PlayStation](https://github.com/lrusso/PlayStation) (sound + fork).  |
| **Groove: RSK-uxvs**                                                                                             | Epic: VS remaster — **RSK-l7qs**, **RSK-vs10–vs16** (research → mock UI → live snapshot → input → equip / weapon / polish). |
| [**vagrant-story-inventory-reference.md**](./vagrant-story-inventory-reference.md)                               | Starting **usable** items (names + qty) + screenshot — fixtures / **RSK-vs11**.                        |
| [**vagrant-story-equipment-reference.md**](./vagrant-story-equipment-reference.md)                               | Starting **equipment** per slot + screenshot — fixtures / **RSK-vs14**.                               |
| [**emulator-runtime-gaps.md**](./emulator-runtime-gaps.md)                                                       | What **`EmulatorRuntimeAdapter`** does / does not wire yet (**RSK-l7qs**).                          |
| [**vagrant-story-menu-research.md**](./vagrant-story-menu-research.md)                                         | Triangle / Item / Equip topology, data-source confidence, unknowns (**RSK-vs10**).                  |
| [**vagrant-story-menu-verification-playbook.md**](./vagrant-story-menu-verification-playbook.md)                 | GameFAQs anatomy, local **`/play/spike`** QA; **`agent-browser`** optional (mainly spike, not FAQ). |
| [**project-spec.md**](../project-spec.md)                                                                        | Full product and technical spec for Phase 1.                                                         |
| [**psx-ux-remaster-harness**](../.groove/memory/specs/psx-ux-remaster-harness.md)                                | Team harness notes (Groove epic, ordering, decisions).                                               |

Package-level READMEs live next to each `packages/*` and `plugins/*` crate.
