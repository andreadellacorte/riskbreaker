import type { GameSnapshot, RuntimeSnapshot } from "@riskbreaker/shared-types";

/** Plugin-supplied decoder: runtime snapshot → normalized game snapshot. */
export interface IStateDecoder {
  readonly id: string;
  decode(snapshot: RuntimeSnapshot): GameSnapshot | Promise<GameSnapshot>;
}
