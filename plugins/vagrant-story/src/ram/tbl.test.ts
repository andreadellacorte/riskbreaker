import { describe, expect, it } from "vitest";
import { decodeVsString } from "./tbl.js";

describe("decodeVsString", () => {
  it("decodes digits", () => {
    // 0x00=0, 0x01=1, 0x09=9
    expect(decodeVsString(new Uint8Array([0x00, 0x01, 0x09, 0xe7]))).toBe("019");
  });

  it("decodes uppercase letters", () => {
    // 0x0a=A, 0x0b=B, 0x23=Z
    expect(decodeVsString(new Uint8Array([0x0a, 0x0b, 0x23, 0xe7]))).toBe("ABZ");
  });

  it("decodes lowercase letters", () => {
    // 0x24=a, 0x25=b, 0x3d=z
    expect(decodeVsString(new Uint8Array([0x24, 0x25, 0x3d, 0xe7]))).toBe("abz");
  });

  it("stops at 0xE7 terminator", () => {
    expect(decodeVsString(new Uint8Array([0x0a, 0xe7, 0x0b]))).toBe("A");
  });

  it("skips 0xEB filler bytes", () => {
    expect(decodeVsString(new Uint8Array([0x0a, 0xeb, 0x0b, 0xe7]))).toBe("AB");
  });

  it("converts 0xE8 to newline", () => {
    expect(decodeVsString(new Uint8Array([0x0a, 0xe8, 0x0b, 0xe7]))).toBe("A\nB");
  });

  it("decodes space (0x8F)", () => {
    expect(decodeVsString(new Uint8Array([0x0a, 0x8f, 0x0b, 0xe7]))).toBe("A B");
  });

  it("skips two-byte 0xF8 escape sequences", () => {
    expect(decodeVsString(new Uint8Array([0x0a, 0xf8, 0x01, 0x0b, 0xe7]))).toBe("AB");
  });

  it("skips unknown bytes silently", () => {
    // 0xFF is not in the table
    expect(decodeVsString(new Uint8Array([0x0a, 0xff, 0x0b, 0xe7]))).toBe("AB");
  });

  it("respects maxBytes limit", () => {
    expect(decodeVsString(new Uint8Array([0x0a, 0x0b, 0x0c, 0xe7]), 2)).toBe("AB");
  });

  it("returns empty string for empty buffer", () => {
    expect(decodeVsString(new Uint8Array([]))).toBe("");
  });

  it("returns empty string for immediate terminator", () => {
    expect(decodeVsString(new Uint8Array([0xe7]))).toBe("");
  });

  it("decodes bytes without terminator (end of buffer)", () => {
    // 0x0a=A, 0x24=a — no terminator, reads to end
    const bytes = new Uint8Array([0x0a, 0x24]);
    expect(decodeVsString(bytes)).toBe("Aa");
  });
});
