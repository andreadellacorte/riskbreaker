import { describe, expect, it } from "vitest";
import { MockSavestateStore } from "./mock-savestate-store.js";
import type { RuntimeSnapshot } from "@riskbreaker/shared-types";

function makeSnapshot(hp = 100): RuntimeSnapshot {
  return {
    memorySegments: [{ label: "RAM", bytes: new Uint8Array([hp]) }],
    registers: { pc: 0x80010000 },
  } as unknown as RuntimeSnapshot;
}

describe("MockSavestateStore", () => {
  it("loadSlot returns null for unknown slot", () => {
    const store = new MockSavestateStore();
    expect(store.loadSlot("slot1")).toBeNull();
  });

  it("saveSlot and loadSlot round-trips a snapshot", () => {
    const store = new MockSavestateStore();
    const snap = makeSnapshot(200);
    store.saveSlot("s1", snap);
    const loaded = store.loadSlot("s1");
    expect(loaded).not.toBeNull();
    expect((loaded!.memorySegments[0].bytes as Uint8Array)[0]).toBe(200);
  });

  it("clones snapshot on save (mutation does not affect stored)", () => {
    const store = new MockSavestateStore();
    const snap = makeSnapshot(50);
    store.saveSlot("s1", snap);
    (snap.memorySegments[0].bytes as Uint8Array)[0] = 99;
    const loaded = store.loadSlot("s1");
    expect((loaded!.memorySegments[0].bytes as Uint8Array)[0]).toBe(50);
  });

  it("clones snapshot on load (mutation does not affect stored)", () => {
    const store = new MockSavestateStore();
    store.saveSlot("s1", makeSnapshot(77));
    const a = store.loadSlot("s1")!;
    (a.memorySegments[0].bytes as Uint8Array)[0] = 0;
    const b = store.loadSlot("s1")!;
    expect((b.memorySegments[0].bytes as Uint8Array)[0]).toBe(77);
  });

  it("handles segment with undefined bytes", () => {
    const store = new MockSavestateStore();
    const snap = { memorySegments: [{ label: "X" }], registers: {} } as unknown as RuntimeSnapshot;
    store.saveSlot("s1", snap);
    const loaded = store.loadSlot("s1")!;
    expect(loaded.memorySegments[0].bytes).toBeUndefined();
  });

  it("overwrites existing slot", () => {
    const store = new MockSavestateStore();
    store.saveSlot("s1", makeSnapshot(1));
    store.saveSlot("s1", makeSnapshot(2));
    const loaded = store.loadSlot("s1")!;
    expect((loaded.memorySegments[0].bytes as Uint8Array)[0]).toBe(2);
  });
});
