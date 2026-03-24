/**
 * VagrantStoryRam — OO access layer over the PS1 memory map.
 *
 * Usage:
 *   const ram = new VagrantStoryRam(peekFn);
 *   const hp  = await ram.ashley.hpCur();
 *   const wpn = await ram.ashley.equippedWeapon.blade();
 *
 * All methods return Promises because reads go to the emulator worker.
 * Pass the emulator's `peek(address, length): Promise<Uint8Array>` as
 * the constructor argument.
 *
 * Addresses follow the US version (SLUS-010.40).
 * Source: https://datacrystal.tcrf.net/wiki/Vagrant_Story/RAM_map
 */

import {
  toPhysical,
  ADDR_ASHLEY_MODE,
  ADDR_ASHLEY_WEAPON_CAT,
  ADDR_ASHLEY_NAME,
  ADDR_ASHLEY_HP_CUR,
  ADDR_ASHLEY_HP_MAX,
  ADDR_ASHLEY_MP_CUR,
  ADDR_ASHLEY_MP_MAX,
  ADDR_ASHLEY_RISK,
  ADDR_ASHLEY_STR_EQ,
  ADDR_ASHLEY_STR_BASE,
  ADDR_ASHLEY_INT_EQ,
  ADDR_ASHLEY_INT_BASE,
  ADDR_ASHLEY_AGL_EQ,
  ADDR_ASHLEY_AGL_BASE,
  ADDR_ASHLEY_RANGE,
  ADDR_ASHLEY_EFFECTS,
  ADDR_ASHLEY_X,
  ADDR_ASHLEY_Y,
  ADDR_ASHLEY_Z,
  ADDR_ASHLEY_STATE,
  ADDR_ASHLEY_FACING,
  ADDR_ASHLEY_SPEED,
  ADDR_WEAPON_NAME,
  ADDR_EQUIP_WEAPON_BLADE,
  ADDR_EQUIP_WEAPON_GRIP,
  ADDR_EQUIP_WEAPON_GEM1,
  ADDR_EQUIP_WEAPON_GEM2,
  ADDR_EQUIP_WEAPON_GEM3,
  ADDR_EQUIP_SHIELD,
  ADDR_EQUIP_SHIELD_GEM1,
  ADDR_EQUIP_SHIELD_GEM2,
  ADDR_EQUIP_SHIELD_GEM3,
  ADDR_EQUIP_ACCESSORY,
  ADDR_EQUIP_ARM_RIGHT,
  ADDR_EQUIP_ARM_LEFT,
  ADDR_EQUIP_HELM,
  ADDR_EQUIP_BREASTPLATE,
  ADDR_EQUIP_LEGGINGS,
  ADDR_ACTOR_LIST_HEAD,
  ADDR_ZONE_ID,
  ADDR_ROOM_ID,
  ADDR_SKILLS_TABLE,
  CODE_LIST_WEAPON,
  CODE_LIST_SHIELD,
  CODE_LIST_ARMOUR,
  CODE_LIST_ACCESSORY,
  CODE_DROP_WEAPON,
  CODE_DROP_SHIELD,
  CODE_DROP_ARMOUR,
  CODE_DROP_ACCESSORY,
  CODE_DROP_ITEM_ALWAYS,
  CODE_DROP_ITEM_RANDOM,
  CODE_DROP_MAIN,
  CODE_KILL_CHARACTER,
  CODE_ENTER_MENU,
  CODE_EXIT_MENU,
  CODE_LAUNCH_ATTACK,
  CODE_USE_ITEM,
  CODE_CAST_SPELL,
  CODE_BATTLE_ENGINE_MAIN,
  CODE_REPLENISH,
} from "./addresses.js";

import {
  readEquipData,
  readSkillData,
  readActorData,
  EQUIP_DATA_SIZE,
  SKILL_DATA_SIZE,
  ACTOR_DATA_MIN_SIZE,
  type EquipData,
  type SkillData,
  type ActorData,
} from "./structs.js";

import { decodeVsString } from "./tbl.js";

// ── Peek function type ────────────────────────────────────────────────────────

/** Function that reads `length` bytes from physical PS1 RAM at `address`. */
export type PeekFn = (address: number, length: number) => Promise<Uint8Array>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function u16(b: Uint8Array, off = 0): number {
  return (b[off] ?? 0) | ((b[off + 1] ?? 0) << 8);
}

// ── EquippedItems sub-object ──────────────────────────────────────────────────

export class EquippedItems {
  constructor(private readonly peek: PeekFn) {}

