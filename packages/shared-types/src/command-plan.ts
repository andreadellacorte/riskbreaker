/** How the platform should apply an intent (mock or real). */
export type CommandPlanMode = "input-sequence" | "direct-write" | "hook-call" | "composite";

export type DirectWriteStep = { address: number; value: number };

export type CommandPlan =
  | { mode: "input-sequence"; steps: readonly string[] }
  | { mode: "direct-write"; writes: readonly DirectWriteStep[] }
  | { mode: "hook-call"; hook: string; args: readonly unknown[] }
  | { mode: "composite"; children: readonly CommandPlan[] };
