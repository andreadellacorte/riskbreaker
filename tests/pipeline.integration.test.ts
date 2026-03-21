import { SessionOrchestrator } from "@riskbreaker/app-shell";
import {
  createVagrantStoryPlugin,
  getFixtureManifest,
  getFixtureRuntimeSnapshot,
} from "@riskbreaker/plugin-vagrant-story";
import { describe, expect, it } from "vitest";

describe("mock vertical slice (vagrant-story plugin + app-shell)", () => {
  it("manifest → plugin → decode → view model → command plan", async () => {
    const plugin = createVagrantStoryPlugin();
    const registration = {
      metadata: plugin.metadata,
      create: () => createVagrantStoryPlugin(),
    };
    const orchestrator = new SessionOrchestrator([registration], () =>
      getFixtureRuntimeSnapshot(),
    );
    const session = await orchestrator.bootstrap(getFixtureManifest());

    const snap = session.stateStore.getSnapshot();
    expect(snap).not.toBeNull();
    const inv = snap!.inventoryState as { items?: unknown[] };
    expect(inv.items?.length).toBeGreaterThan(0);

    const vm = await session.viewModelBuilder.build(snap!);
    expect(vm.screen).toBe("inventory");

    const plan = await session.commandBus.dispatch({
      kind: "EquipItem",
      itemId: "broadsword_rusty",
    });
    expect(plan?.mode).toBe("composite");

    expect(session.screenRegistry.list().some((s) => s.id === "inventory")).toBe(true);
  });
});