  private async readEquip(virt: number): Promise<EquipData> {
    const b = await this.peek(toPhysical(virt), EQUIP_DATA_SIZE);
    return readEquipData(b);
  }

  /** Weapon name as a decoded string ($18-byte VS encoding). */
  async weaponName(): Promise<string> {
    const b = await this.peek(toPhysical(ADDR_WEAPON_NAME), 0x18);
    return decodeVsString(b, 0x18);
  }

  /** Weapon blade equip_data. */
  async weaponBlade(): Promise<EquipData> { return this.readEquip(ADDR_EQUIP_WEAPON_BLADE); }
  /** Weapon grip equip_data. */
  async weaponGrip():  Promise<EquipData> { return this.readEquip(ADDR_EQUIP_WEAPON_GRIP); }
  /** Weapon gem slot 1 equip_data. */
  async weaponGem1():  Promise<EquipData> { return this.readEquip(ADDR_EQUIP_WEAPON_GEM1); }
  /** Weapon gem slot 2 equip_data. */
  async weaponGem2():  Promise<EquipData> { return this.readEquip(ADDR_EQUIP_WEAPON_GEM2); }
  /** Weapon gem slot 3 equip_data. */
  async weaponGem3():  Promise<EquipData> { return this.readEquip(ADDR_EQUIP_WEAPON_GEM3); }

  /** Shield equip_data. */
  async shield():      Promise<EquipData> { return this.readEquip(ADDR_EQUIP_SHIELD); }
  /** Shield gem slot 1 equip_data. */
  async shieldGem1():  Promise<EquipData> { return this.readEquip(ADDR_EQUIP_SHIELD_GEM1); }
  /** Shield gem slot 2 equip_data. */
  async shieldGem2():  Promise<EquipData> { return this.readEquip(ADDR_EQUIP_SHIELD_GEM2); }
  /** Shield gem slot 3 equip_data. */
  async shieldGem3():  Promise<EquipData> { return this.readEquip(ADDR_EQUIP_SHIELD_GEM3); }

  /** Accessory equip_data. */
  async accessory():   Promise<EquipData> { return this.readEquip(ADDR_EQUIP_ACCESSORY); }
  /** Right arm armour equip_data. */
  async armRight():    Promise<EquipData> { return this.readEquip(ADDR_EQUIP_ARM_RIGHT); }
  /** Left arm armour equip_data. */
  async armLeft():     Promise<EquipData> { return this.readEquip(ADDR_EQUIP_ARM_LEFT); }
  /** Helm equip_data. */
  async helm():        Promise<EquipData> { return this.readEquip(ADDR_EQUIP_HELM); }
  /** Breastplate equip_data. */
  async breastplate(): Promise<EquipData> { return this.readEquip(ADDR_EQUIP_BREASTPLATE); }
  /** Leggings equip_data. */
  async leggings():    Promise<EquipData> { return this.readEquip(ADDR_EQUIP_LEGGINGS); }
}

// ── Ashley object ─────────────────────────────────────────────────────────────

export type AshleyMode = "normal" | "battle";

export class Ashley {
  /** Equipped items sub-object. */
  readonly equip: EquippedItems;

  constructor(private readonly peek: PeekFn) {
    this.equip = new EquippedItems(peek);
  }

  private async u8at(virt: number): Promise<number> {
    const b = await this.peek(toPhysical(virt), 1);
    return b[0] ?? 0;
  }

  private async u16at(virt: number): Promise<number> {
    const b = await this.peek(toPhysical(virt), 2);
    return u16(b);
  }

  /** Current mode: "normal" (0) or "battle" (1). */
  async mode(): Promise<AshleyMode> {
    return (await this.u8at(ADDR_ASHLEY_MODE)) === 1 ? "battle" : "normal";
  }

  /** Equipped weapon category ID. */
  async weaponCategoryId(): Promise<number> { return this.u8at(ADDR_ASHLEY_WEAPON_CAT); }

  /** Ashley's name (decoded from VS encoding). */
  async name(): Promise<string> {
    const b = await this.peek(toPhysical(ADDR_ASHLEY_NAME), 0x18);
    return decodeVsString(b, 0x18);
  }

