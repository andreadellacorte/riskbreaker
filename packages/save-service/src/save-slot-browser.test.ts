import { describe, expect, it } from "vitest";
import { SaveSlotBrowser } from "./save-slot-browser.js";
import type { ISaveCodec } from "@riskbreaker/plugin-sdk";

describe("SaveSlotBrowser", () => {
  it("uses codec when present", () => {
    const codec: ISaveCodec = {
      id: "test",
      decodeSlot: () => ({ hp: 100 }),
    };
    const browser = new SaveSlotBrowser(codec);
    const preview = browser.previewSlot(0, new Uint8Array([1, 2, 3]));
    expect(preview.decoded).toEqual({ hp: 100 });
    expect(preview.index).toBe(0);
  });

  it("returns no-codec sentinel when codec is null", () => {
    const browser = new SaveSlotBrowser(null);
    const preview = browser.previewSlot(2, new Uint8Array([1]));
    expect((preview.decoded as { empty: boolean }).empty).toBe(true);
    expect(preview.index).toBe(2);
  });
});
