import type { GameManifest } from "@riskbreaker/shared-types";

import type { IAssetImporter } from "./contracts.js";

/** Returns a fixed manifest for any path (harness / tests). */
export class MockAssetImporter implements IAssetImporter {
  constructor(private readonly manifest: GameManifest) {}

  async importFromPath(path: string): Promise<GameManifest | null> {
    void path;
    return this.manifest;
  }
}
