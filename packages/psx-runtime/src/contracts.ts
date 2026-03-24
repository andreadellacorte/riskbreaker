import type { GameManifest, RuntimeSnapshot } from "@riskbreaker/shared-types";

export type RuntimeLifecycle = "cold" | "loaded" | "running";

/** High-level runtime seam (emulator-backed implementation later). */
export interface IRuntime {
  loadManifest(manifest: GameManifest): void | Promise<void>;
  captureSnapshot(): RuntimeSnapshot | Promise<RuntimeSnapshot>;
  getLifecycle(): RuntimeLifecycle;
}

/** Byte-level memory access (mock or real). */
export interface IMemoryAccessor {
  read32(offset: number): number;
  write32(offset: number, value: number): void;
}

/** Feeds controller / menu input into the runtime. */
export interface IInputInjector {
  enqueue(steps: readonly string[]): void;
}

/**
 * Async memory read channel into the WASM emulator worker.
 * `address` is a WASM heap offset; see docs/emulator-runtime-gaps.md for PS1→WASM offset mapping.
 */
export interface IMemoryBridge {
  peek(address: number, length: number): Promise<Uint8Array>;
}

/** Named savestate slots (RAM dumps, etc.). */
export interface ISavestateStore {
  saveSlot(name: string, snapshot: RuntimeSnapshot): void | Promise<void>;
  loadSlot(name: string): RuntimeSnapshot | null | Promise<RuntimeSnapshot | null>;
}
