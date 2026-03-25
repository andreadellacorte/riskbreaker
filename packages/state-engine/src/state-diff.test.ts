import { describe, expect, it } from "vitest";
import { diffGameSnapshots } from "./state-diff.js";
import type { GameSnapshot } from "@riskbreaker/shared-types";

function snap(overrides: Partial<GameSnapshot> = {}): GameSnapshot {
  return {
    runtimeState: null,
    uiState: null,
    inventoryState: null,
    characterState: null,
    worldState: null,
    combatState: null,
    ...overrides,
  } as unknown as GameSnapshot;
}

describe("diffGameSnapshots", () => {
  it("returns empty changedKeys when both are null", () => {
    expect(diffGameSnapshots(null, null).changedKeys).toEqual([]);
  });

  it("returns ['<root>'] when before is null and after is not", () => {
    expect(diffGameSnapshots(null, snap()).changedKeys).toEqual(["<root>"]);
  });

  it("returns ['<root>'] when after is null and before is not", () => {
    expect(diffGameSnapshots(snap(), null).changedKeys).toEqual(["<root>"]);
  });

  it("returns empty changedKeys when snapshots are identical", () => {
    const s = snap({ runtimeState: { status: "running" } as never });
    expect(diffGameSnapshots(s, s).changedKeys).toEqual([]);
  });

  it("detects changed runtimeState", () => {
    const a = snap({ runtimeState: { status: "running" } as never });
    const b = snap({ runtimeState: { status: "paused" } as never });
    expect(diffGameSnapshots(a, b).changedKeys).toContain("runtimeState");
  });

  it("detects changed inventoryState", () => {
    const a = snap({ inventoryState: { items: [] } as never });
    const b = snap({ inventoryState: { items: [1] } as never });
    expect(diffGameSnapshots(a, b).changedKeys).toContain("inventoryState");
  });

  it("detects multiple changed keys", () => {
    const a = snap({ runtimeState: { x: 1 } as never, uiState: { open: false } as never });
    const b = snap({ runtimeState: { x: 2 } as never, uiState: { open: true } as never });
    const { changedKeys } = diffGameSnapshots(a, b);
    expect(changedKeys).toContain("runtimeState");
    expect(changedKeys).toContain("uiState");
  });

  it("does not report unchanged keys", () => {
    const shared = { status: "running" };
    const a = snap({ runtimeState: shared as never, uiState: { open: false } as never });
    const b = snap({ runtimeState: shared as never, uiState: { open: true } as never });
    expect(diffGameSnapshots(a, b).changedKeys).not.toContain("runtimeState");
  });
});
