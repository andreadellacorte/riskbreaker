import { describe, expect, it } from "vitest";

import type { GameSnapshot, ViewModel } from "@riskbreaker/shared-types";
import type { IDomainPack } from "@riskbreaker/plugin-sdk";

import { SnapshotMapper } from "./snapshot-mapper.js";
import { ViewModelBuilder } from "./view-model-builder.js";

describe("ViewModelBuilder", () => {
  it("builds view model via mapper", async () => {
    const snap = { k: "v" } as unknown as GameSnapshot;
    const vm: ViewModel = { fromSnapshot: true };
    const pack: IDomainPack = {
      id: "x",
      mapToViewModel: (s) => (s === snap ? vm : {}),
    };
    const builder = new ViewModelBuilder(new SnapshotMapper(pack));
    expect(await builder.build(snap)).toBe(vm);
  });
});
