/**
 * Typed readers for Vagrant Story data structures.
 *
 * Source: https://datacrystal.tcrf.net/wiki/Vagrant_Story/Data_Structures
 *
 * All structs are read from a Uint8Array slice starting at offset 0
 * relative to the struct's base address in RAM.
 */

import { decodeVsString } from "./tbl.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function u8(b: Uint8Array, off: number): number {
  return b[off] ?? 0;
}

function u16(b: Uint8Array, off: number): number {
  return (b[off] ?? 0) | ((b[off + 1] ?? 0) << 8);
}

function i8(b: Uint8Array, off: number): number {
  const v = b[off] ?? 0;
  return v >= 0x80 ? v - 0x100 : v;
}

function i8arr(b: Uint8Array, off: number, len: number): number[] {
  return Array.from({ length: len }, (_, i) => i8(b, off + i));
}

// ── Material lookup ────────────────────────────────────────────────────────────

export const MATERIAL_NAMES: Readonly<Record<number, string>> = {
  0x00: "—",
  0x01: "Leather",
  0x02: "Fur",
  0x03: "Bronze",
  0x04: "Iron",
  0x05: "Silver",
  0x06: "Gold",
  0x07: "Mythril",
  0x08: "Hagane",
  0x09: "Damascus",
  0x0a: "Wood",
  0x0b: "Heavy",
};

// ── equip_data ($30 bytes) ────────────────────────────────────────────────────

/** Stats cost type for a weapon blade. */
export type StatsCostType = "MP" | "RISK" | "HP" | "PP" | "nothing" | "unknown";

const STATS_COST_MAP: Record<number, StatsCostType> = {
  1: "MP", 2: "RISK", 3: "HP", 4: "PP", 5: "nothing",
};

export interface EquipData {
  /** Index into the item-names list. */
  itemNameIndex: number;
  /** Index into the item-type specific items list. */
  itemListIndex: number;
  /** WEP file index. */
  wepFile: number;
  /** Item category byte. */
  category: number;
  /** STR modifier (signed). */
  str: number;
  /** INT modifier (signed). */
  int: number;
  /** AGI modifier (signed). */
  agi: number;
  /** Current DP (stored as DP×100). */
  dpCurRaw: number;
  /** Current DP (divided by 100). */
  dpCur: number;
  /** Maximum DP (stored as DP×100). */
  dpMaxRaw: number;
  /** Maximum DP (divided by 100). */
  dpMax: number;
  /** Current PP. */
  ppCur: number;
  /** Maximum PP. */
  ppMax: number;
  /** Damage type byte (blades). */
  damageType: number;
  /** Stats cost type (blades). */
  statsCost: StatsCostType;
  /** Cost value. */
  costValue: number;
  /** Material index. */
  materialIndex: number;
  /** Material name string. */
  materialName: string;
  /** Number of gem slots (shields/grips). */
  gemSlots: number;
  /** Gem special effects byte. */
  gemEffects: number;
  /** Index in Ashley's equipment list (RAM only). */
  equipListIndex: number;
  /** Class affinities (6 × i8): Human, Undead, Beast, Evil, Phantom, Dragon. */
  classes: number[];
  /** Type affinities (7 × i8): Blunt, Edged, Piercing, Projectile, Fire, Air, Earth. */
  types: number[];
  /** Raw bytes (full $30-byte block). */
  raw: Uint8Array;
  /** True if this slot is populated (not all-zero). */
  equipped: boolean;
}

export function readEquipData(b: Uint8Array): EquipData {
  const dpCurRaw = u16(b, 0x08);
  const dpMaxRaw = u16(b, 0x0a);
  const mat      = u8(b, 0x13);
  return {
    itemNameIndex: u16(b, 0x00),
    itemListIndex: u8(b, 0x02),
    wepFile:       u8(b, 0x03),
    category:      u8(b, 0x04),
    str:           i8(b, 0x05),
    int:           i8(b, 0x06),
    agi:           i8(b, 0x07),
    dpCurRaw,
    dpCur:         Math.round(dpCurRaw / 100),
    dpMaxRaw,
    dpMax:         Math.round(dpMaxRaw / 100),
    ppCur:         u16(b, 0x0c),
    ppMax:         u16(b, 0x0e),
    damageType:    u8(b, 0x10),
    statsCost:     STATS_COST_MAP[u8(b, 0x11)] ?? "unknown",
    costValue:     u8(b, 0x12),
    materialIndex: mat,
    materialName:  MATERIAL_NAMES[mat] ?? "—",
    gemSlots:      u8(b, 0x15),
    gemEffects:    u8(b, 0x16),
    equipListIndex:u8(b, 0x17),
    classes:       i8arr(b, 0x20, 6),
    types:         i8arr(b, 0x1d, 3).concat(i8arr(b, 0x28, 4)),
    raw:           b.slice(0, 0x30),
    equipped:      b.subarray(0, 0x30).some(v => v !== 0),
  };
}

export const EQUIP_DATA_SIZE = 0x30;

// ── skill ($34 bytes) ─────────────────────────────────────────────────────────

