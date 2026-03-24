import type { GameManifest, RuntimeSnapshot } from "@riskbreaker/shared-types";

import type { IRuntime, RuntimeLifecycle } from "./contracts.js";
import { MockInputInjector } from "./mock-input-injector.js";
import { MockMemoryAccessor } from "./mock-memory-accessor.js";
import { MockSavestateStore } from "./mock-savestate-store.js";
import type { RuntimeSnapshotFactory } from "./mock-runtime-adapter.js";

/**
 * Default snapshot when no factory is supplied — shape matches {@link MockRuntimeAdapter}
 * defaults so plugin decoders keep working; tagged for tests and UI.
 * **Not** live PSX RAM — see `docs/emulator-runtime-gaps.md`.
 */
export const defaultEmulatorStubSnapshot = (): RuntimeSnapshot => ({
  timestamp: Date.now(),
  memorySegments: [{ name: "emulator_stub", offset: 0, size: 0 }],
  registers: { pc: 0xbfc0_0000 },
  activeScene: "emulator-boot",
  mockStateTag: "psx-runtime-emulator-stub",
});

/**
 * Session runtime backed by the **browser emulator** in principle; v1 returns a **stub**
 * snapshot until **RSK-vs12** wires real memory/save capture. Implements {@link IRuntime}
 * alongside {@link MockRuntimeAdapter} — no `plugins/*` imports.
 */
export class EmulatorRuntimeAdapter implements IRuntime {
  readonly memory: MockMemoryAccessor = new MockMemoryAccessor();
  readonly input: MockInputInjector = new MockInputInjector();
  readonly savestates: MockSavestateStore = new MockSavestateStore();

  private lifecycle: RuntimeLifecycle = "cold";
  private manifest: GameManifest | null = null;

  constructor(
    private readonly snapshotFactory: RuntimeSnapshotFactory = defaultEmulatorStubSnapshot,
  ) {}

  loadManifest(manifest: GameManifest): void {
    this.manifest = manifest;
    this.lifecycle = "loaded";
  }

  captureSnapshot(): RuntimeSnapshot {
    if (!this.manifest) {
      throw new Error("EmulatorRuntimeAdapter.captureSnapshot: loadManifest first");
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
