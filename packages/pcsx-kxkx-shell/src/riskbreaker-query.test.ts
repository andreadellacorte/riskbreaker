import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  QUERY,
  queryParamEnabled,
  readInternalScaleFactor,
  riskbreakerDebugQueryMatches,
  riskbreakerSpikeQueryMatches,
  writeInternalScaleFactor,
} from "./riskbreaker-query.js";

describe("riskbreaker-query", () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    for (const k of Object.keys(store)) delete store[k];
    vi.stubGlobal(
      "localStorage",
      {
        getItem: (k: string) => (k in store ? store[k] : null),
        setItem: (k: string, v: string) => {
          store[k] = v;
        },
        removeItem: (k: string) => {
          delete store[k];
        },
        clear: () => {
          for (const k of Object.keys(store)) delete store[k];
        },
      } as Storage,
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses QUERY.RISKBREAKER for spike", () => {
    expect(queryParamEnabled("?riskbreaker=1", QUERY.RISKBREAKER)).toBe(true);
    expect(riskbreakerSpikeQueryMatches("?x=1&riskbreaker=1")).toBe(true);
    expect(riskbreakerSpikeQueryMatches("?riskbreaker=10")).toBe(false);
  });

  it("uses QUERY.DEBUG for debug flag", () => {
    expect(queryParamEnabled(`?${QUERY.DEBUG}=1`, QUERY.DEBUG)).toBe(true);
    expect(riskbreakerDebugQueryMatches(`?${QUERY.DEBUG}=1`)).toBe(true);
    expect(riskbreakerDebugQueryMatches("")).toBe(false);
  });

  it("readInternalScaleFactor defaults to 3 and clamps 2..5", () => {
    writeInternalScaleFactor(3);
    expect(readInternalScaleFactor()).toBe(3);
    writeInternalScaleFactor(5);
    expect(readInternalScaleFactor()).toBe(5);
    writeInternalScaleFactor(99);
    expect(readInternalScaleFactor()).toBe(5);
    writeInternalScaleFactor(1);
    expect(readInternalScaleFactor()).toBe(2);
  });
});
