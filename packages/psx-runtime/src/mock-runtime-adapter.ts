import type { GameManifest, RuntimeSnapshot } from "@riskbreaker/shared-types";

import type { IRuntime, RuntimeLifecycle } from "./contracts.js";
import { MockInputInjector } from "./mock-input-injector.js";
import { MockMemoryAccessor } from "./mock-memory-accessor.js";
import { MockSavestateStore } from "./mock-savestate-store.js";

export type RuntimeSnapshotFactory = () => RuntimeSnapshot;

const defaultSnapshot = (): RuntimeSnapshot => ({
  timestamp: Date.now(),
  memorySegments: [{ name: "mock_ram", offset: 0, size: 2048 }],
  registers: { pc: 0x8000_0000 },
  activeScene: "mock-scene",
  mockStateTag: "psx-runtime-mock",
});

/** Harness mock: deterministic snapshots, pluggable factory for integration tests. */
export class MockRuntimeAdapter implements IRuntime {
  readonly memory: MockMemoryAccessor = new MockMemoryAccessor();
  readonly input: MockInputInjector = new MockInputInjector();
  readonly savestates: MockSavestateStore = new MockSavestateStore();

  private lifecycle: RuntimeLifecycle = "cold";
  private manifest: GameManifest | null = null;

  constructor(private readonly snapshotFactory: RuntimeSnapshotFactory = defaultSnapshot) {}

  loadManifest(manifest: GameManifest): void {
    this.manifest = manifest;
    this.lifecycle = "loaded";
  }

  captureSnapshot(): RuntimeSnapshot {
    if (!this.manifest) {
      throw new Error("MockRuntimeAdapter.captureSnapshot: loadManifest first");
    }
    this.lifecycle = "running";
    return this.snapshotFactory();
  }

  getLifecycle(): RuntimeLifecycle {
    return this.lifecycle;
  }

  getLoadedManifest(): GameManifest | null {
    return this.manifest;
  }
}
