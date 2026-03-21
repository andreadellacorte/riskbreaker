import type { CommandPlan } from "@riskbreaker/shared-types";

/** Mock: all plans allowed; later hook safety / TAS policy. */
export class PolicyEngine {
  async authorize(plan: CommandPlan | null): Promise<CommandPlan | null> {
    return plan;
  }
}
