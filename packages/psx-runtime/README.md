# @riskbreaker/psx-runtime

Contracts for a future PSX emulator backend plus **`MockRuntimeAdapter`** and **`EmulatorRuntimeAdapter`** (RSK-l7qs).

- **`IRuntime`** — load manifest, capture `RuntimeSnapshot`, lifecycle.
- **`SessionRuntimeFactory`** — `(snapshotFactory) => IRuntime` for **`SessionOrchestrator`** (`mock` vs `emulator` stub).
- **`MockMemoryAccessor`**, **`MockInputInjector`**, **`MockSavestateStore`** — in-memory stand-ins (both adapters use mocks for these until real I/O exists).
- **`MockRuntimeAdapter`** / **`EmulatorRuntimeAdapter`** accept an optional snapshot factory so plugins/tests can supply fixture-shaped snapshots without coupling this package to any game.

**Emulator adapter v1** returns a **stub** snapshot (`defaultEmulatorStubSnapshot`) or your factory — **not** live WASM RAM yet. Gaps: [`docs/emulator-runtime-gaps.md`](../../docs/emulator-runtime-gaps.md).

**Browser emulator spike:** WASM core in `apps/web` (`/play/spike`) is still **outside** `IRuntime` memory capture — **RSK-vs12**.
