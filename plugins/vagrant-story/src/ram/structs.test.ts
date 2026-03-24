import { describe, expect, it } from "vitest";
import {
  EQUIP_DATA_SIZE,
  MATERIAL_NAMES,
  SKILL_DATA_SIZE,
  readEquipData,
  readSkillData,
} from "./structs.js";

// ── helpers ───────────────────────────────────────────────────────────────────

function makeEquipBuf(overrides: Partial<Record<number, number>> = {}): Uint8Array {
  const b = new Uint8Array(EQUIP_DATA_SIZE);
  for (const [off, val] of Object.entries(overrides)) {
    b[Number(off)] = val as number;
  }
  return b;
}

function makeSkillBuf(overrides: Partial<Record<number, number>> = {}): Uint8Array {
  const b = new Uint8Array(SKILL_DATA_SIZE);
  for (const [off, val] of Object.entries(overrides)) {
    b[Number(off)] = val as number;
  }
  return b;
}

// ── MATERIAL_NAMES ────────────────────────────────────────────────────────────

describe("MATERIAL_NAMES", () => {
  it("has an entry for each known material index", () => {
    expect(MATERIAL_NAMES[0x00]).toBe("—");
    expect(MATERIAL_NAMES[0x01]).toBe("Leather");
    expect(MATERIAL_NAMES[0x09]).toBe("Damascus");
    expect(MATERIAL_NAMES[0x0b]).toBe("Heavy");
  });
});

// ── readEquipData ─────────────────────────────────────────────────────────────

describe("readEquipData", () => {
  it("returns all-zero equipped=false for empty buffer", () => {
    const d = readEquipData(makeEquipBuf());
    expect(d.equipped).toBe(false);
    expect(d.itemNameIndex).toBe(0);
    expect(d.dpCur).toBe(0);
    expect(d.dpMax).toBe(0);
    expect(d.statsCost).toBe("unknown");
  });

  it("reads itemNameIndex as u16LE at offset 0x00", () => {
    const d = readEquipData(makeEquipBuf({ 0: 0x34, 1: 0x12 }));
    expect(d.itemNameIndex).toBe(0x1234);
  });

  it("reads DP values and divides by 100", () => {
    // dpCur at 0x08-0x09, dpMax at 0x0a-0x0b
    // 500 = 0x01F4 → dpCur = 5
    const b = makeEquipBuf({ 8: 0xf4, 9: 0x01, 10: 0xe8, 11: 0x03 }); // 500 and 1000
    const d = readEquipData(b);
    expect(d.dpCurRaw).toBe(500);
    expect(d.dpCur).toBe(5);
    expect(d.dpMaxRaw).toBe(1000);
    expect(d.dpMax).toBe(10);
  });

  it("reads signed str/int/agi correctly (negative values)", () => {
    const b = makeEquipBuf({ 5: 0xff, 6: 0x80, 7: 0x01 }); // -1, -128, +1
    const d = readEquipData(b);
    expect(d.str).toBe(-1);
    expect(d.int).toBe(-128);
    expect(d.agi).toBe(1);
  });

  it("maps statsCost correctly", () => {
    expect(readEquipData(makeEquipBuf({ 0x11: 1 })).statsCost).toBe("MP");
    expect(readEquipData(makeEquipBuf({ 0x11: 2 })).statsCost).toBe("RISK");
    expect(readEquipData(makeEquipBuf({ 0x11: 3 })).statsCost).toBe("HP");
    expect(readEquipData(makeEquipBuf({ 0x11: 4 })).statsCost).toBe("PP");
    expect(readEquipData(makeEquipBuf({ 0x11: 5 })).statsCost).toBe("nothing");
    expect(readEquipData(makeEquipBuf({ 0x11: 99 })).statsCost).toBe("unknown");
  });

  it("maps materialName from index", () => {
    const d = readEquipData(makeEquipBuf({ 0x13: 0x04 }));
    expect(d.materialIndex).toBe(0x04);
    expect(d.materialName).toBe("Iron");
  });

  it("returns — for unknown material", () => {
    const d = readEquipData(makeEquipBuf({ 0x13: 0xff }));
    expect(d.materialName).toBe("—");
  });

  it("sets equipped=true when any byte is non-zero", () => {
    const d = readEquipData(makeEquipBuf({ 0x05: 1 }));
    expect(d.equipped).toBe(true);
  });

  it("raw slice is exactly EQUIP_DATA_SIZE bytes", () => {
    const d = readEquipData(makeEquipBuf({ 0: 1 }));
    expect(d.raw.length).toBe(EQUIP_DATA_SIZE);
  });

  it("reads 6 class affinities and 7 type affinities", () => {
    const d = readEquipData(makeEquipBuf());
    expect(d.classes).toHaveLength(6);
    expect(d.types).toHaveLength(7);
  });
});

// ── readSkillData ─────────────────────────────────────────────────────────────

describe("readSkillData", () => {
  it("returns defaults for empty buffer", () => {
    const d = readSkillData(makeSkillBuf());
    expect(d.skillListIndex).toBe(0);
    expect(d.type).toBe("unknown");
    expect(d.learned).toBe(false);
    // all-zero bytes decode as repeated '0' digits (0x00 = "0" in VS charset)
    expect(typeof d.name).toBe("string");
  });

  it("maps skill types correctly", () => {
    // type nibble is (typeByte >> 1) & 0x07
    // 1=spell → typeByte = 0x02
    expect(readSkillData(makeSkillBuf({ 2: 0x02 })).type).toBe("spell");
    expect(readSkillData(makeSkillBuf({ 2: 0x04 })).type).toBe("battle_ability");
    expect(readSkillData(makeSkillBuf({ 2: 0x06 })).type).toBe("break_art");
    expect(readSkillData(makeSkillBuf({ 2: 0x0c })).type).toBe("normal");
    expect(readSkillData(makeSkillBuf({ 2: 0x0e })).type).toBe("trap");
  });

  it("detects learned flag (bit 7 of byte 0x0c)", () => {
    expect(readSkillData(makeSkillBuf({ 0x0c: 0x80 })).learned).toBe(true);
    expect(readSkillData(makeSkillBuf({ 0x0c: 0x7f })).learned).toBe(false);
  });

  it("reads cost byte", () => {
    expect(readSkillData(makeSkillBuf({ 0x03: 42 })).cost).toBe(42);
  });

  it("raw slice is exactly SKILL_DATA_SIZE", () => {
    expect(readSkillData(makeSkillBuf()).raw.length).toBe(SKILL_DATA_SIZE);
  });
});
