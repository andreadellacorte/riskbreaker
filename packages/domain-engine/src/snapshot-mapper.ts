import type { GameSnapshot, ViewModel } from "@riskbreaker/shared-types";
import type { IDomainPack } from "@riskbreaker/plugin-sdk";

/** Thin wrapper around `IDomainPack` for naming symmetry with other engines. */
export class SnapshotMapper {
  constructor(private readonly pack: IDomainPack) {}

  get packId(): string {
    return this.pack.id;
  }

  async toViewModel(snapshot: GameSnapshot): Promise<ViewModel> {
    return Promise.resolve(this.pack.mapToViewModel(snapshot));
  }
}
