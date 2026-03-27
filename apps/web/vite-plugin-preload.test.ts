import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createServer, type ViteDevServer } from "vite";

import { preloadPlugin } from "./vite-plugin-preload.js";

const appDir = path.dirname(fileURLToPath(import.meta.url));

describe("preloadPlugin", { timeout: 30_000 }, () => {
  let server: ViteDevServer | undefined;
  let prevDisc: string | undefined;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rb-preload-"));
    prevDisc = process.env.PRELOAD_PS1_DISC_BIN;
  });

  afterEach(async () => {
    if (prevDisc === undefined) delete process.env.PRELOAD_PS1_DISC_BIN;
    else process.env.PRELOAD_PS1_DISC_BIN = prevDisc;
    if (server) {
      await server.close();
      server = undefined;
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("serves disc bytes at /api/v1/preload/disc when PRELOAD_PS1_DISC_BIN resolves", async () => {
    const discPath = path.join(tmpDir, "fixture.bin");
    const payload = Buffer.from([0, 1, 2, 0xf0, 0x0f]);
    fs.writeFileSync(discPath, payload);
    process.env.PRELOAD_PS1_DISC_BIN = discPath;

    server = await createServer({
      root: appDir,
      plugins: [preloadPlugin({ repoRoot: tmpDir })],
      logLevel: "error",
      server: { host: "127.0.0.1", port: 0, strictPort: false },
    });
    await server.listen();
    const addr = server.httpServer!.address();
    if (addr == null || typeof addr === "string") throw new Error("no port");
    const port = addr.port;
    const res = await fetch(`http://127.0.0.1:${port}/api/v1/preload/disc`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/octet-stream");
    expect(res.headers.get("x-filename")).toBe("fixture.bin");
    const body = Buffer.from(await res.arrayBuffer());
    expect(body.equals(payload)).toBe(true);
  });

  it("injects preload script for /pcsx-wasm/index.html?preload=1", async () => {
    const discPath = path.join(tmpDir, "disc.bin");
    fs.writeFileSync(discPath, Buffer.from([0xff]));
    process.env.PRELOAD_PS1_DISC_BIN = discPath;

    server = await createServer({
      root: appDir,
      plugins: [preloadPlugin({ repoRoot: tmpDir })],
      logLevel: "error",
      server: { host: "127.0.0.1", port: 0, strictPort: false },
    });
    await server.listen();
    const addr = server.httpServer!.address();
    if (addr == null || typeof addr === "string") throw new Error("no port");

    const res = await fetch(
      `http://127.0.0.1:${addr.port}/pcsx-wasm/index.html?preload=1`,
    );
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("/api/v1/preload/disc");
    expect(html).toContain("[preload] active");
    expect(html).toContain("</head>");
  });
});
