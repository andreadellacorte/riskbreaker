# @riskbreaker/app-shell

Glue between **plugins**, **`MockRuntimeAdapter`**, and the **state / domain / command** engines.

- **`PluginRegistry`** — thin wrapper around `resolvePluginForManifest`.
- **`ManifestResolver`** — JSON text → `GameManifest` via `@riskbreaker/asset-pipeline`.
- **`SessionOrchestrator`** — `bootstrap(manifest)` builds an **`ActiveSession`** (runtime, `StateStore`, `ViewModelBuilder`, `CommandBus`, `ScreenRegistry`, `SaveSlotBrowser`, devtools timeline).

**Does not** import game plugins. Pass `PluginRegistration[]` from the app entry (e.g. `apps/web` in Harness 05). Optional `RuntimeSnapshotFactory` feeds the mock runtime (use plugin fixtures from the app or tests).
