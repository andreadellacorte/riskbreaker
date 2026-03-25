import { describe, expect, it } from "vitest";

import type { IMemoryBridge } from "./contracts.js";
import { EmulatorRuntimeAdapter, defaultEmulatorStubSnapshot } from "./emulator-runtime-adapter.js";

const testManifest = () => ({
  title: "Test",
  titleId: "T-00000" as const,
  region: "NTSC-U" as const,
  version: "1",
  discFormat: "cue" as const,
  pluginHints: [] as string[],
});

describe("EmulatorRuntimeAdapter", () => {
  it("implements IRuntime with stub snapshot by default", async () => {
    const rt = new EmulatorRuntimeAdapter();
    rt.loadManifest(testManifest());
    expect(rt.getLifecycle()).toBe("loaded");
    const snap = await rt.captureSnapshot();
    expect(snap.mockStateTag).toBe("psx-runtime-emulator-stub");
    expect(rt.getLifecycle()).toBe("running");
  });

  it("uses custom snapshot factory when provided", async () => {
    const rt = new EmulatorRuntimeAdapter(() => ({
      ...defaultEmulatorStubSnapshot(),
      mockStateTag: "custom-tag",
    }));
    rt.loadManifest(testManifest());
    expect((await rt.captureSnapshot()).mockStateTag).toBe("custom-tag");
  });

  it("reads from IMemoryBridge when provided, returning a live snapshot", async () => {
    const fakeRam = new Uint8Array(2 * 1024 * 1024);
    fakeRam[0] = 0xde;
    fakeRam[1] = 0xad;
    const bridge: IMemoryBridge = {
      peek: (_address, _length) => Promise.resolve(fakeRam),
    };
    const rt = new EmulatorRuntimeAdapter(undefined, bridge);
    rt.loadManifest(testManifest());
    const snap = await rt.captureSnapshot();
    expect(snap.activeScene).toBe("emulator-live");
    expect(snap.mockStateTag).toBeUndefined();
    const seg = snap.memorySegments[0];
    expect(seg.name).toBe("psx_main_ram");
    expect(seg.bytes).toBe(fakeRam);
    expect(rt.getLifecycle()).toBe("running");
  });

  it("passes correct address and length to the bridge", async () => {
    const PSX_RAM_SIZE = 2 * 1024 * 1024;
    let capturedAddress = -1;
    let capturedLength = -1;
    const bridge: IMemoryBridge = {
      peek: (address, length) => {
        capturedAddress = address;
        capturedLength = length;
        return Promise.resolve(new Uint8Array(length));
      },
    };
    const rt = new EmulatorRuntimeAdapter(undefined, bridge);
    rt.loadManifest(testManifest());
    await rt.captureSnapshot();
    expect(capturedAddress).toBe(0);
    expect(capturedLength).toBe(PSX_RAM_SIZE);
  });

  it("throws when captureSnapshot called before loadManifest", async () => {
    const rt = new EmulatorRuntimeAdapter();
    await expect(rt.captureSnapshot()).rejects.toThrow("loadManifest");
  });
});
