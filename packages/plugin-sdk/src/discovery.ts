import type { GameManifest } from "@riskbreaker/shared-types";
import type { PluginRegistration } from "./registration.js";

/** Pick the first registration whose plugin claims the manifest. */
export async function resolvePluginForManifest(
  manifest: GameManifest,
  registrations: readonly PluginRegistration[],
): Promise<PluginRegistration | null> {
  for (const reg of registrations) {
    const plugin = reg.create();
    if (await plugin.canHandle(manifest)) {
      return reg;
    }
  }
  return null;
}