  /** Current HP. */
  async hpCur(): Promise<number> { return this.u16at(ADDR_ASHLEY_HP_CUR); }
  /** Maximum HP. */
  async hpMax(): Promise<number> { return this.u16at(ADDR_ASHLEY_HP_MAX); }
  /** Current MP. */
  async mpCur(): Promise<number> { return this.u16at(ADDR_ASHLEY_MP_CUR); }
  /** Maximum MP. */
  async mpMax(): Promise<number> { return this.u16at(ADDR_ASHLEY_MP_MAX); }
  /** RISK value. */
  async risk():  Promise<number> { return this.u16at(ADDR_ASHLEY_RISK); }

  /** STR after equipment bonuses. */
  async strEquipped(): Promise<number> { return this.u16at(ADDR_ASHLEY_STR_EQ); }
  /** Base STR (without equipment). */
  async strBase(): Promise<number>     { return this.u16at(ADDR_ASHLEY_STR_BASE); }
  /** INT after equipment bonuses. */
  async intEquipped(): Promise<number> { return this.u16at(ADDR_ASHLEY_INT_EQ); }
  /** Base INT. */
  async intBase(): Promise<number>     { return this.u16at(ADDR_ASHLEY_INT_BASE); }
  /** AGL after equipment bonuses. */
  async aglEquipped(): Promise<number> { return this.u16at(ADDR_ASHLEY_AGL_EQ); }
  /** Base AGL. */
  async aglBase(): Promise<number>     { return this.u16at(ADDR_ASHLEY_AGL_BASE); }

  /** Movement range stat. */
  async range(): Promise<number> { return this.u8at(ADDR_ASHLEY_RANGE); }

  /** Active status effects (32-bit bitmask). */
  async effectsMask(): Promise<number> {
    const b = await this.peek(toPhysical(ADDR_ASHLEY_EFFECTS), 4);
    return (u16(b, 2) << 16) | u16(b, 0);
  }

  /** World X coordinate. */
  async x(): Promise<number> { return this.u16at(ADDR_ASHLEY_X); }
  /** World Y coordinate. */
  async y(): Promise<number> { return this.u16at(ADDR_ASHLEY_Y); }
  /** World Z coordinate (jump height). */
  async z(): Promise<number> { return this.u16at(ADDR_ASHLEY_Z); }
  /** Current movement/action state. */
  async state(): Promise<number> { return this.u16at(ADDR_ASHLEY_STATE); }
  /** Facing direction. */
  async facing(): Promise<number> { return this.u8at(ADDR_ASHLEY_FACING); }
  /** Current speed. */
  async speed(): Promise<number> { return this.u16at(ADDR_ASHLEY_SPEED); }

  /**
   * Convenience: read all vital stats in a single batch peek for efficiency.
   */
  async vitals(): Promise<{ hpCur: number; hpMax: number; mpCur: number; mpMax: number; risk: number }> {
    // ADDR_ASHLEY_HP_CUR … ADDR_ASHLEY_RISK are 5 consecutive u16LE values
    const b = await this.peek(toPhysical(ADDR_ASHLEY_HP_CUR), 10);
    return {
      hpCur: u16(b, 0),
      hpMax: u16(b, 2),
      mpCur: u16(b, 4),
      mpMax: u16(b, 6),
      risk:  u16(b, 8),
    };
  }
}

// ── Room object ───────────────────────────────────────────────────────────────

export class CurrentRoom {
  constructor(private readonly peek: PeekFn) {}

  /** Current zone ID. */
  async zoneId(): Promise<number> {
    const b = await this.peek(toPhysical(ADDR_ZONE_ID), 1);
    return b[0] ?? 0;
  }

  /** Current room ID within the zone. */
  async roomId(): Promise<number> {
    const b = await this.peek(toPhysical(ADDR_ROOM_ID), 1);
    return b[0] ?? 0;
  }
}

// ── Actor list ────────────────────────────────────────────────────────────────

export class ActorList {
  constructor(private readonly peek: PeekFn) {}

  /**
   * Read the first actor in the linked list, or null if the room has no actors.
   */
  async first(): Promise<ActorData | null> {
    const ptrBytes = await this.peek(toPhysical(ADDR_ACTOR_LIST_HEAD), 4);
    const ptr = (u16(ptrBytes, 2) << 16) | u16(ptrBytes, 0);
    if (!ptr) return null;
    const b = await this.peek(toPhysical(ptr), ACTOR_DATA_MIN_SIZE);
    return readActorData(b);
  }

