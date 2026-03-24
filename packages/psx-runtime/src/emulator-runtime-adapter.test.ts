import { describe, expect, it } from "vitest";

import { EmulatorRuntimeAdapter, defaultEmulatorStubSnapshot } from "./emulator-runtime-adapter.js";

describe("EmulatorRuntimeAdapter", () => {
  it("implements IRuntime with stub snapshot by default", () => {
    const rt = new EmulatorRuntimeAdapter();
    rt.loadManifest({
      title: "Test",
      titleId: "T-00000",
      region: "NTSC-U",
      version: "1",
      discFormat: "cue",
      pluginHints: [],
    });
    expect(rt.getLifecycle()).toBe("loaded");
    const snap = rt.captureSnapshot();
    expect(snap.mockStateTag).toBe("psx-runtime-emulator-stub");
    expect(rt.getLifecycle()).toBe("running");
  });

  it("uses custom snapshot factory when provided", () => {
    const rt = new EmulatorRuntimeAdapter(() => ({
      ...defaultEmulatorStubSnapshot(),
      mockStateTag: "custom-tag",
    }));
    rt.loadManifest({
      title: "Test",
      titleId: "T-00000",
      region: "NTSC-U",
      version: "1",
      discFormat: "cue",
      pluginHints: [],
    });
    expect(rt.captureSnapshot().mockStateTag).toBe("custom-tag");
  });
});
