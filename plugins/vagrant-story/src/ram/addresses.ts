/**
 * Vagrant Story RAM addresses — US version (SLUS-010.40).
 *
 * Source: https://datacrystal.tcrf.net/wiki/Vagrant_Story/RAM_map
 *
 * All addresses are PS1 virtual addresses (0x8011xxxx form).
 * To convert to the physical offset used by the emulator peek API:
 *   physical = virtual & 0x1fffff
 */

// ── Room / warp ──────────────────────────────────────────────────────────────

/** Write 0x02 here to trigger a room load. */
export const ADDR_TRIGGER_LOAD_ROOM = 0x800f1a48;
/** Zone ID (see Rooms List). */
export const ADDR_ZONE_ID           = 0x800f1ab0;
/** Room ID within the zone. */
export const ADDR_ROOM_ID           = 0x800f1ab1;
/** Non-zero while a fade-to-black room transition is in progress. */
export const ADDR_FADE_ROOM         = 0x800f1aa0;

// ── Static data tables ───────────────────────────────────────────────────────

/** 256 × $34-byte skill records. */
export const ADDR_SKILLS_TABLE      = 0x8004b9dc;
/** 64-byte bit-field of map tracking flags. */
export const ADDR_MAP_FLAGS         = 0x80060f68; // also 0x800e8508
/** Gadget Bag misc items ($100 bytes). */
export const ADDR_GADGET_BAG        = 0x80060f68;
/** 64 × 1-byte chest tracking flags. */
export const ADDR_CHEST_FLAGS       = 0x80061958;

// ── Ashley Riot character data (base: 0x8011FA10) ────────────────────────────

/** Base address of Ashley Riot's character data block. */
export const ADDR_ASHLEY_BASE       = 0x8011fa10;

/** 0 = Normal mode, 1 = Battle mode. u8 */
export const ADDR_ASHLEY_MODE       = 0x8011fa10;
/** ID of the equipped weapon category. u8 */
export const ADDR_ASHLEY_WEAPON_CAT = 0x8011fa15;

/** Pointer to Ashley's name string. u32 */
export const ADDR_ASHLEY_PTR_NAME   = 0x8011fa2c;
/** Ashley's name as a fixed 0x18-byte VS-encoded string. */
export const ADDR_ASHLEY_NAME       = 0x8011fa40;

/** Current HP. u16LE */
export const ADDR_ASHLEY_HP_CUR     = 0x8011fa58;
/** Maximum HP. u16LE */
export const ADDR_ASHLEY_HP_MAX     = 0x8011fa5a;
/** Current MP. u16LE */
export const ADDR_ASHLEY_MP_CUR     = 0x8011fa5c;
/** Maximum MP. u16LE */
export const ADDR_ASHLEY_MP_MAX     = 0x8011fa5e;
/** RISK value. u16LE */
export const ADDR_ASHLEY_RISK       = 0x8011fa60;

/** STR after equipment bonuses. u16LE */
export const ADDR_ASHLEY_STR_EQ     = 0x8011fa62;
/** Base STR. u16LE */
export const ADDR_ASHLEY_STR_BASE   = 0x8011fa64;
/** INT after equipment bonuses. u16LE */
export const ADDR_ASHLEY_INT_EQ     = 0x8011fa66;
/** Base INT. u16LE */
export const ADDR_ASHLEY_INT_BASE   = 0x8011fa68;
/** AGL after equipment bonuses. u16LE */
export const ADDR_ASHLEY_AGL_EQ     = 0x8011fa6a;
/** Base AGL. u16LE */
export const ADDR_ASHLEY_AGL_BASE   = 0x8011fa6c;

/** Movement range stat. u8 */
export const ADDR_ASHLEY_RANGE      = 0x8011fa78;

/** Active status effects (bit mask). u32 */
export const ADDR_ASHLEY_EFFECTS    = 0x80120388;
/** Status effect timers. */
export const ADDR_ASHLEY_EFFECTS_T  = 0x8012038c;

/** World X coordinate. u16LE */
export const ADDR_ASHLEY_X          = 0x801203c0;
/** World Z coordinate (jump height). u16LE */
export const ADDR_ASHLEY_Z          = 0x801203c2;
/** World Y coordinate. u16LE */
export const ADDR_ASHLEY_Y          = 0x801203c4;
/** Current movement/action state (standing/jumping/climbing…). u16LE */
export const ADDR_ASHLEY_STATE      = 0x801203ae;
/** Facing direction. u8 */
export const ADDR_ASHLEY_FACING     = 0x801203cb;
/** Current speed. u16LE */
export const ADDR_ASHLEY_SPEED      = 0x80121be4;

// ── Ashley equipped items ─────────────────────────────────────────────────────

/** Equipped weapon name ($18-byte VS-encoded string). */
export const ADDR_WEAPON_NAME       = 0x8011fa7c;

