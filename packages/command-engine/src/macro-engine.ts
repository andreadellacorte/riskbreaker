import type { CommandPlan } from "@riskbreaker/shared-types";

/** Mock: no macro expansion yet. */
export class MacroEngine {
  async expand(plan: CommandPlan): Promise<CommandPlan> {
    return plan;
  }
}
