import { Window as HappyWindow } from "happy-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { installPsxRamApiClient } from "./psx-ram-api-client.js";

describe("installPsxRamApiClient", () => {
  const eventSourceSpy = vi.fn();
  let infoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    eventSourceSpy.mockClear();
    const ES = function MockEventSource(this: { addEventListener: ReturnType<typeof vi.fn> }, url: string) {
      eventSourceSpy(url);
      this.addEventListener = vi.fn();
    } as unknown as typeof EventSource;
    vi.stubGlobal("EventSource", ES);
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    infoSpy.mockRestore();
    vi.restoreAllMocks();
  });

  function bindGlobals(win: InstanceType<typeof HappyWindow>): void {
    globalThis.window = win as unknown as Window & typeof globalThis;
    globalThis.document = win.document as unknown as Document;
    // Bare `location` in browser is `window.location`; Node tests must mirror that.
    Object.defineProperty(globalThis, "location", {
      value: win.location,
      configurable: true,
      writable: true,
    });
  }

  it("skips EventSource on production-style hostnames", () => {
    const win = new HappyWindow({ url: "https://riskbreaker.netlify.app/pcsx-wasm/" });
    bindGlobals(win);
    // import.meta.hot is undefined in Vitest
    installPsxRamApiClient();
    expect(eventSourceSpy).not.toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalledWith(
      "[psxram-api] skipping SSE (static deploy — PSX RAM API is dev-server only)",
    );
  });

  it("opens EventSource on Vite dev port 5173", () => {
    const win = new HappyWindow({ url: "http://localhost:5173/pcsx-wasm/" });
    bindGlobals(win);
    installPsxRamApiClient();
    expect(eventSourceSpy).toHaveBeenCalledWith("/api/v1/psxram-events");
  });

  it("opens EventSource for 127.0.0.1 without port", () => {
    const win = new HappyWindow({ url: "http://127.0.0.1/foo" });
    bindGlobals(win);
    installPsxRamApiClient();
    expect(eventSourceSpy).toHaveBeenCalledWith("/api/v1/psxram-events");
  });
});