/** equip_data for the equipped weapon's blade ($30 bytes). */
export const ADDR_EQUIP_WEAPON_BLADE  = 0x8011fa94;
/** equip_data for the equipped weapon's grip ($30 bytes). */
export const ADDR_EQUIP_WEAPON_GRIP   = 0x8011fac4;
/** equip_data for weapon gem slot 1 ($30 bytes). */
export const ADDR_EQUIP_WEAPON_GEM1   = 0x8011faf4;
/** equip_data for weapon gem slot 2 ($30 bytes). */
export const ADDR_EQUIP_WEAPON_GEM2   = 0x8011fb24;
/** equip_data for weapon gem slot 3 ($30 bytes). */
export const ADDR_EQUIP_WEAPON_GEM3   = 0x8011fb54;

/** equip_data for the equipped shield ($30 bytes). */
export const ADDR_EQUIP_SHIELD        = 0x8011fc2c;
/** equip_data for shield gem slot 1 ($30 bytes). */
export const ADDR_EQUIP_SHIELD_GEM1   = 0x8011fc5c;
/** equip_data for shield gem slot 2 ($30 bytes). */
export const ADDR_EQUIP_SHIELD_GEM2   = 0x8011fc8c;
/** equip_data for shield gem slot 3 ($30 bytes). */
export const ADDR_EQUIP_SHIELD_GEM3   = 0x8011fcbc;

/** equip_data for the equipped accessory ($30 bytes). */
export const ADDR_EQUIP_ACCESSORY     = 0x8011fd78;
/** equip_data for right arm armour ($30 bytes). */
export const ADDR_EQUIP_ARM_RIGHT     = 0x8011fed4;
/** equip_data for left arm armour ($30 bytes). */
export const ADDR_EQUIP_ARM_LEFT      = 0x8011fdf8;
/** equip_data for helm ($30 bytes). */
export const ADDR_EQUIP_HELM          = 0x8011ffb0;
/** equip_data for breastplate ($30 bytes). */
export const ADDR_EQUIP_BREASTPLATE   = 0x8012008c;
/** equip_data for leggings ($30 bytes). */
export const ADDR_EQUIP_LEGGINGS      = 0x80120168;

// ── Actor list ───────────────────────────────────────────────────────────────

/** Pointer to the first actor_data node in the linked list. u32 */
export const ADDR_ACTOR_LIST_HEAD   = 0x8011f9f0;

// ── Battle Engine — code addresses (not readable data) ──────────────────────

/** Code: adds a blade to the enemy drop list. */
export const CODE_ADD_BLADE_TO_DROP   = 0x8006b57c;
/** Code: adds a grip to the enemy drop list. */
export const CODE_ADD_GRIP_TO_DROP    = 0x8006b6ac;
/** Code: adds a gem to the enemy drop list. */
export const CODE_ADD_GEM_TO_DROP     = 0x8006b728;
/** Code: adds armour (shields, accessories) to the enemy drop list. */
export const CODE_ADD_ARMOUR_TO_DROP  = 0x8006b7bc;
/** Code: ListWeapon — evaluates available weapons. */
export const CODE_LIST_WEAPON         = 0x8006b8c0;
/** Code: ListShield — evaluates available shields. */
export const CODE_LIST_SHIELD         = 0x8006b9e0;
/** Code: ListArmour — evaluates available armour. */
export const CODE_LIST_ARMOUR         = 0x8006baa8;
/** Code: ListAccessory — evaluates available accessories. */
export const CODE_LIST_ACCESSORY      = 0x8006badc;
/** Code: DropWeapon. */
export const CODE_DROP_WEAPON         = 0x8006bb0c;
/** Code: DropShield. */
export const CODE_DROP_SHIELD         = 0x8006bbec;
/** Code: DropArmour. */
export const CODE_DROP_ARMOUR         = 0x8006bcb0;
/** Code: DropAccessory. */
export const CODE_DROP_ACCESSORY      = 0x8006bd14;
/** Code: DropItemAlways. */
export const CODE_DROP_ITEM_ALWAYS    = 0x8006bda0;
/** Code: DropItemRandom. */
export const CODE_DROP_ITEM_RANDOM    = 0x8006bdf0;
/** Code: Main drop routine. */
export const CODE_DROP_MAIN           = 0x8006be64;
/** Code: KillCharacter. */
export const CODE_KILL_CHARACTER      = 0x8006c1cc;
/** Code: EnterMenu. */
export const CODE_ENTER_MENU          = 0x8007357c;
/** Code: ExitMenu. */
export const CODE_EXIT_MENU           = 0x800735f8;
/** Code: ResetCharacterNewGame. */
export const CODE_RESET_CHARACTER     = 0x80076784;
/** Code: LaunchAttack. */
export const CODE_LAUNCH_ATTACK       = 0x800784ac;
/** Code: UseItem. */
export const CODE_USE_ITEM            = 0x80078748;
/** Code: CastSpell. */
export const CODE_CAST_SPELL          = 0x800787f0;
/** Code: Main Battle Engine loop. */
export const CODE_BATTLE_ENGINE_MAIN  = 0x800798a4;
/** Code: ReplenishHPMPRISK. */
export const CODE_REPLENISH           = 0x80088554;

// ── Utility ───────────────────────────────────────────────────────────────────

/**
 * Convert a PS1 virtual address (0x80xxxxxx / 0x00xxxxxx) to the physical
 * offset used by the emulator's peek/poke API (psxM base offset).
 */
export function toPhysical(virtualAddr: number): number {
  return virtualAddr & 0x1fffff;
}
