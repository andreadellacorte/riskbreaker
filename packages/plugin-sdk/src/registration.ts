import type { IGamePlugin } from "./game-plugin.js";
import type { PluginMetadata } from "@riskbreaker/shared-types";

/** Factory + static metadata for discovery (no plugin instance until create). */
export interface PluginRegistration {
  metadata: PluginMetadata;
  create(): IGamePlugin;
}

/** In-memory registry shape (app-shell will own the concrete implementation). */
export type PluginRegistry = ReadonlyMap<string, PluginRegistration>;
