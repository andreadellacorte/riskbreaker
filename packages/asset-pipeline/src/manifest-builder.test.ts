import { describe, expect, it } from "vitest";
import { GameManifestBuilder } from "./manifest-builder.js";

const builder = new GameManifestBuilder();

const validData = {
  title: "Vagrant Story",
  titleId: "SLUS-01040",
  region: "US",
  version: "1.0",
  discFormat: "bin/cue",
  pluginHints: ["vagrant-story"],
};

describe("GameManifestBuilder", () => {
  it("builds a valid manifest from a well-formed object", () => {
    const m = builder.buildFromUnknown(validData);
    expect(m.title).toBe("Vagrant Story");
    expect(m.titleId).toBe("SLUS-01040");
    expect(m.region).toBe("US");
    expect(m.version).toBe("1.0");
    expect(m.discFormat).toBe("bin/cue");
    expect(m.pluginHints).toEqual(["vagrant-story"]);
  });

  it("includes executableHash when present", () => {
    const m = builder.buildFromUnknown({ ...validData, executableHash: "abc123" });
    expect(m.executableHash).toBe("abc123");
  });

  it("omits executableHash when absent", () => {
    const m = builder.buildFromUnknown(validData);
    expect(m.executableHash).toBeUndefined();
  });

  it("omits executableHash when not a string", () => {
    const m = builder.buildFromUnknown({ ...validData, executableHash: 42 });
    expect(m.executableHash).toBeUndefined();
  });

  it("throws when input is not an object", () => {
    expect(() => builder.buildFromUnknown("string")).toThrow("expected object");
    expect(() => builder.buildFromUnknown(null)).toThrow("expected object");
    expect(() => builder.buildFromUnknown([1, 2])).toThrow("expected object");
    expect(() => builder.buildFromUnknown(42)).toThrow("expected object");
  });

  it("throws when title is missing", () => {
    const { title: _, ...rest } = validData;
    expect(() => builder.buildFromUnknown(rest)).toThrow("invalid manifest shape");
  });

  it("throws when titleId is not a string", () => {
    expect(() => builder.buildFromUnknown({ ...validData, titleId: 123 })).toThrow("invalid manifest shape");
  });

  it("throws when pluginHints is not an array", () => {
    expect(() => builder.buildFromUnknown({ ...validData, pluginHints: "hint" })).toThrow("invalid manifest shape");
  });

  it("throws when pluginHints contains non-strings", () => {
    expect(() => builder.buildFromUnknown({ ...validData, pluginHints: [1, 2] })).toThrow("invalid manifest shape");
  });

  it("accepts empty pluginHints array", () => {
    const m = builder.buildFromUnknown({ ...validData, pluginHints: [] });
    expect(m.pluginHints).toEqual([]);
  });
});
