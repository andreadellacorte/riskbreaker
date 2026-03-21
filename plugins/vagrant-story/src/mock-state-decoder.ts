import type { GameSnapshot, RuntimeSnapshot } from "@riskbreaker/shared-types";
import type { IStateDecoder } from "@riskbreaker/plugin-sdk";

import { jsonClone } from "./clone.js";
import { getFixtureGameSnapshot } from "./load-fixtures.js";

const decoderId = "vagrant-story.state-decoder.mock";

/** Uses JSON fixtures; overlays `activeScene` from the live snapshot when present. */
export function createMockVagrantStoryStateDecoder(): IStateDecoder {
  return {
    id: decoderId,
    decode(snapshot: RuntimeSnapshot): GameSnapshot {
      const base = jsonClone(getFixtureGameSnapshot());
      const rs = base.runtimeState as Record<string, unknown>;
      if (snapshot.activeScene != null) {
        rs.sceneId = snapshot.activeScene;
      }
      if (snapshot.mockStateTag != null) {
        rs.mockStateTag = snapshot.mockStateTag;
      }
      return base;
    },
  };
}
