/**
 * RSK-xfc8: canonical URL query keys and localStorage namespace — no raw "debug" string literals at call sites.
 */

export const QUERY = {
  /** Opt-in debug logging / telemetry (`?debug=1`). */
  DEBUG: "debug",
  /** Spike shell + Riskbreaker overlay (`?riskbreaker=1`). */
  RISKBREAKER: "riskbreaker",
} as const;

export const STORAGE = {
  /** "1" / "0" — mirrors menu Perf HUD toggle. */
  PERF_HUD: "riskbreaker:perfHud",
  /** "1" / "0" — uncapped main loop (setImmediate). */
  SPEED_HACK: "riskbreaker:speedHack",
  /** "1" / "0" — SDL/canvas internal upscale (see `emscripten-glue.js` + `riskbreaker-runtime-controls.ts`). */
  UPSCALING: "riskbreaker:upscaling",
  /** "2" | "3" | "4" | "5" — internal SDL/canvas multiplier when upscaling is on (see `readInternalScaleFactor`). */
  INTERNAL_SCALE: "riskbreaker:internalScale",
  /** "1" — nearest-neighbor when CSS scales canvas; omit/"0" — smooth (default; usually better for 3D). */
  PIXELATED_PRESENT: "riskbreaker:pixelatedPresent",
  /** "1" / "0" — verbose overlay / key diagnostics. */
  DEBUG: "riskbreaker:debug",
} as const;

const INTERNAL_SCALE_MIN = 2;
const INTERNAL_SCALE_MAX = 5;
const INTERNAL_SCALE_DEFAULT = 3;

/** Integer internal resolution multiplier when upscaling is enabled (SDL video mode × N). */
export function readInternalScaleFactor(): number {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE.INTERNAL_SCALE);
    if (raw === null || raw === "") return INTERNAL_SCALE_DEFAULT;
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n)) return INTERNAL_SCALE_DEFAULT;
    return Math.min(INTERNAL_SCALE_MAX, Math.max(INTERNAL_SCALE_MIN, n));
  } catch {
    return INTERNAL_SCALE_DEFAULT;
  }
}

export function writeInternalScaleFactor(n: number): void {
  const v = Math.min(
    INTERNAL_SCALE_MAX,
    Math.max(INTERNAL_SCALE_MIN, Math.round(n)),
  );
  try {
    globalThis.localStorage?.setItem(STORAGE.INTERNAL_SCALE, String(v));
  } catch {
    /* ignore */
  }
}

/** True if `?key=1` or `&key=1`. */
export function queryParamEnabled(search: string, key: string): boolean {
  try {
    return new RegExp(`[?&]${escapeRegex(key)}=1(?:&|$)`).test(search);
  } catch {
    return false;
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Spike mode: `?riskbreaker=1`. */
export function riskbreakerSpikeQueryMatches(search: string): boolean {
  return queryParamEnabled(search, QUERY.RISKBREAKER);
}

/**
 * Debug / verbose overlay logging: `?debug=1` or `localStorage[STORAGE.DEBUG]`.
 */
export function riskbreakerDebugQueryMatches(search: string): boolean {
  if (queryParamEnabled(search, QUERY.DEBUG)) return true;
  try {
    return globalThis.localStorage?.getItem(STORAGE.DEBUG) === "1";
  } catch {
    return false;
  }
}

export function readStorageFlag(key: string): boolean {
  try {
    return globalThis.localStorage?.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function writeStorageFlag(key: string, enabled: boolean): void {
  try {
    globalThis.localStorage?.setItem(key, enabled ? "1" : "0");
  } catch {
    /* ignore quota / private mode */
  }
}
