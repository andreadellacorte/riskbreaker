import { describe, expect, it } from "vitest";
import { assertNever, isDefined } from "./guards.js";

describe("isDefined", () => {
  it("narrows defined values", () => {
    const x: string | undefined = "a";
    expect(isDefined(x)).toBe(true);
    if (isDefined(x)) {
      expect(x.toUpperCase()).toBe("A");
    }
  });

  it("rejects null and undefined", () => {
    expect(isDefined(undefined)).toBe(false);
    expect(isDefined(null)).toBe(false);
  });
});

describe("assertNever", () => {
  it("throws when called", () => {
    expect(() => assertNever(undefined as never)).toThrow(/Unexpected/);
  });
});
