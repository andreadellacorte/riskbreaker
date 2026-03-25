import type { GameManifest } from "@riskbreaker/shared-types";
import type { IGamePlugin } from "@riskbreaker/plugin-sdk";
import type { PluginRegistration } from "@riskbreaker/plugin-sdk";
import { EmulatorRuntimeAdapter } from "@riskbreaker/psx-runtime";
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

  it("accepts EmulatorRuntimeAdapter via SessionRuntimeFactory", async () => {
    const orch = new SessionOrchestrator([stubRegistration()], () => ({
      timestamp: 2,
      memorySegments: [],
      registers: {},
      activeScene: "emu",
      mockStateTag: "emulator-path",
    }), (sf) => new EmulatorRuntimeAdapter(sf));
    const session = await orch.bootstrap(testManifest());
    expect(session.runtime).toBeInstanceOf(EmulatorRuntimeAdapter);
    const snap = session.stateStore.getSnapshot();
    expect(snap?.runtimeState).toMatchObject({ tag: "emulator-path" });
  });

  it("throws when no plugin handles the manifest", async () => {
    const orch = new SessionOrchestrator([]);
    await expect(orch.bootstrap(testManifest())).rejects.toThrow("no plugin handles");
  });

  it("bootstraps successfully when plugin has no UI screen pack", async () => {
    const noUiReg: PluginRegistration = {
      ...stubRegistration(),
      create: () => ({
        ...stubRegistration().create(),
        getUIScreenPack: () => null,
      }),
    };
    const orch = new SessionOrchestrator([noUiReg]);
    const session = await orch.bootstrap(testManifest());
    expect(session.screenRegistry.list()).toHaveLength(0);
  });

  it("throws when plugin missing required packs", async () => {
    const bad: PluginRegistration = {
      metadata: { id: "bad", name: "Bad", version: "0", games: [] as const },
      create: () => ({
        metadata: { id: "bad", name: "Bad", version: "0", games: [] as const },
        canHandle: () => true,
        getStateDecoder: () => null,
        getDomainPack: () => null,
        getCommandPack: () => null,
        getUIScreenPack: () => null,
        getSaveCodec: () => null,
        getPatchPack: () => null,
      }),
    };
    const orch = new SessionOrchestrator([bad]);
    await expect(orch.bootstrap(testManifest())).rejects.toThrow("decoder, domain, and command");
  });
});
