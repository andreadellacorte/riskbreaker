import type { CommandIntent, CommandPlan } from "@riskbreaker/shared-types";
import type { ICommandPack } from "@riskbreaker/plugin-sdk";

export class CommandTranslator {
  constructor(private readonly pack: ICommandPack) {}

  get packId(): string {
    return this.pack.id;
  }

  async translate(intent: CommandIntent): Promise<CommandPlan | null> {
    return Promise.resolve(this.pack.plan(intent));
  }
}
