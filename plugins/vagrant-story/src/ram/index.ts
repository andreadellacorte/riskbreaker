/**
 * @riskbreaker/plugin-vagrant-story — RAM abstraction library
 *
 * Entry point. Re-exports all public surface:
 *   - VagrantStoryRam  — top-level OO access layer
 *   - battleEngine     — battle engine code address constants
 *   - decodeVsString   — VS charset (TBL) string decoder
 *   - readEquipData    — equip_data struct reader
 *   - readSkillData    — skill struct reader
 *   - readActorData    — actor_data struct reader
 *   - MATERIAL_NAMES   — material index → name lookup
 *   - addresses        — all raw RAM address constants
 */

export { VagrantStoryRam, battleEngine, readItemName } from "./vs-ram.js";
export type { PeekFn, AshleyMode } from "./vs-ram.js";
export type { EquipData, SkillData, ActorData, SkillType, StatsCostType, ActorStats } from "./structs.js";
export { readEquipData, readSkillData, readActorData, MATERIAL_NAMES, EQUIP_DATA_SIZE, SKILL_DATA_SIZE } from "./structs.js";
export { decodeVsString } from "./tbl.js";
export * as addresses from "./addresses.js";
export { toPhysical } from "./addresses.js";
