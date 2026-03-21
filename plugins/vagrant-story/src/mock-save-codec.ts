import type { ISaveCodec } from "@riskbreaker/plugin-sdk";

const codecId = "vagrant-story.save.mock";

/**
 * Placeholder save codec — does not read real SRAM / memory cards.
 * A future version can load structured layout once `bins/` ROM dumps are wired.
 */
export function createMockVagrantStorySaveCodec(): ISaveCodec {
  return {
    id: codecId,
    decodeSlot(data: Uint8Array): unknown {
      return {
        mock: true,
        byteLength: data.byteLength,
        note: "Real Vagrant Story save parsing is not implemented; bins/ ROM not required for mocks.",
      };
    },
  };
}
