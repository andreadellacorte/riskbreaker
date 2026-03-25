import { describe, expect, it } from "vitest";
import { ManifestResolver } from "./manifest-resolver.js";

const validJson = JSON.stringify({
  title: "Vagrant Story",
  titleId: "SLUS-01040",
  region: "US",
  version: "1.0",
  discFormat: "bin/cue",
  pluginHints: [],
});

describe("ManifestResolver", () => {
  it("parses valid JSON into a manifest", () => {
    const m = new ManifestResolver().parseJson(validJson);
    expect(m.titleId).toBe("SLUS-01040");
  });

  it("throws on invalid JSON", () => {
    expect(() => new ManifestResolver().parseJson("{bad}")).toThrow();
  });

  it("throws on invalid manifest shape", () => {
    expect(() => new ManifestResolver().parseJson('{"title":1}')).toThrow();
  });
});
