import { describe, expect, it } from "vitest";
import { MockRuntimeAdapter } from "./mock-runtime-adapter.js";

const manifest = {
  title: "Test",
  titleId: "T-00000" as never,
  region: "NTSC-U" as never,
  version: "1",
  discFormat: "cue" as never,
  pluginHints: [] as string[],
};

describe("MockRuntimeAdapter", () => {
  it("starts in cold lifecycle", () => {
    const rt = new MockRuntimeAdapter();
    expect(rt.getLifecycle()).toBe("cold");
  });

  it("loadManifest sets lifecycle to loaded", () => {
    const rt = new MockRuntimeAdapter();
    rt.loadManifest(manifest);
    expect(rt.getLifecycle()).toBe("loaded");
    expect(rt.getLoadedManifest()).toEqual(manifest);
  });

  it("captureSnapshot throws before loadManifest", () => {
    const rt = new MockRuntimeAdapter();
    expect(() => rt.captureSnapshot()).toThrow("loadManifest");
  });

  it("captureSnapshot returns snapshot after loadManifest", () => {
    const rt = new MockRuntimeAdapter();
    rt.loadManifest(manifest);
    const snap = rt.captureSnapshot();
    expect(snap).toBeDefined();
    expect(rt.getLifecycle()).toBe("running");
  });

  it("uses custom snapshot factory", () => {
    const rt = new MockRuntimeAdapter(() => ({
      memorySegments: [],
      registers: {},
      mockStateTag: "custom",
    } as never));
    rt.loadManifest(manifest);
    const snap = rt.captureSnapshot();
    expect(snap.mockStateTag).toBe("custom");
  });
});
