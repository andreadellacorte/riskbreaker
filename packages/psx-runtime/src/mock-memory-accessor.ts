import type { IMemoryAccessor } from "./contracts.js";

/** Simple word RAM backing store for harness mocks. */
export class MockMemoryAccessor implements IMemoryAccessor {
  private readonly words = new Map<number, number>();

  read32(offset: number): number {
    return this.words.get(offset) ?? 0;
  }

  write32(offset: number, value: number): void {
    this.words.set(offset, value >>> 0);
  }
}
