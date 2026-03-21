import type { CommandIntent, CommandPlan } from "@riskbreaker/shared-types";

import { MacroEngine } from "./macro-engine.js";
import { PolicyEngine } from "./policy-engine.js";
import type { CommandTranslator } from "./command-translator.js";

export class CommandBus {
  private readonly policy = new PolicyEngine();
  private readonly macros = new MacroEngine();

  constructor(private readonly translator: CommandTranslator) {}

  async dispatch(intent: CommandIntent): Promise<CommandPlan | null> {
    const raw = await this.translator.translate(intent);
    const allowed = await this.policy.authorize(raw);
    if (!allowed) {
      return null;
    }
    return this.macros.expand(allowed);
  }
}
