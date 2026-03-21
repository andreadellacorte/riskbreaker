import type { CommandIntent, CommandPlan } from "@riskbreaker/shared-types";
import type { ICommandPack } from "@riskbreaker/plugin-sdk";

import { jsonClone } from "./clone.js";
import {
  getFixtureCommandPlanEquip,
  getFixtureCommandPlanSort,
} from "./load-fixtures.js";

const packId = "vagrant-story.command.mock";

export function createMockVagrantStoryCommandPack(): ICommandPack {
  return {
    id: packId,
    plan(intent: CommandIntent): CommandPlan | null {
      switch (intent.kind) {
        case "OpenInventory":
          return {
            mode: "input-sequence",
            steps: ["open_menu", "focus_inventory"],
          };
        case "EquipItem":
          return jsonClone(getFixtureCommandPlanEquip());
        case "SortInventory":
          return jsonClone(getFixtureCommandPlanSort());
        case "ShowComparePanel":
          return {
            mode: "hook-call",
            hook: "vagrant-story.openCompare",
            args: [],
          };
      }
    },
  };
}
