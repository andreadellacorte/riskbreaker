import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createServer, type ViteDevServer } from "vite";

import { psxRamApiPlugin } from "./vite-plugin-psx-ram-api.js";

const appDir = path.dirname(fileURLToPath(import.meta.url));

function clearPsxRamApiState(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (process as any).__psxRamApiState;
}

describe("psxRamApiPlugin", { timeout: 30_000 }, () => {
  let server: ViteDevServer | undefined;

  beforeEach(() => {
    clearPsxRamApiState();
  });

  afterEach(async () => {
    clearPsxRamApiState();
    if (server) {
      await server.close();
      server = undefined;
    }
  });

  it("GET /api/v1/execution-flow returns status without SSE clients", async () => {
    server = await createServer({
      root: appDir,
      plugins: [psxRamApiPlugin()],
      logLevel: "error",
      server: { host: "127.0.0.1", port: 0, strictPort: false },
    });
    await server.listen();
    const addr = server.httpServer!.address();
    if (addr == null || typeof addr === "string") throw new Error("no port");
    const res = await fetch(
      `http://127.0.0.1:${addr.port}/api/v1/execution-flow`,
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { status: string };
    expect(["running", "paused"]).toContain(json.status);
  });

  it("GET /api/v1/cpu/ram/raw responds no_game when no SSE subscriber", async () => {
    server = await createServer({
      root: appDir,
      plugins: [psxRamApiPlugin()],
      logLevel: "error",
      server: { host: "127.0.0.1", port: 0, strictPort: false },
    });
    await server.listen();
    const addr = server.httpServer!.address();
    if (addr == null || typeof addr === "string") throw new Error("no port");
    const res = await fetch(`http://127.0.0.1:${addr.port}/api/v1/cpu/ram/raw`);
    expect(res.status).toBe(503);
    const json = (await res.json()) as { error: string };
    expect(json.error).toBe("no_game");
  });

  it("GET /api/v1/debug reports zero subscribers on fresh process state", async () => {
    server = await createServer({
      root: appDir,
      plugins: [psxRamApiPlugin()],
      logLevel: "error",
      server: { host: "127.0.0.1", port: 0, strictPort: false },
    });
    await server.listen();
    const addr = server.httpServer!.address();
    if (addr == null || typeof addr === "string") throw new Error("no port");
    const res = await fetch(`http://127.0.0.1:${addr.port}/api/v1/debug`);
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      subscribers: number;
      pendingBinary: number;
      pendingJson: number;
    };
    expect(json.subscribers).toBe(0);
    expect(json.pendingBinary).toBe(0);
    expect(json.pendingJson).toBe(0);
  });
});
