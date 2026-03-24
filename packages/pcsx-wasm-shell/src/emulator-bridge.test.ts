import { Window as HappyWindow } from "happy-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { registerRiskbreakerEmulatorHost } from "./emulator-bridge.js";

describe("emulator-bridge", () => {
  beforeEach(() => {
    const win = new HappyWindow({ url: "http://localhost/" });
    globalThis.window = win as unknown as Window & typeof globalThis;
    globalThis.document = win.document as unknown as Document;
  });

  it("registerRiskbreakerEmulatorHost assigns window.__riskbreakerEmulatorHost", () => {
    const host = {
      getCanvas: () => null,
      getWASMpsx: () => ({}),
    };
    registerRiskbreakerEmulatorHost(host);
    expect(window.__riskbreakerEmulatorHost).toBe(host);
  });
});
