import type { IRuntime } from "./contracts.js";
import type { RuntimeSnapshotFactory } from "./mock-runtime-adapter.js";

/** Builds the `IRuntime` used by `SessionOrchestrator` (mock vs emulator stub, etc.). */
export type SessionRuntimeFactory = (
  snapshotFactory: RuntimeSnapshotFactory | undefined,
) => IRuntime;
