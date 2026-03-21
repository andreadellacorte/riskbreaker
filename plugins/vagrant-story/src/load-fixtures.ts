import type { CommandPlan, GameManifest, GameSnapshot, RuntimeSnapshot, ViewModel } from "@riskbreaker/shared-types";

import commandPlanEquip from "./fixtures/command-plan-equip.json" with { type: "json" };
import commandPlanSort from "./fixtures/command-plan-sort.json" with { type: "json" };
import gameSnapshotFixture from "./fixtures/game-snapshot.json" with { type: "json" };
import manifestFixture from "./fixtures/manifest.json" with { type: "json" };
import runtimeSnapshotFixture from "./fixtures/runtime-snapshot.json" with { type: "json" };
import viewModelInventory from "./fixtures/view-model-inventory.json" with { type: "json" };

export function getFixtureManifest(): GameManifest {
  return manifestFixture as GameManifest;
}

export function getFixtureRuntimeSnapshot(): RuntimeSnapshot {
  return runtimeSnapshotFixture as RuntimeSnapshot;
}

export function getFixtureGameSnapshot(): GameSnapshot {
  return gameSnapshotFixture as GameSnapshot;
}

export function getFixtureInventoryViewModel(): ViewModel {
  return viewModelInventory as ViewModel;
}

export function getFixtureCommandPlanEquip(): CommandPlan {
  return commandPlanEquip as CommandPlan;
}

export function getFixtureCommandPlanSort(): CommandPlan {
  return commandPlanSort as CommandPlan;
}
