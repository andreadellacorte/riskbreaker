import type { IPatchPack } from "@riskbreaker/plugin-sdk";

const packId = "vagrant-story.patch.stub";

/** Scaffold only — IPS / runtime hooks land with real tooling. */
export function createMockVagrantStoryPatchPack(): IPatchPack {
  return { id: packId };
}
