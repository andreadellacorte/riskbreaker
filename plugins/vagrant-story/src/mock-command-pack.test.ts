import { describe, expect, it } from "vitest";
import { createMockVagrantStoryCommandPack } from "./mock-command-pack.js";
import type { CommandIntent } from "@riskbreaker/shared-types";

describe("createMockVagrantStoryCommandPack", () => {
  const pack = createMockVagrantStoryCommandPack();

  it("has correct id", () => {
    expect(pack.id).toBe("vagrant-story.command.mock");
  });

  it("plans OpenInventory", async () => {
    const plan = await pack.plan({ kind: "OpenInventory" } as CommandIntent);
    expect(plan).not.toBeNull();
    expect(plan?.mode).toBe("input-sequence");
  });

  it("plans EquipItem", () => {
    const plan = pack.plan({ kind: "EquipItem" } as CommandIntent);
    expect(plan).not.toBeNull();
  });

  it("plans SortInventory", () => {
    const plan = pack.plan({ kind: "SortInventory" } as CommandIntent);
    expect(plan).not.toBeNull();
  });

  it("plans ShowComparePanel", async () => {
    const plan = await pack.plan({ kind: "ShowComparePanel" } as CommandIntent);
    expect(plan?.mode).toBe("hook-call");
  });
});
