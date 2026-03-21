# @riskbreaker/psx-runtime

Contracts for a future PSX emulator backend plus **`MockRuntimeAdapter`** for Phase 1.

- **`IRuntime`** — load manifest, capture `RuntimeSnapshot`, lifecycle.
- **`MockMemoryAccessor`**, **`MockInputInjector`**, **`MockSavestateStore`** — in-memory stand-ins.
- **`MockRuntimeAdapter`** accepts an optional snapshot factory so plugins/tests can supply fixture-shaped snapshots without coupling this package to any game.
