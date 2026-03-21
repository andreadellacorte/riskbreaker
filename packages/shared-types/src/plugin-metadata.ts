import type { TitleId } from "./title-id.js";

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  /** Title IDs this plugin is intended to support. */
  games: readonly TitleId[];
}
