import { describe, expect, it } from "vitest";
import { CommandBus } from "./command-bus.js";
import { CommandTranslator } from "./command-translator.js";
import type { CommandIntent, CommandPlan } from "@riskbreaker/shared-types";
import type { ICommandPack } from "@riskbreaker/plugin-sdk";

function makePack(plan: CommandPlan | null): ICommandPack {
  return { id: "test", plan: () => plan };
}

const intent = { kind: "OpenInventory" } as CommandIntent;
const plan: CommandPlan = { mode: "input-sequence", steps: [] };

describe("CommandBus", () => {
  it("returns a plan when translator returns one", async () => {
    const bus = new CommandBus(new CommandTranslator(makePack(plan)));
    const result = await bus.dispatch(intent);
    expect(result).not.toBeNull();
  });

  it("returns null when translator returns null", async () => {
    const bus = new CommandBus(new CommandTranslator(makePack(null)));
    const result = await bus.dispatch(intent);
    expect(result).toBeNull();
  });
});
