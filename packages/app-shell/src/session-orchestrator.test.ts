import type { GameManifest } from "@riskbreaker/shared-types";
import type { IGamePlugin } from "@riskbreaker/plugin-sdk";
import type { PluginRegistration } from "@riskbreaker/plugin-sdk";
import { describe, expect, it } from "vitest";

import { SessionOrchestrator } from "./session-orchestrator.js";

function testManifest(): GameManifest {
  return {
    title: "Stub",
    titleId: "STUB-00000",
    region: "NTSC-U",
    version: "0",
    discFormat: "mock",
    pluginHints: [],
  };
}

function stubRegistration(): PluginRegistration {
  const metadata = { id: "stub.plugin", name: "Stub", version: "0", games: [] as const };
  const plugin: IGamePlugin = {
    metadata,
    canHandle: () => true,
    getStateDecoder: () => ({
      id: "stub.decoder",
      decode: (rt) => ({
        runtimeState: { tag: rt.mockStateTag ?? "none" },
        uiState: {},
        inventoryState: { items: [{ id: "a" }] },
        characterState: {},
        worldState: {},
        combatState: {},
      }),
    }),
    getDomainPack: () => ({
      id: "stub.domain",
      mapToViewModel: (snap) => ({ screen: "inventory", rows: snap.inventoryState }),
    }),
    getCommandPack: () => ({
      id: "stub.commands",
      plan: () => ({ mode: "input-sequence", steps: ["confirm"] }),
    }),
    getUIScreenPack: () => ({ id: "stub.ui", screenIds: ["inventory"] }),
    getSaveCodec: () => ({ id: "stub.save", decodeSlot: (b) => ({ len: b.byteLength }) }),
    getPatchPack: () => ({ id: "stub.patch" }),
  };
  return { metadata, create: () => plugin };
}

describe("SessionOrchestrator", () => {
  it("runs snapshot → decode → view model → command plan", async () => {
    const orch = new SessionOrchestrator([stubRegistration()], () => ({
      timestamp: 1,
      memorySegments: [],
      registers: {},
      activeScene: "x",
      mockStateTag: "stub-flow",
    }));
    const session = await orch.bootstrap(testManifest());
    expect(session.runtime.getLifecycle()).toBe("running");
    const snap = session.stateStore.getSnapshot();
    expect(snap).not.toBeNull();
    const vm = await session.viewModelBuilder.build(snap!);
    expect(vm.screen).toBe("inventory");
    const plan = await session.commandBus.dispatch({ kind: "OpenInventory" });
    expect(plan?.mode).toBe("input-sequence");
    expect(session.screenRegistry.list().map((s) => s.id)).toContain("inventory");
    const preview = session.saveSlotBrowser.previewSlot(0, new Uint8Array(4));
    expect(preview.decoded).toEqual({ len: 4 });
  });
});
