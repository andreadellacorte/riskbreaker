import type { GameSnapshot, RuntimeSnapshot } from "@riskbreaker/shared-types";
import type { IStateDecoder } from "@riskbreaker/plugin-sdk";

/** Holds the latest decoded snapshot; refreshes from `RuntimeSnapshot` via plugin decoder. */
export class StateStore {
  private latest: GameSnapshot | null = null;

  constructor(private readonly decoder: IStateDecoder) {}

  getDecoderId(): string {
    return this.decoder.id;
  }

  async refreshFrom(runtime: RuntimeSnapshot): Promise<GameSnapshot> {
    this.latest = await Promise.resolve(this.decoder.decode(runtime));
    return this.latest;
  }

  getSnapshot(): GameSnapshot | null {
    return this.latest;
  }
}
