import { describe, expect, it, vi } from "vitest";
import { Ashley, CurrentRoom, EquippedItems, VagrantStoryRam } from "./vs-ram.js";
import { EQUIP_DATA_SIZE } from "./structs.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Create a PeekFn that always returns a zeroed buffer of the requested size. */
function zeroPeek() {
  return vi.fn(async (_addr: number, len: number) => new Uint8Array(len));
}

/** Create a PeekFn that returns the provided bytes, zero-padded to requested length. */
function fixedPeek(data: Uint8Array) {
  return vi.fn(async (_addr: number, len: number) => {
    const out = new Uint8Array(len);
    out.set(data.subarray(0, Math.min(data.length, len)));
    return out;
  });
}

/** LE u16 helper */
function le16(n: number): [number, number] {
  return [n & 0xff, (n >> 8) & 0xff];
}

// ── Ashley ────────────────────────────────────────────────────────────────────

describe("Ashley", () => {
  it("mode() returns 'normal' when byte is 0", async () => {
    const a = new Ashley(zeroPeek());
    expect(await a.mode()).toBe("normal");
  });

  it("mode() returns 'battle' when byte is 1", async () => {
    const a = new Ashley(fixedPeek(new Uint8Array([1])));
    expect(await a.mode()).toBe("battle");
  });

  it("hpCur() reads u16LE", async () => {
    const [lo, hi] = le16(432);
    const a = new Ashley(fixedPeek(new Uint8Array([lo, hi])));
    expect(await a.hpCur()).toBe(432);
  });

  it("hpMax() reads u16LE", async () => {
    const [lo, hi] = le16(500);
    const a = new Ashley(fixedPeek(new Uint8Array([lo, hi])));
    expect(await a.hpMax()).toBe(500);
  });

  it("mpCur() reads u16LE", async () => {
    const [lo, hi] = le16(80);
    const a = new Ashley(fixedPeek(new Uint8Array([lo, hi])));
    expect(await a.mpCur()).toBe(80);
  });

  it("mpMax() reads u16LE", async () => {
    const [lo, hi] = le16(100);
    const a = new Ashley(fixedPeek(new Uint8Array([lo, hi])));
    expect(await a.mpMax()).toBe(100);
  });

  it("risk() reads u16LE", async () => {
    const [lo, hi] = le16(23);
    const a = new Ashley(fixedPeek(new Uint8Array([lo, hi])));
    expect(await a.risk()).toBe(23);
  });

  it("vitals() returns correct packed values", async () => {
    // 5 × u16LE: hpCur=100, hpMax=200, mpCur=50, mpMax=60, risk=10
    const b = new Uint8Array(10);
    const view = new DataView(b.buffer);
    view.setUint16(0, 100, true);
    view.setUint16(2, 200, true);
    view.setUint16(4, 50, true);
    view.setUint16(6, 60, true);
    view.setUint16(8, 10, true);
    const a = new Ashley(fixedPeek(b));
    const v = await a.vitals();
    expect(v).toEqual({ hpCur: 100, hpMax: 200, mpCur: 50, mpMax: 60, risk: 10 });
  });

  it("name() returns string", async () => {
    const a = new Ashley(zeroPeek());
    expect(typeof await a.name()).toBe("string");
  });

  it("weaponCategoryId() returns number", async () => {
    const a = new Ashley(fixedPeek(new Uint8Array([7])));
    expect(await a.weaponCategoryId()).toBe(7);
  });

  it("range() returns number", async () => {
    const a = new Ashley(fixedPeek(new Uint8Array([3])));
    expect(await a.range()).toBe(3);
  });

  it("effectsMask() combines two u16LE into u32", async () => {
    // lo=0x1234, hi=0x5678 → 0x56781234
    const b = new Uint8Array([0x34, 0x12, 0x78, 0x56]);
    const a = new Ashley(fixedPeek(b));
    expect(await a.effectsMask()).toBe(0x56781234);
  });

  it("x/y/z/state/facing/speed return numbers", async () => {
    const a = new Ashley(zeroPeek());
    expect(typeof await a.x()).toBe("number");
    expect(typeof await a.y()).toBe("number");
    expect(typeof await a.z()).toBe("number");
    expect(typeof await a.state()).toBe("number");
    expect(typeof await a.facing()).toBe("number");
    expect(typeof await a.speed()).toBe("number");
  });

  it("strBase/strEquipped/intBase/intEquipped/aglBase/aglEquipped return numbers", async () => {
    const a = new Ashley(zeroPeek());
    expect(typeof await a.strBase()).toBe("number");
    expect(typeof await a.strEquipped()).toBe("number");
    expect(typeof await a.intBase()).toBe("number");
    expect(typeof await a.intEquipped()).toBe("number");
    expect(typeof await a.aglBase()).toBe("number");
    expect(typeof await a.aglEquipped()).toBe("number");
  });
});

// ── EquippedItems ─────────────────────────────────────────────────────────────

describe("EquippedItems", () => {
  it("weaponName() returns string", async () => {
    const e = new EquippedItems(zeroPeek());
    expect(typeof await e.weaponName()).toBe("string");
  });

  it("weaponBlade() returns EquipData", async () => {
    const e = new EquippedItems(fixedPeek(new Uint8Array(EQUIP_DATA_SIZE)));
    const d = await e.weaponBlade();
    expect(d).toHaveProperty("equipped");
  });

  it("shield() returns EquipData", async () => {
    const e = new EquippedItems(zeroPeek());
    const d = await e.shield();
    expect(d).toHaveProperty("materialName");
  });

  it("accessory() returns EquipData", async () => {
    const e = new EquippedItems(zeroPeek());
    expect(await e.accessory()).toHaveProperty("raw");
  });
});

// ── CurrentRoom ───────────────────────────────────────────────────────────────

describe("CurrentRoom", () => {
  it("zoneId() returns number", async () => {
    const r = new CurrentRoom(fixedPeek(new Uint8Array([42])));
    expect(await r.zoneId()).toBe(42);
  });

  it("roomId() returns number", async () => {
    const r = new CurrentRoom(fixedPeek(new Uint8Array([7])));
    expect(await r.roomId()).toBe(7);
  });
});

// ── VagrantStoryRam ───────────────────────────────────────────────────────────

describe("VagrantStoryRam", () => {
  it("exposes ashley, room, actors, skills, battleEngine", () => {
    const ram = new VagrantStoryRam(zeroPeek());
    expect(ram.ashley).toBeInstanceOf(Ashley);
    expect(ram.room).toBeInstanceOf(CurrentRoom);
    expect(ram.actors).toBeDefined();
    expect(ram.skills).toBeDefined();
    expect(ram.battleEngine).toBeDefined();
  });

  it("battleEngine exposes code address constants", () => {
    const ram = new VagrantStoryRam(zeroPeek());
    expect(typeof ram.battleEngine.listWeapon).toBe("number");
    expect(typeof ram.battleEngine.enterMenu).toBe("number");
    expect(typeof ram.battleEngine.replenish).toBe("number");
  });
});
