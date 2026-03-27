import { describe, expect, it } from "vitest";

import { pcsxWasmWatchPlugin } from "./vite-plugin-pcsx-wasm-watch.js";

describe("pcsxWasmWatchPlugin", () => {
  it("registers expected plugin name", () => {
    const p = pcsxWasmWatchPlugin();
    expect(p.name).toBe("pcsx-wasm-watch");
    expect(typeof p.configureServer).toBe("function");
  });
});
