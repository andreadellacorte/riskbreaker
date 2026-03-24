import { Window as HappyWindow } from "happy-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isBackquoteToggle,
  riskbreakerDebugQueryMatches,
  riskbreakerSpikeQueryMatches,
} from "./riskbreaker-overlay.js";

describe("riskbreaker-overlay URL helpers", () => {
  it("matches riskbreaker=1 in query", () => {
    expect(riskbreakerSpikeQueryMatches("?riskbreaker=1")).toBe(true);
    expect(riskbreakerSpikeQueryMatches("?x=1&riskbreaker=1")).toBe(true);
    expect(riskbreakerSpikeQueryMatches("?riskbreaker=10")).toBe(false);
    expect(riskbreakerSpikeQueryMatches("")).toBe(false);
  });

  it("matches debug=1", () => {
    expect(riskbreakerDebugQueryMatches("?debug=1")).toBe(true);
    expect(riskbreakerDebugQueryMatches("")).toBe(false);
  });
});

describe("isBackquoteToggle", () => {
  const ev = (over: Partial<KeyboardEvent> = {}): KeyboardEvent =>
    ({
      repeat: false,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      code: "Backquote",
      key: "`",
      ...over,
    }) as KeyboardEvent;

  it("matches Backquote, IntlBackslash, key `, and keyCode 192", () => {
    expect(isBackquoteToggle(ev())).toBe(true);
    expect(isBackquoteToggle(ev({ code: "IntlBackslash" }))).toBe(true);
    expect(isBackquoteToggle(ev({ key: "`", code: "" }))).toBe(true);
    expect(
      isBackquoteToggle(
        Object.assign(ev({ code: "", key: "" }), { keyCode: 192 }) as KeyboardEvent & {
          keyCode: number;
        },
      ),
    ).toBe(true);
  });

  it("ignores repeat and modifier keys", () => {
    expect(isBackquoteToggle(ev({ repeat: true }))).toBe(false);
    expect(isBackquoteToggle(ev({ ctrlKey: true }))).toBe(false);
    expect(isBackquoteToggle(ev({ metaKey: true }))).toBe(false);
    expect(isBackquoteToggle(ev({ altKey: true }))).toBe(false);
  });
});

describe("installRiskbreakerOverlay", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates overlay root when spike query is present", async () => {
    vi.resetModules();
    const win = new HappyWindow({ url: "http://localhost/?riskbreaker=1" });
    globalThis.window = win as unknown as Window & typeof globalThis;
    globalThis.document = win.document as unknown as Document;
    document.body.innerHTML = "";
    const { installRiskbreakerOverlay: install } = await import("./riskbreaker-overlay.js");
    install();
    const el = document.getElementById("rb-riskbreaker-overlay");
    expect(el).not.toBeNull();
    expect(el?.getAttribute("role")).toBe("region");
  });

  it("is idempotent", async () => {
    vi.resetModules();
    const win = new HappyWindow({ url: "http://localhost/?riskbreaker=1" });
    globalThis.window = win as unknown as Window & typeof globalThis;
    globalThis.document = win.document as unknown as Document;
    document.body.innerHTML = "";
    const { installRiskbreakerOverlay: install } = await import("./riskbreaker-overlay.js");
    install();
    install();
    expect(document.querySelectorAll("#rb-riskbreaker-overlay").length).toBe(1);
  });

  it("no-ops when spike mode is off", async () => {
    vi.resetModules();
    const win = new HappyWindow({ url: "http://localhost/" });
    globalThis.window = win as unknown as Window & typeof globalThis;
    globalThis.document = win.document as unknown as Document;
    document.body.innerHTML = "";
    const { installRiskbreakerOverlay: install } = await import("./riskbreaker-overlay.js");
    install();
    expect(document.getElementById("rb-riskbreaker-overlay")).toBeNull();
  });

  it("keydown toggles with backquote and Escape closes when open", async () => {
    vi.resetModules();
    const win = new HappyWindow({ url: "http://localhost/?riskbreaker=1" });
    globalThis.window = win as unknown as Window & typeof globalThis;
    globalThis.document = win.document as unknown as Document;
    document.body.innerHTML = "";
    const { installRiskbreakerOverlay: install } = await import("./riskbreaker-overlay.js");
    install();

    const root = document.getElementById("rb-riskbreaker-overlay");
    expect(root?.hidden).toBe(true);

    document.dispatchEvent(
      new window.KeyboardEvent("keydown", {
        key: "`",
        code: "Backquote",
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(document.getElementById("rb-riskbreaker-overlay")?.hidden).toBe(false);

    document.dispatchEvent(
      new window.KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(document.getElementById("rb-riskbreaker-overlay")?.hidden).toBe(true);
  });
});
