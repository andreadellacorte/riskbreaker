import type { GameManifest } from "@riskbreaker/shared-types";
import type { IGamePlugin, PluginRegistration } from "@riskbreaker/plugin-sdk";
import { CommandBus, CommandTranslator } from "@riskbreaker/command-engine";
import { createLogger, EventTimeline } from "@riskbreaker/devtools";
import { SnapshotMapper, ViewModelBuilder } from "@riskbreaker/domain-engine";
import { MockRuntimeAdapter, type RuntimeSnapshotFactory } from "@riskbreaker/psx-runtime";
import { SaveSlotBrowser } from "@riskbreaker/save-service";
import { StateStore } from "@riskbreaker/state-engine";
import { ScreenRegistry } from "@riskbreaker/ux-platform";

import { PluginRegistry } from "./plugin-registry.js";

export type ActiveSession = {
  readonly manifest: GameManifest;
  readonly plugin: IGamePlugin;
  readonly registration: PluginRegistration;
  readonly runtime: MockRuntimeAdapter;
  readonly stateStore: StateStore;
  readonly viewModelBuilder: ViewModelBuilder;
  readonly commandBus: CommandBus;
  readonly screenRegistry: ScreenRegistry;
  readonly saveSlotBrowser: SaveSlotBrowser;
  readonly timeline: EventTimeline;
};

/** Wires manifest → plugin → runtime snapshot → decode → domain → command bus (mock-friendly). */
export class SessionOrchestrator {
  private readonly plugins: PluginRegistry;

  constructor(
    registrations: readonly PluginRegistration[],
    private readonly snapshotFactory?: RuntimeSnapshotFactory,
  ) {
    this.plugins = new PluginRegistry(registrations);
  }

  async bootstrap(manifest: GameManifest): Promise<ActiveSession> {
    const timeline = new EventTimeline();
    const log = createLogger("session", (r) => timeline.push({ kind: "log", payload: r }));
    log("info", "bootstrap.start", { title: manifest.title });

    const registration = await this.plugins.resolveFor(manifest);
    if (!registration) {
      throw new Error("SessionOrchestrator: no plugin handles this manifest");
    }

    const plugin = registration.create();
    const decoder = plugin.getStateDecoder();
    const domain = plugin.getDomainPack();
    const commands = plugin.getCommandPack();
    if (!decoder || !domain || !commands) {
      throw new Error(
        "SessionOrchestrator: plugin must expose decoder, domain, and command packs",
      );
    }

    const runtime = new MockRuntimeAdapter(this.snapshotFactory);
    await Promise.resolve(runtime.loadManifest(manifest));

    const stateStore = new StateStore(decoder);
    const rtSnap = await Promise.resolve(runtime.captureSnapshot());
    await stateStore.refreshFrom(rtSnap);

    const mapper = new SnapshotMapper(domain);
    const viewModelBuilder = new ViewModelBuilder(mapper);
    const translator = new CommandTranslator(commands);
    const commandBus = new CommandBus(translator);

    const screenRegistry = new ScreenRegistry();
    const ui = plugin.getUIScreenPack();
    if (ui) {
      for (const id of ui.screenIds) {
        screenRegistry.register({ id, pluginId: plugin.metadata.id });
      }
    }

    const saveCodec = plugin.getSaveCodec();
    const saveSlotBrowser = new SaveSlotBrowser(saveCodec);

    log("info", "bootstrap.done", { pluginId: plugin.metadata.id });

    return {
      manifest,
      plugin,
      registration,
      runtime,
      stateStore,
      viewModelBuilder,
      commandBus,
      screenRegistry,
      saveSlotBrowser,
      timeline,
    };
  }
}
