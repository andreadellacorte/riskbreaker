import type { GameManifest, RuntimeSnapshot } from "@riskbreaker/shared-types";

import type { IMemoryBridge, IRuntime, RuntimeLifecycle } from "./contracts.js";
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

/** Size of PS1 main RAM in bytes (2 MB). */
const PSX_MAIN_RAM_SIZE = 2 * 1024 * 1024;

/**
 * Session runtime backed by the **browser emulator** in principle.
 *
 * - Without a bridge: returns a stub snapshot (unchanged from RSK-l7qs).
 * - With an {@link IMemoryBridge}: reads `PSX_MAIN_RAM_SIZE` bytes starting at WASM heap offset 0
 *   (best-effort PS1 main RAM; actual offset depends on the emulator build — see
 *   `docs/emulator-runtime-gaps.md`) and produces a real `RuntimeSnapshot`.
 *
 * Implements {@link IRuntime} alongside {@link MockRuntimeAdapter} — no `plugins/*` imports.
 */
export class EmulatorRuntimeAdapter implements IRuntime {
  readonly memory: MockMemoryAccessor = new MockMemoryAccessor();
  readonly input: MockInputInjector = new MockInputInjector();
  readonly savestates: MockSavestateStore = new MockSavestateStore();

  private lifecycle: RuntimeLifecycle = "cold";
  private manifest: GameManifest | null = null;

  constructor(
    private readonly snapshotFactory: RuntimeSnapshotFactory = defaultEmulatorStubSnapshot,
    private readonly memoryBridge?: IMemoryBridge,
  ) {}

  loadManifest(manifest: GameManifest): void {
    this.manifest = manifest;
    this.lifecycle = "loaded";
  }

  async captureSnapshot(): Promise<RuntimeSnapshot> {
    if (!this.manifest) {
      throw new Error("EmulatorRuntimeAdapter.captureSnapshot: loadManifest first");
    }
    this.lifecycle = "running";
    if (this.memoryBridge) {
      const bytes = await this.memoryBridge.peek(0, PSX_MAIN_RAM_SIZE);
      return {
        timestamp: Date.now(),
        memorySegments: [{ name: "psx_main_ram", offset: 0, size: PSX_MAIN_RAM_SIZE, bytes }],
        registers: { pc: 0 },
        activeScene: "emulator-live",
      };
    }
    return this.snapshotFactory();
  }

  getLifecycle(): RuntimeLifecycle {
    return this.lifecycle;
  }

  getLoadedManifest(): GameManifest | null {
    return this.manifest;
  }
}
