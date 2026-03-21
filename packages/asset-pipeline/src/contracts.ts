import type { GameManifest } from "@riskbreaker/shared-types";

/** Future: BIN/CUE/ISO ingest. */
export interface IAssetImporter {
  importFromPath(path: string): Promise<GameManifest | null>;
}

/** Heuristic detection from a directory listing. */
export interface IGameDetector {
  detectFromPaths(paths: readonly string[]): Promise<GameManifest | null>;
}
