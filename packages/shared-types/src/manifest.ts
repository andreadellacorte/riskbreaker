import type { Region } from "./region.js";
import type { TitleId } from "./title-id.js";

/** Canonical description of a mounted / detected game (from asset pipeline + detection). */
export interface GameManifest {
  title: string;
  titleId: TitleId;
  region: Region;
  version: string;
  discFormat: string;
  /** Hints for which plugin may handle this build (opaque to core). */
  pluginHints: readonly string[];
  /** Optional fingerprint of the main executable for matching. */
  executableHash?: string;
}
