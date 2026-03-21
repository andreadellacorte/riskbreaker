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

## Copy-paste as a template

Add a new folder under `plugins/`, depend on `workspace:*` for `plugin-sdk` + `shared-types`, copy the `src/*.ts` layout, replace fixtures and pack logic, and register the new plugin in app-shell (Harness 04+).
