import { describe, expect, it } from "vitest";

import { RulesEngine } from "./rules-engine.js";

describe("RulesEngine", () => {
  it("evaluates any view model as ok (placeholder policy)", () => {
    const engine = new RulesEngine();
    expect(engine.evaluate({ rows: [] })).toEqual({ ok: true });
    expect(engine.evaluate({})).toEqual({ ok: true });
  });
});
