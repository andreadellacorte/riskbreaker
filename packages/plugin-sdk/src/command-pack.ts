import type { CommandIntent, CommandPlan } from "@riskbreaker/shared-types";

/** Resolves intents to concrete plans (input sequences, writes, hooks, etc.). */
export interface ICommandPack {
  readonly id: string;
  plan(intent: CommandIntent): CommandPlan | null | Promise<CommandPlan | null>;
}
