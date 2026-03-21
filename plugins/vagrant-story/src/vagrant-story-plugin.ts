import type { GameManifest } from "@riskbreaker/shared-types";
import type { IGamePlugin } from "@riskbreaker/plugin-sdk";

import { createMockVagrantStoryCommandPack } from "./mock-command-pack.js";
import { createMockVagrantStoryDomainPack } from "./mock-domain-pack.js";
import { createMockVagrantStoryPatchPack } from "./mock-patch-pack.js";
import { createMockVagrantStorySaveCodec } from "./mock-save-codec.js";
import { createMockVagrantStoryStateDecoder } from "./mock-state-decoder.js";
import { createMockVagrantStoryUIScreenPack } from "./mock-ui-screen-pack.js";

const PLUGIN_HINTS = new Set([
  "vagrant-story",
  "riskbreaker.plugin.vagrant-story",
  "com.riskbreaker.vagrant-story",
]);

/** Title IDs commonly used for Vagrant Story (NTSC-U / PAL examples). */
export const VAGRANT_STORY_TITLE_IDS = ["SLUS-01040", "SLES-02754"] as const;

export const vagrantStoryPluginMetadata = {
  id: "riskbreaker.plugin.vagrant-story",
  name: "Vagrant Story",
  version: "0.0.0-mock",
  description: "Mock plugin: fixtures + coherent decoders/packs for Riskbreaker harness.",
  games: [...VAGRANT_STORY_TITLE_IDS],
} as const;

export function createVagrantStoryPlugin(): IGamePlugin {
  const metadata = {
    ...vagrantStoryPluginMetadata,
    games: [...vagrantStoryPluginMetadata.games],
  };

  return {
    metadata,
    canHandle(manifest: GameManifest): boolean {
      if (metadata.games.some((id) => id === manifest.titleId)) {
        return true;
      }
      return manifest.pluginHints.some((h) => PLUGIN_HINTS.has(h));
    },
    getStateDecoder: () => createMockVagrantStoryStateDecoder(),
    getDomainPack: () => createMockVagrantStoryDomainPack(),
    getCommandPack: () => createMockVagrantStoryCommandPack(),
    getUIScreenPack: () => createMockVagrantStoryUIScreenPack(),
    getSaveCodec: () => createMockVagrantStorySaveCodec(),
    getPatchPack: () => createMockVagrantStoryPatchPack(),
  };
}
