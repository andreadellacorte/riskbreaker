import type { GameSnapshot, ViewModel } from "@riskbreaker/shared-types";

/** Maps decoded state into UI-facing view models (plugin rules). */
export interface IDomainPack {
  readonly id: string;
  mapToViewModel(snapshot: GameSnapshot): ViewModel | Promise<ViewModel>;
}
