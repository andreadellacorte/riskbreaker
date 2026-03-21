import type { GameManifest } from "@riskbreaker/shared-types";

import type { IGameDetector } from "./contracts.js";

/** No-op detector until real fingerprints exist. */
export class MockGameDetector implements IGameDetector {
  async detectFromPaths(paths: readonly string[]): Promise<GameManifest | null> {
    void paths;
    return null;
  }
}
