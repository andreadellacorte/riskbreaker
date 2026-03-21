import type { ISaveCodec } from "@riskbreaker/plugin-sdk";

export type SaveSlotPreview = {
  readonly index: number;
  readonly decoded: unknown;
};

/** Uses the active plugin codec to interpret raw slot bytes. */
export class SaveSlotBrowser {
  constructor(private readonly codec: ISaveCodec | null) {}

  previewSlot(index: number, raw: Uint8Array): SaveSlotPreview {
    const decoded =
      this.codec != null
        ? this.codec.decodeSlot(raw)
        : { empty: true, index, note: "no codec" };
    return { index, decoded };
  }
}
