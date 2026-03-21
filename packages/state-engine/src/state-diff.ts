import type { GameSnapshot } from "@riskbreaker/shared-types";

export type StateDiff = {
  changedKeys: readonly string[];
};

/** Shallow JSON-ish diff of top-level GameSnapshot fields (mocks / devtools). */
export function diffGameSnapshots(
  before: GameSnapshot | null,
  after: GameSnapshot | null,
): StateDiff {
  if (before == null || after == null) {
    return { changedKeys: before === after ? [] : ["<root>"] };
  }
  const keys = [
    "runtimeState",
    "uiState",
    "inventoryState",
    "characterState",
    "worldState",
    "combatState",
  ] as const;
  const changed: string[] = [];
  for (const k of keys) {
    if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) {
      changed.push(k);
    }
  }
  return { changedKeys: changed };
}