export type SkillType =
  | "spell"
  | "battle_ability"
  | "break_art"
  | "unused_pp"
  | "item_effect"
  | "normal"
  | "trap"
  | "unknown";

const SKILL_TYPE_MAP: Record<number, SkillType> = {
  1: "spell", 2: "battle_ability", 3: "break_art",
  4: "unused_pp", 5: "item_effect", 6: "normal", 7: "trap",
};

export interface SkillData {
  /** Index into the skills list. */
  skillListIndex: number;
  /** Type of skill (spell / battle ability / break art / …). */
  type: SkillType;
  /** Targeting parameters nibble. */
  targeting: number;
  /** Cost (MP / RISK / HP depending on type). */
  cost: number;
  /** Name decoded from VS charset ($18 bytes). */
  name: string;
  /** Whether this skill has been learned. */
  learned: boolean;
  /** Raw bytes. */
  raw: Uint8Array;
}

export const SKILL_DATA_SIZE = 0x34;

export function readSkillData(b: Uint8Array): SkillData {
  const typeByte = u8(b, 0x02);
  return {
    skillListIndex: u8(b, 0x00),
    type:           SKILL_TYPE_MAP[(typeByte >> 1) & 0x07] ?? "unknown",
    targeting:      (typeByte >> 4) & 0x0f,
    cost:           u8(b, 0x03),
    name:           decodeVsString(b.subarray(0x1c, 0x1c + 0x18)),
    learned:        (u8(b, 0x0c) & 0x80) !== 0,
    raw:            b.slice(0, SKILL_DATA_SIZE),
  };
}

// ── actor_data (variable-size, linked list) ───────────────────────────────────

export interface ActorStats {
  hpCur: number;
  hpMax: number;
  mpCur: number;
  mpMax: number;
  risk:  number;
  strBase: number;
  strEq:   number;
  intBase: number;
  intEq:   number;
  aglBase: number;
  aglEq:   number;
}

export interface ActorData {
  /** PS1 virtual address of the next actor in the list, 0 if none. */
  nextPtr: number;
  /** X coordinate. */
  x: number;
  /** Y coordinate. */
  y: number;
  /** Actor name (VS-encoded). */
  name: string;
  stats: ActorStats;
  /** equip_data for the actor's weapon blade. */
  weaponBlade: EquipData;
  /** equip_data for the actor's shield. */
  shield: EquipData;
}

// Offsets from the start of an actor_data block
const ACTOR_OFFSET_NEXT   = 0x00;
const ACTOR_OFFSET_X      = 0x2c;
const ACTOR_OFFSET_Y      = 0x2e;
const ACTOR_OFFSET_NAME   = 0x50; // 24-byte VS-encoded string
const ACTOR_OFFSET_HP_CUR = 0x68;
const ACTOR_OFFSET_HP_MAX = 0x6a;
const ACTOR_OFFSET_MP_CUR = 0x6c;
const ACTOR_OFFSET_MP_MAX = 0x6e;
const ACTOR_OFFSET_RISK   = 0x70;
const ACTOR_OFFSET_STR_BASE = 0x72;
const ACTOR_OFFSET_STR_EQ   = 0x74;
const ACTOR_OFFSET_INT_BASE = 0x76;
const ACTOR_OFFSET_INT_EQ   = 0x78;
const ACTOR_OFFSET_AGL_BASE = 0x7a;
const ACTOR_OFFSET_AGL_EQ   = 0x7c;
const ACTOR_OFFSET_BLADE  = 0xa4;
const ACTOR_OFFSET_SHIELD = 0x23c;

export const ACTOR_DATA_MIN_SIZE = ACTOR_OFFSET_SHIELD + EQUIP_DATA_SIZE;

export function readActorData(b: Uint8Array): ActorData {
  return {
    nextPtr: (u16(b, 0x02) << 16) | u16(b, 0x00),
    x:       u16(b, ACTOR_OFFSET_X),
    y:       u16(b, ACTOR_OFFSET_Y),
    name:    decodeVsString(b.subarray(ACTOR_OFFSET_NAME, ACTOR_OFFSET_NAME + 24)),
    stats: {
      hpCur:   u16(b, ACTOR_OFFSET_HP_CUR),
      hpMax:   u16(b, ACTOR_OFFSET_HP_MAX),
      mpCur:   u16(b, ACTOR_OFFSET_MP_CUR),
      mpMax:   u16(b, ACTOR_OFFSET_MP_MAX),
      risk:    u16(b, ACTOR_OFFSET_RISK),
      strBase: u16(b, ACTOR_OFFSET_STR_BASE),
      strEq:   u16(b, ACTOR_OFFSET_STR_EQ),
      intBase: u16(b, ACTOR_OFFSET_INT_BASE),
      intEq:   u16(b, ACTOR_OFFSET_INT_EQ),
      aglBase: u16(b, ACTOR_OFFSET_AGL_BASE),
      aglEq:   u16(b, ACTOR_OFFSET_AGL_EQ),
    },
    weaponBlade: readEquipData(b.subarray(ACTOR_OFFSET_BLADE)),
    shield:      readEquipData(b.subarray(ACTOR_OFFSET_SHIELD)),
  };
}
