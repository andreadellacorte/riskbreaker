import type { GameManifest } from "./manifest.js";

export type SessionPhase = "idle" | "loading" | "ready" | "error";

/** High-level session for app-shell / UI. */
export interface SessionState {
  sessionId: string;
  manifest: GameManifest | null;
  pluginId: string | null;
  phase: SessionPhase;
}
