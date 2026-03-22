# Documentation

| Doc                                                                                                              | Purpose                                                                                              |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [**architecture.md**](./architecture.md)                                                                         | Package boundaries, plugin model, data flow, Mermaid diagrams — **start here** for the system shape. |
| [**playable-emulator-spike.md**](./playable-emulator-spike.md)                                                   | Browser PS1 spike (`/play/spike`), lrusso/PlayStation, BIOS / legal testing notes.                   |
| [**playstation-engine-hacking.md**](./playstation-engine-hacking.md)                                             | Formatting, splitting, and extending `PlayStation.js` / WASM (not a black box).                      |
| [**brainstorms/playstation-js-modularize-typescript.md**](./brainstorms/playstation-js-modularize-typescript.md) | Brainstorm: TS modules, build, dev telemetry (epic **RSK-v50c** + child tasks).                      |
| [**plans/rsk-v50c-playstation-bundle.md**](./plans/rsk-v50c-playstation-bundle.md)                               | Plan: esbuild, `playstation-src/`, **RSK-74eh** overlay, milestones **RSK-fye3**–**RSK-wquv**, E2E.  |
| **Groove: RSK-l7qs**                                                                                             | Migrate spike to [lrusso/PlayStation](https://github.com/lrusso/PlayStation) (sound + fork).         |
| [**project-spec.md**](../project-spec.md)                                                                        | Full product and technical spec for Phase 1.                                                         |
| [**psx-ux-remaster-harness**](../.groove/memory/specs/psx-ux-remaster-harness.md)                                | Team harness notes (Groove epic, ordering, decisions).                                               |

Package-level READMEs live next to each `packages/*` and `plugins/*` crate.
