import type { GameSnapshot, ViewModel } from "@riskbreaker/shared-types";
import type { IDomainPack } from "@riskbreaker/plugin-sdk";

import { jsonClone } from "./clone.js";
import { getFixtureInventoryViewModel } from "./load-fixtures.js";

const packId = "vagrant-story.domain.mock";

/** Projects inventory-focused view model; enriches from snapshot when inventory items exist. */
export function createMockVagrantStoryDomainPack(): IDomainPack {
  return {
    id: packId,
    mapToViewModel(snapshot: GameSnapshot): ViewModel {
      const base = jsonClone(getFixtureInventoryViewModel());
      const inv = snapshot.inventoryState as Record<string, unknown> | null | undefined;
      if (inv && Array.isArray(inv.items)) {
        (base as Record<string, unknown>).rows = mapItemsToRows(inv.items as MockInvItem[]);
      }
      return base;
    },
  };
}

type MockInvItem = {
  slot?: number;
  name?: string;
  category?: string;
  count?: number;
  durability?: number;
};

function mapItemsToRows(items: MockInvItem[]): Record<string, unknown>[] {
  return items.map((it) => {
    const detail =
      it.durability != null ? `Durability ${it.durability}` : it.count != null ? `×${it.count}` : "";
    const name = it.count != null && it.count > 1 ? `${it.name ?? "?"} ×${it.count}` : (it.name ?? "?");
    return {
      slot: it.slot ?? 0,
      name,
      category: it.category ?? "unknown",
      detail,
    };
  });
}
