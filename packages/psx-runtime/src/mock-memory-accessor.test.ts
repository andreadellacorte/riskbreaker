import { describe, expect, it } from "vitest";
import { MockMemoryAccessor } from "./mock-memory-accessor.js";

describe("MockMemoryAccessor", () => {
  it("read32 returns 0 for unwritten address", () => {
    const m = new MockMemoryAccessor();
    expect(m.read32(0x1000)).toBe(0);
  });

  it("write32 and read32 round-trips", () => {
    const m = new MockMemoryAccessor();
    m.write32(0x0, 0xdeadbeef);
    expect(m.read32(0x0)).toBe(0xdeadbeef);
  });

  it("write32 applies unsigned 32-bit mask", () => {
    const m = new MockMemoryAccessor();
    m.write32(0x4, -1);
    expect(m.read32(0x4)).toBe(0xffffffff);
  });

  it("different addresses are independent", () => {
    const m = new MockMemoryAccessor();
    m.write32(0x0, 1);
    m.write32(0x4, 2);
    expect(m.read32(0x0)).toBe(1);
    expect(m.read32(0x4)).toBe(2);
  });

  it("overwrites previous value", () => {
    const m = new MockMemoryAccessor();
    m.write32(0x8, 0xaabb);
    m.write32(0x8, 0x1234);
    expect(m.read32(0x8)).toBe(0x1234);
  });
});
