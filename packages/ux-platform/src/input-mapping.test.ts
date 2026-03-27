import { describe, expect, it } from "vitest";

import { InputMappingModel } from "./input-mapping.js";

describe("InputMappingModel", () => {
  it("starts empty", () => {
    const m = new InputMappingModel();
    expect(m.all()).toEqual([]);
  });

  it("accumulates bindings in insertion order", () => {
    const m = new InputMappingModel();
    m.add({ actionId: "confirm", keys: ["Enter", "Space"] });
    m.add({ actionId: "cancel", keys: ["Escape"] });
    expect(m.all()).toEqual([
      { actionId: "confirm", keys: ["Enter", "Space"] },
      { actionId: "cancel", keys: ["Escape"] },
    ]);
  });

  it("all() reflects new bindings after add", () => {
    const m = new InputMappingModel();
    m.add({ actionId: "a", keys: ["b"] });
    expect(m.all()).toHaveLength(1);
    m.add({ actionId: "c", keys: ["d"] });
    expect(m.all()).toHaveLength(2);
  });
});
