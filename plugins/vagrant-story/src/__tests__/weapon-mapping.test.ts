import { describe, expect, test } from "vitest";

type WeaponTypeHand = { type: string; hand: string };

const WEAPON_CAT: Record<number, WeaponTypeHand> = {
  2:  { type: "Edged",    hand: "One-Handed" },
  3:  { type: "Edged",    hand: "Two-Handed" },
  4:  { type: "Edged",    hand: "Two-Handed" },
  5:  { type: "Edged",    hand: "One-Handed" },
  6:  { type: "Blunt",    hand: "One-Handed" },
  7:  { type: "Blunt",    hand: "Two-Handed" },
  8:  { type: "Blunt",    hand: "Two-Handed" },
  9:  { type: "Piercing", hand: "Two-Handed" },
  10: { type: "Piercing", hand: "Two-Handed" },
  11: { type: "Piercing", hand: "Two-Handed" },
  12: { type: "Blunt",    hand: "One-Handed" },
  13: { type: "Piercing", hand: "One-Handed" },
};

const BLADE_DAMAGE_TYPE: Record<number, WeaponTypeHand["type"]> = {
  0: "Blunt",
  1: "Edged",
  2: "Piercing",
};

const derive = (
  bladeCategoryId: number,
  bladeDamageTypeByte: number,
  gripTypes: number[] | undefined,
  rangeStat: number,
): WeaponTypeHand | undefined => {
  const typeDefault = WEAPON_CAT[bladeCategoryId];
  if (!typeDefault) return undefined;

  let dominantType: WeaponTypeHand["type"] | undefined;
  if (gripTypes && gripTypes.length >= 3) {
    const [blunt, edged, piercing] = gripTypes;
    const max = Math.max(blunt, edged, piercing);
    if (max > 0) {
      if (max === blunt) dominantType = "Blunt";
      else if (max === edged) dominantType = "Edged";
      else if (max === piercing) dominantType = "Piercing";
    }
  }

  const fromBladeByte = BLADE_DAMAGE_TYPE[bladeDamageTypeByte];
  const displayType = fromBladeByte ?? dominantType ?? typeDefault.type;

  let hand = typeDefault.hand;
  if (typeDefault.hand === "Two-Handed" && rangeStat <= 10 && bladeCategoryId <= 8) {
    hand = "One-Handed";
  }

  return { type: displayType, hand };
};

describe("deriveWeaponTypeHand", () => {
  test("short sword category defaults", () => {
    expect(derive(2, 1, undefined, 10)).toEqual({ type: "Edged", hand: "One-Handed" });
  });

  test("two-handed melee + range 10 → one-handed", () => {
    expect(derive(3, 2, [0, 4, 4], 10)).toEqual({ type: "Piercing", hand: "One-Handed" });
  });

  test("two-handed melee + range 11 stays two-handed", () => {
    expect(derive(3, 1, undefined, 11)).toEqual({ type: "Edged", hand: "Two-Handed" });
  });

  test("bow category unchanged (ranged)", () => {
    expect(derive(9, 1, undefined, 10)).toEqual({ type: "Edged", hand: "Two-Handed" });
  });
});
