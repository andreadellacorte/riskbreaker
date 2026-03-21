/** Raw memory slice from the (mock) PSX runtime. */
export interface MemorySegment {
  name: string;
  offset: number;
  size: number;
  /** Present when snapshot includes bytes (mocks may omit). */
  bytes?: Uint8Array;
}

/** Low-level snapshot from `IRuntime` / `MockRuntimeAdapter`. */
export interface RuntimeSnapshot {
  timestamp: number;
  memorySegments: readonly MemorySegment[];
  registers: Readonly<Record<string, number>>;
  activeScene: string | null;
  /** Mock-only tag so tests can assert which fixture path ran. */
  mockStateTag?: string;
}