  /**
   * Read up to `limit` actors from the linked list.
   * Follows `nextPtr` pointers until 0 or the limit is reached.
   */
  async all(limit = 32): Promise<ActorData[]> {
    const results: ActorData[] = [];
    const ptrBytes = await this.peek(toPhysical(ADDR_ACTOR_LIST_HEAD), 4);
    let ptr = (u16(ptrBytes, 2) << 16) | u16(ptrBytes, 0);
    while (ptr && results.length < limit) {
      const b = await this.peek(toPhysical(ptr), ACTOR_DATA_MIN_SIZE);
      const actor = readActorData(b);
      results.push(actor);
      ptr = actor.nextPtr;
    }
    return results;
  }
}

// ── Skills table ──────────────────────────────────────────────────────────────

export class SkillsTable {
  constructor(private readonly peek: PeekFn) {}

  /** Read one skill entry by index (0–255). */
  async get(index: number): Promise<SkillData> {
    const addr = ADDR_SKILLS_TABLE + index * SKILL_DATA_SIZE;
    const b = await this.peek(toPhysical(addr), SKILL_DATA_SIZE);
    return readSkillData(b);
  }

  /** Read all 256 skills. */
  async all(): Promise<SkillData[]> {
    const b = await this.peek(toPhysical(ADDR_SKILLS_TABLE), 256 * SKILL_DATA_SIZE);
    return Array.from({ length: 256 }, (_, i) =>
      readSkillData(b.subarray(i * SKILL_DATA_SIZE, (i + 1) * SKILL_DATA_SIZE))
    );
  }
}

// ── Battle Engine — code addresses ───────────────────────────────────────────

/**
 * Named code addresses for the battle engine.
 * These are not readable RAM data; they are function entry points
 * in the PS1 executable. Useful for debugging, patching, or
 * code-connect documentation.
 */
export const battleEngine = Object.freeze({
  listWeapon:    CODE_LIST_WEAPON,
  listShield:    CODE_LIST_SHIELD,
  listArmour:    CODE_LIST_ARMOUR,
  listAccessory: CODE_LIST_ACCESSORY,
  dropWeapon:    CODE_DROP_WEAPON,
  dropShield:    CODE_DROP_SHIELD,
  dropArmour:    CODE_DROP_ARMOUR,
  dropAccessory: CODE_DROP_ACCESSORY,
  dropItemAlways:CODE_DROP_ITEM_ALWAYS,
  dropItemRandom:CODE_DROP_ITEM_RANDOM,
  dropMain:      CODE_DROP_MAIN,
  killCharacter: CODE_KILL_CHARACTER,
  enterMenu:     CODE_ENTER_MENU,
  exitMenu:      CODE_EXIT_MENU,
  launchAttack:  CODE_LAUNCH_ATTACK,
  useItem:       CODE_USE_ITEM,
  castSpell:     CODE_CAST_SPELL,
  main:          CODE_BATTLE_ENGINE_MAIN,
  replenish:     CODE_REPLENISH,
} as const);

// ── VagrantStoryRam — top-level entry point ───────────────────────────────────

/**
 * OO access layer for Vagrant Story (US, SLUS-010.40) live RAM.
 *
 * @example
 * ```ts
 * import { VagrantStoryRam } from "./ram/vs-ram.js";
 *
 * const ram = new VagrantStoryRam(emulatorHost.peek);
 *
 * const { hpCur, hpMax, mpCur, mpMax, risk } = await ram.ashley.vitals();
 * const weaponName = await ram.ashley.equip.weaponName();
 * const blade      = await ram.ashley.equip.weaponBlade();
 * console.log(`${blade.materialName} blade — DP ${blade.dpCur}/${blade.dpMax}`);
 *
 * const mode    = await ram.ashley.mode();    // "normal" | "battle"
 * const actors  = await ram.actors.all();
 * const skills  = await ram.skills.all();
 * const zoneId  = await ram.room.zoneId();
 *
 * // Code address (not a RAM read):
 * console.log(ram.battleEngine.listWeapon.toString(16)); // "6b8c0"
 * ```
 */
export class VagrantStoryRam {
  /** Ashley Riot's character data and equipped items. */
  readonly ashley: Ashley;
  /** Current room / zone. */
  readonly room: CurrentRoom;
  /** Linked list of actors present in the current room. */
  readonly actors: ActorList;
  /** The 256-entry skills table. */
  readonly skills: SkillsTable;
  /** Battle engine code addresses (constants, not RAM reads). */
  readonly battleEngine: typeof battleEngine;

  constructor(peek: PeekFn) {
    this.ashley      = new Ashley(peek);
    this.room        = new CurrentRoom(peek);
    this.actors      = new ActorList(peek);
    this.skills      = new SkillsTable(peek);
    this.battleEngine = battleEngine;
  }
}
