import { describe, expect, it } from "vitest";
import { createMockVagrantStoryDomainPack } from "./mock-domain-pack.js";
import type { GameSnapshot } from "@riskbreaker/shared-types";

function snap(inventoryState: unknown = null): GameSnapshot {
  return { inventoryState } as unknown as GameSnapshot;
}

describe("createMockVagrantStoryDomainPack", () => {
  const pack = createMockVagrantStoryDomainPack();

  it("has the correct id", () => {
    expect(pack.id).toBe("vagrant-story.domain.mock");
  });

  it("returns a view model with no inventory state", () => {
    const vm = pack.mapToViewModel(snap(null));
    expect(vm).toBeDefined();
  });

  it("returns a view model with empty items array", () => {
    const vm = pack.mapToViewModel(snap({ items: [] }));
    expect(vm).toBeDefined();
  });

  it("maps items with count to rows with ×count suffix", () => {
    const vm = pack.mapToViewModel(snap({ items: [{ slot: 0, name: "Potion", count: 3, category: "item" }] })) as Record<string, unknown>;
    const rows = vm.rows as { name: string; detail: string }[];
    expect(rows[0].name).toBe("Potion ×3");
    expect(rows[0].detail).toBe("×3");
  });

  it("maps items with count=1 without suffix", () => {
    const vm = pack.mapToViewModel(snap({ items: [{ slot: 0, name: "Sword", count: 1, category: "weapon" }] })) as Record<string, unknown>;
    const rows = vm.rows as { name: string }[];
    expect(rows[0].name).toBe("Sword");
  });

  it("maps items with durability", () => {
    const vm = pack.mapToViewModel(snap({ items: [{ slot: 1, name: "Shield", durability: 80, category: "armor" }] })) as Record<string, unknown>;
    const rows = vm.rows as { detail: string }[];
    expect(rows[0].detail).toBe("Durability 80");
  });

  it("maps items with neither count nor durability to empty detail", () => {
    const vm = pack.mapToViewModel(snap({ items: [{ slot: 2, name: "Key", category: "misc" }] })) as Record<string, unknown>;
    const rows = vm.rows as { detail: string }[];
    expect(rows[0].detail).toBe("");
  });

  it("uses defaults for missing name, slot, category", () => {
    const vm = pack.mapToViewModel(snap({ items: [{}] })) as Record<string, unknown>;
    const rows = vm.rows as { name: string; slot: number; category: string }[];
    expect(rows[0].name).toBe("?");
    expect(rows[0].slot).toBe(0);
    expect(rows[0].category).toBe("unknown");
  });

  it("maps items with count=0 without suffix", () => {
    const vm = pack.mapToViewModel(snap({ items: [{ slot: 0, name: "Empty", count: 0, category: "item" }] })) as Record<string, unknown>;
    const rows = vm.rows as { name: string; detail: string }[];
    expect(rows[0].name).toBe("Empty");
    expect(rows[0].detail).toBe("×0");
  });

  it("ignores non-array inventoryState.items", () => {
    const vm = pack.mapToViewModel(snap({ items: "bad" }));
    expect(vm).toBeDefined();
  });
});
