import { describe, expect, it } from "vitest";

import type { GameSnapshot, ViewModel } from "@riskbreaker/shared-types";
import type { IDomainPack } from "@riskbreaker/plugin-sdk";

import { SnapshotMapper } from "./snapshot-mapper.js";

function mockPack(id: string, vm: ViewModel): IDomainPack {
  return {
    id,
    mapToViewModel: (_snapshot: GameSnapshot) => vm,
  };
}

describe("SnapshotMapper", () => {
  it("exposes pack id", () => {
    const mapper = new SnapshotMapper(mockPack("test.pack", { x: 1 }));
    expect(mapper.packId).toBe("test.pack");
  });

  it("delegates to pack.mapToViewModel", async () => {
    const snap = { inventoryState: null } as unknown as GameSnapshot;
    const mapper = new SnapshotMapper(
      mockPack("p", { title: "t", items: [1, 2] }),
    );
    const vm = await mapper.toViewModel(snap);
    expect(vm).toEqual({ title: "t", items: [1, 2] });
  });

  it("resolves async mapToViewModel", async () => {
    const snap = {} as GameSnapshot;
    const pack: IDomainPack = {
      id: "async-pack",
      mapToViewModel: (s) => Promise.resolve({ echoed: s === snap }),
    };
    const mapper = new SnapshotMapper(pack);
    expect(await mapper.toViewModel(snap)).toEqual({ echoed: true });
  });
});
