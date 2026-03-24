# @riskbreaker/app-shell

Glue between **plugins**, **`IRuntime`** (**`MockRuntimeAdapter`** or **`EmulatorRuntimeAdapter`**), and the **state / domain / command** engines.

- **`PluginRegistry`** — thin wrapper around `resolvePluginForManifest`.
- **`ManifestResolver`** — JSON text → `GameManifest` via `@riskbreaker/asset-pipeline`.
- **`SessionOrchestrator`** — `bootstrap(manifest)` builds an **`ActiveSession`** (`runtime: IRuntime`, `StateStore`, `ViewModelBuilder`, `CommandBus`, `ScreenRegistry`, `SaveSlotBrowser`, devtools timeline). Optional third argument: **`SessionRuntimeFactory`** (default: mock adapter).

**Does not** import game plugins. Pass `PluginRegistration[]` from the app entry (e.g. `apps/web`). Optional `RuntimeSnapshotFactory` feeds whichever runtime you construct (fixtures from the app or tests).
