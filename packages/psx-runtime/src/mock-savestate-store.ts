import type { RuntimeSnapshot } from "@riskbreaker/shared-types";

import type { ISavestateStore } from "./contracts.js";

export class MockSavestateStore implements ISavestateStore {
  private readonly slots = new Map<string, RuntimeSnapshot>();

  saveSlot(name: string, snapshot: RuntimeSnapshot): void {
    this.slots.set(name, cloneRuntimeSnapshot(snapshot));
  }

  loadSlot(name: string): RuntimeSnapshot | null {
    const s = this.slots.get(name);
    return s ? cloneRuntimeSnapshot(s) : null;
  }
}

function cloneRuntimeSnapshot(s: RuntimeSnapshot): RuntimeSnapshot {
  return {
    ...s,
    memorySegments: s.memorySegments.map((m) => ({
      ...m,
      bytes: m.bytes ? new Uint8Array(m.bytes) : undefined,
    })),
    registers: { ...s.registers },
  };
}
