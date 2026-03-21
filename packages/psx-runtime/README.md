# @riskbreaker/psx-runtime

Contracts for a future PSX emulator backend plus **`MockRuntimeAdapter`** for Phase 1.

- **`IRuntime`** — load manifest, capture `RuntimeSnapshot`, lifecycle.
- **`MockMemoryAccessor`**, **`MockInputInjector`**, **`MockSavestateStore`** — in-memory stand-ins.
- **`MockRuntimeAdapter`** accepts an optional snapshot factory so plugins/tests can supply fixture-shaped snapshots without coupling this package to any game.

**Browser emulator spike:** a separate **WASM PS1** experiment (`/play/spike` in `apps/web`, lrusso/PlayStation) is **not** integrated with `IRuntime` yet — see [`docs/playable-emulator-spike.md`](../../docs/playable-emulator-spike.md).
