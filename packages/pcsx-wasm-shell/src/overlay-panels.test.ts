import { describe, expect, it } from "vitest";
import {
  getOverlayPanels,
  patchOverlayPanel,
  registerOverlayPanel,
} from "./overlay-panels.js";

describe("overlay-panels registry", () => {
  it("registers and retrieves a panel", () => {
    registerOverlayPanel({ id: "test-panel", heading: "Test", rows: [] });
    const panels = getOverlayPanels();
    expect(panels.some(p => p.id === "test-panel")).toBe(true);
  });

  it("patchOverlayPanel updates summary and rows", () => {
    registerOverlayPanel({ id: "patch-me", heading: "H", rows: [] });
    patchOverlayPanel("patch-me", { summary: "new summary", rows: [{ label: "HP", value: "100" }] });
    const panel = getOverlayPanels().find(p => p.id === "patch-me");
    expect(panel?.summary).toBe("new summary");
    expect(panel?.rows[0].label).toBe("HP");
  });

  it("patchOverlayPanel does nothing for unknown id", () => {
    expect(() => patchOverlayPanel("nonexistent", { summary: "x" })).not.toThrow();
  });
});
