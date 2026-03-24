import { Window as HappyWindow } from "happy-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("perf-hud fallback sampler", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("starts a fallback frame sampler when HUD is enabled", async () => {
    const win = new HappyWindow({ url: "http://localhost/" });
    globalThis.window = win as unknown as Window & typeof globalThis;
    globalThis.document = win.document as unknown as Document;
    globalThis.localStorage = win.localStorage as unknown as Storage;
    document.body.innerHTML = "";

    const rafCallbacks: FrameRequestCallback[] = [];
    const rafSpy = vi.fn((cb: FrameRequestCallback): number => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });
    const cancelSpy = vi.fn();
    globalThis.requestAnimationFrame = rafSpy;
    globalThis.cancelAnimationFrame = cancelSpy;

    const { setPerfHudEnabled } = await import("./perf-hud.js");
    setPerfHudEnabled(true);
    rafCallbacks.shift()?.(performance.now() + 16.6);

    expect(rafSpy).toHaveBeenCalled();
    expect(cancelSpy).not.toHaveBeenCalled();
  });

  it("stops the fallback sampler when HUD is disabled", async () => {
    const win = new HappyWindow({ url: "http://localhost/" });
    globalThis.window = win as unknown as Window & typeof globalThis;
    globalThis.document = win.document as unknown as Document;
    globalThis.localStorage = win.localStorage as unknown as Storage;
    document.body.innerHTML = "";

    let nextId = 10;
    const rafSpy = vi.fn(() => nextId++);
    const cancelSpy = vi.fn();
    globalThis.requestAnimationFrame = rafSpy;
    globalThis.cancelAnimationFrame = cancelSpy;

    const { setPerfHudEnabled } = await import("./perf-hud.js");
    setPerfHudEnabled(true);
    setPerfHudEnabled(false);

    expect(rafSpy).toHaveBeenCalled();
    expect(cancelSpy).toHaveBeenCalled();
  });
});
