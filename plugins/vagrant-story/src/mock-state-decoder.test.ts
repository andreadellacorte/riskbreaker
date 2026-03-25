import { describe, expect, it } from "vitest";
import { createMockVagrantStoryStateDecoder } from "./mock-state-decoder.js";
import type { RuntimeSnapshot } from "@riskbreaker/shared-types";

function snap(overrides: Partial<RuntimeSnapshot> = {}): RuntimeSnapshot {
  return { memorySegments: [], registers: {}, ...overrides } as unknown as RuntimeSnapshot;
}

describe("createMockVagrantStoryStateDecoder", () => {
  const decoder = createMockVagrantStoryStateDecoder();

  it("has correct id", () => {
    expect(decoder.id).toBe("vagrant-story.state-decoder.mock");
  });

  it("decodes a plain snapshot", () => {
    const gs = decoder.decode(snap());
    expect(gs).toBeDefined();
  });

  it("overlays activeScene when present", () => {
    const gs = decoder.decode(snap({ activeScene: "dungeon" } as never));
    const rs = gs.runtimeState as Record<string, unknown>;
    expect(rs.sceneId).toBe("dungeon");
  });

  it("does not overlay sceneId when activeScene is null", () => {
    const gs = decoder.decode(snap({ activeScene: null } as never));
    const rs = gs.runtimeState as Record<string, unknown>;
    expect(rs.sceneId).not.toBe(null);
  });

  it("overlays mockStateTag when present", () => {
    const gs = decoder.decode(snap({ mockStateTag: "battle" } as never));
    const rs = gs.runtimeState as Record<string, unknown>;
    expect(rs.mockStateTag).toBe("battle");
  });

  it("does not set mockStateTag when absent", () => {
    const gs = decoder.decode(snap());
    const rs = gs.runtimeState as Record<string, unknown>;
    expect(rs.mockStateTag).toBeUndefined();
  });
});
