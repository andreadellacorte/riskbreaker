import type { ViewModel } from "@riskbreaker/shared-types";

export type RuleResult = { ok: true } | { ok: false; reason: string };

/** Placeholder policy layer before real UX gating. */
export class RulesEngine {
  evaluate(viewModel: ViewModel): RuleResult {
    void viewModel;
    return { ok: true };
  }
}
