import type { GameSnapshot, ViewModel } from "@riskbreaker/shared-types";

import type { SnapshotMapper } from "./snapshot-mapper.js";

export class ViewModelBuilder {
  constructor(private readonly mapper: SnapshotMapper) {}

  async build(snapshot: GameSnapshot): Promise<ViewModel> {
    return this.mapper.toViewModel(snapshot);
  }
}
