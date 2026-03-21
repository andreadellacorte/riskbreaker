/** User / UX intent — consumed by command engine + plugin command packs. */
export type CommandIntent =
  | { kind: "OpenInventory" }
  | { kind: "EquipItem"; itemId: string }
  | { kind: "SortInventory" }
  | { kind: "ShowComparePanel" };
