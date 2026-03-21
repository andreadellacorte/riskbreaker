import { resolvePluginForManifest } from "@riskbreaker/plugin-sdk";
import { describe, expect, it } from "vitest";

import {
  createVagrantStoryPlugin,
  getFixtureGameSnapshot,
  getFixtureManifest,
  getFixtureRuntimeSnapshot,
} from "./index.js";

describe("createVagrantStoryPlugin", () => {
  const plugin = createVagrantStoryPlugin();

  it("exposes metadata and packs", () => {
    expect(plugin.metadata.id).toBe("riskbreaker.plugin.vagrant-story");
    expect(plugin.getStateDecoder()?.id).toContain("vagrant-story");
    expect(plugin.getDomainPack()?.id).toContain("vagrant-story");
    expect(plugin.getCommandPack()?.id).toContain("vagrant-story");
    expect(plugin.getUIScreenPack()?.screenIds).toContain("inventory");
    expect(plugin.getSaveCodec()?.id).toContain("vagrant-story");
    expect(plugin.getPatchPack()?.id).toContain("vagrant-story");
  });

  it("canHandle matches fixture manifest and title id", async () => {
    const m = getFixtureManifest();
    expect(await Promise.resolve(plugin.canHandle(m))).toBe(true);
    expect(
      await Promise.resolve(
        plugin.canHandle({
          ...m,
          titleId: "SLUS-99999",
          pluginHints: [],
        }),
      ),
    ).toBe(false);
    expect(
      await Promise.resolve(
        plugin.canHandle({
          ...m,
          titleId: "SLUS-99999",
          pluginHints: ["vagrant-story"],
        }),
      ),
    ).toBe(true);
  });

  it("decoder returns coherent inventory from fixtures", async () => {
    const decoder = plugin.getStateDecoder();
    expect(decoder).not.toBeNull();
    const snap = await Promise.resolve(decoder!.decode(getFixtureRuntimeSnapshot()));
    const inv = snap.inventoryState as { items?: unknown[] };
    expect(inv.items?.length).toBe(2);
    expect(snap.characterState).toEqual(getFixtureGameSnapshot().characterState);
  });

  it("command pack returns structured plans", async () => {
    const pack = plugin.getCommandPack();
    const equip = await Promise.resolve(
      pack!.plan({ kind: "EquipItem", itemId: "broadsword_rusty" }),
    );
    expect(equip?.mode).toBe("composite");
    const sort = await Promise.resolve(pack!.plan({ kind: "SortInventory" }));
    expect(sort?.mode).toBe("input-sequence");
  });
});

describe("resolvePluginForManifest", () => {
  it("resolves the mock plugin from fixture manifest", async () => {
    const registration = {
      metadata: createVagrantStoryPlugin().metadata,
      create: () => createVagrantStoryPlugin(),
    };
    const chosen = await resolvePluginForManifest(getFixtureManifest(), [registration]);
    expect(chosen?.metadata.id).toBe("riskbreaker.plugin.vagrant-story");
  });
});
