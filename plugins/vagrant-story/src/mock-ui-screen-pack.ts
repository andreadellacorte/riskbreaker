import type { IUIScreenPack } from "@riskbreaker/plugin-sdk";

const packId = "vagrant-story.ui.mock";

export function createMockVagrantStoryUIScreenPack(): IUIScreenPack {
  return {
    id: packId,
    screenIds: ["inventory", "equipment", "map", "status", "system"] as const,
  };
}
