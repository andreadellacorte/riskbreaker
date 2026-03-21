import type { GameManifest } from "@riskbreaker/shared-types";
import { GameManifestBuilder } from "@riskbreaker/asset-pipeline";

export class ManifestResolver {
  constructor(private readonly builder = new GameManifestBuilder()) {}

  parseJson(text: string): GameManifest {
    const data: unknown = JSON.parse(text);
    return this.builder.buildFromUnknown(data);
  }
}
