import { Window as HappyWindow } from "happy-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function setupDom() {
  const win = new HappyWindow({ url: "http://localhost/" });
  globalThis.window = win as unknown as Window & typeof globalThis;
  globalThis.document = win.document as unknown as Document;
  globalThis.localStorage = win.localStorage as unknown as Storage;
  document.body.innerHTML = "";
  globalThis.requestAnimationFrame = vi.fn(() => 1);
  globalThis.cancelAnimationFrame = vi.fn();
}

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

describe("perf-hud global hooks", () => {
  beforeEach(() => {
    vi.resetModules();
    setupDom();
  });

  afterEach(() => {
    const g = globalThis as Record<string, unknown>;
    delete g.__riskbreakerOnEmulatedFrames;
    delete g.__riskbreakerOnWorkerRender;
    delete g.__riskbreakerOnMainLoopFrame;
    delete g.__riskbreakerOnRunIter;
    delete g.__riskbreakerPcsxWorkerActive;
  });

  it("installPerfHudGlobalHook installs all four globals", async () => {
    const { installPerfHudGlobalHook } = await import("./perf-hud.js");
    installPerfHudGlobalHook();
    const g = globalThis as Record<string, unknown>;
    expect(typeof g.__riskbreakerOnEmulatedFrames).toBe("function");
    expect(typeof g.__riskbreakerOnWorkerRender).toBe("function");
    expect(typeof g.__riskbreakerOnMainLoopFrame).toBe("function");
    expect(typeof g.__riskbreakerOnRunIter).toBe("function");
  });

  it("__riskbreakerOnEmulatedFrames skips when pcsx worker active", async () => {
    const { installPerfHudGlobalHook } = await import("./perf-hud.js");
    installPerfHudGlobalHook();
    const g = globalThis as Record<string, unknown>;
    g.__riskbreakerPcsxWorkerActive = true;
    // Should not throw
    expect(() => (g.__riskbreakerOnEmulatedFrames as (n: number) => void)(1)).not.toThrow();
  });

  it("__riskbreakerOnEmulatedFrames runs when pcsx worker not active", async () => {
    const { installPerfHudGlobalHook } = await import("./perf-hud.js");
    installPerfHudGlobalHook();
    const g = globalThis as Record<string, unknown>;
    g.__riskbreakerPcsxWorkerActive = false;
    expect(() => (g.__riskbreakerOnEmulatedFrames as (n: number) => void)(2)).not.toThrow();
  });

  it("__riskbreakerOnWorkerRender does not throw", async () => {
    const { installPerfHudGlobalHook } = await import("./perf-hud.js");
    installPerfHudGlobalHook();
    const g = globalThis as Record<string, unknown>;
    expect(() => (g.__riskbreakerOnWorkerRender as () => void)()).not.toThrow();
  });

  it("__riskbreakerOnRunIter does not throw", async () => {
    const { installPerfHudGlobalHook } = await import("./perf-hud.js");
    installPerfHudGlobalHook();
    const g = globalThis as Record<string, unknown>;
    expect(() => (g.__riskbreakerOnRunIter as (ms: number) => void)(5.3)).not.toThrow();
  });

  it("syncPerfHudFromStorage does not throw", async () => {
    const { syncPerfHudFromStorage } = await import("./perf-hud.js");
    expect(() => syncPerfHudFromStorage()).not.toThrow();
  });

  it("setPerfHudEnabled(true) twice does not throw", async () => {
    const { setPerfHudEnabled } = await import("./perf-hud.js");
    expect(() => { setPerfHudEnabled(true); setPerfHudEnabled(true); }).not.toThrow();
  });
});
