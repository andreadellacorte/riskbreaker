/** Normalized game state after plugin decoding (game-specific payloads as unknown). */
export interface GameSnapshot {
  runtimeState: unknown;
  uiState: unknown;
  inventoryState: unknown;
  characterState: unknown;
  worldState: unknown;
  combatState: unknown;
}
