import { describe, expect, it } from "vitest";
import type { GameManifest } from "@riskbreaker/shared-types";
import type { IGamePlugin } from "./game-plugin.js";
import type { PluginRegistration } from "./registration.js";
import { resolvePluginForManifest } from "./discovery.js";

function testManifest(overrides: Partial<GameManifest> = {}): GameManifest {
  return {
    title: "Test",
    titleId: "SLUS-00000",
    region: "NTSC-U",
    version: "1.0",
    discFormat: "cue",
    pluginHints: [],
    ...overrides,
  };
}

function minimalPlugin(
  id: string,
  handle: boolean,
): { registration: PluginRegistration; plugin: IGamePlugin } {
  const plugin: IGamePlugin = {
    metadata: { id, name: id, version: "0", games: [] },
    canHandle: () => handle,
    getStateDecoder: () => null,
    getDomainPack: () => null,
    getCommandPack: () => null,
    getUIScreenPack: () => null,
    getSaveCodec: () => null,
    getPatchPack: () => null,
  };
  return {
    plugin,
    registration: {
      metadata: plugin.metadata,
      create: () => plugin,
    },
  };
}

describe("resolvePluginForManifest", () => {
  it("returns the first matching registration", async () => {
    const a = minimalPlugin("a", false);
    const b = minimalPlugin("b", true);
    const manifest = testManifest({ title: "VS" });
    const found = await resolvePluginForManifest(manifest, [a.registration, b.registration]);
    expect(found?.metadata.id).toBe("b");
  });

  it("returns null when nothing matches", async () => {
    const a = minimalPlugin("a", false);
    const manifest = testManifest({ title: "X" });
    expect(await resolvePluginForManifest(manifest, [a.registration])).toBeNull();
  });
});
