import type { GameManifest } from "@riskbreaker/shared-types";
import { resolvePluginForManifest, type PluginRegistration } from "@riskbreaker/plugin-sdk";

/** Holds available plugin factories; delegates discovery to `resolvePluginForManifest`. */
export class PluginRegistry {
  constructor(private readonly registrations: readonly PluginRegistration[]) {}

  async resolveFor(manifest: GameManifest): Promise<PluginRegistration | null> {
    return resolvePluginForManifest(manifest, this.registrations);
  }

  list(): readonly PluginRegistration[] {
    return this.registrations;
  }
}
