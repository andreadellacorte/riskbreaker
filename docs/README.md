# Documentation

| Doc                                                                                                              | Purpose                                                                                              |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [**architecture.md**](./architecture.md)                                                                         | Package boundaries, plugin model, data flow, Mermaid diagrams — **start here** for the system shape. |
| [**playable-emulator-spike.md**](./playable-emulator-spike.md)                                                   | Browser PS1 spike (`/play/spike`), PCSX-wasm shell + verification notes.                          |
| [**emulator-runtime-gaps.md**](./emulator-runtime-gaps.md)                                                       | What **`EmulatorRuntimeAdapter`** does / does not wire yet (**RSK-l7qs**).                          |
| **Groove: RSK-l7qt**                                                                                             | Done: migrate spike to the browser emulator shell (sound + fork).                                |
| **Groove: RSK-uxvs**                                                                                             | Epic: VS remaster — **RSK-l7qs**, **RSK-vs10–vs16** (research → mock UI → live snapshot → input → equip / weapon / polish). |
| [**vagrant-story-inventory-reference.md**](./vagrant-story-inventory-reference.md)                               | Starting **usable** items (names + qty) + screenshot — fixtures / **RSK-vs11**.                        |
| [**vagrant-story-equipment-reference.md**](./vagrant-story-equipment-reference.md)                               | Starting **equipment** per slot + screenshot — fixtures / **RSK-vs14**.                               |
| [**vagrant-story-menu-research.md**](./vagrant-story-menu-research.md)                                         | Triangle / Item / Equip topology, data-source confidence, unknowns (**RSK-vs10**).                  |
| [**vagrant-story-menu-verification-playbook.md**](./vagrant-story-menu-verification-playbook.md)                 | GameFAQs anatomy, local **`/play/spike`** QA; **`agent-browser`** optional (mainly spike, not FAQ). |
| [**project-spec.md**](../project-spec.md)                                                                        | Full product and technical spec for Phase 1.                                                         |
| [**psx-ux-remaster-harness**](../.groove/memory/specs/psx-ux-remaster-harness.md)                                | Team harness notes (Groove epic, ordering, decisions).                                               |

Package-level READMEs live next to each `packages/*` and `plugins/*` crate.
