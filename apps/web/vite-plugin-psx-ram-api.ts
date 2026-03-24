/**
 * Vite dev-mode plugin: exposes GET /api/v1/cpu/ram/raw with the same spec as
 * the PCSX-Redux web server REST API. Enabled automatically in dev mode.
 *
 * Flow:
 *   1. Browser loads the app; installPsxRamApiClient() opens a persistent SSE
 *      connection to /api/v1/psxram-events.
 *   2. External caller hits GET /api/v1/cpu/ram/raw on the Vite dev server.
 *   3. Plugin sends a reqId to all SSE subscribers.
 *   4. Browser reads psxM via the emulator host peek and POSTs binary to
 *      /api/v1/psxram-upload?reqId=X.
 *   5. Plugin resolves the pending request and returns the binary to the caller.
 */
import type { Plugin } from "vite";
import type { ServerResponse } from "http";

const EVENTS_PATH = "/api/v1/psxram-events";
const UPLOAD_PATH = "/api/v1/psxram-upload";
const RAM_PATH = "/api/v1/cpu/ram/raw";
const TIMEOUT_MS = 10_000;

export function psxRamApiPlugin(): Plugin {
  const pending = new Map<string, (buf: Buffer) => void>();
  const subscribers = new Set<ServerResponse>();

  function broadcast(reqId: string): void {
    const msg = `data: ${JSON.stringify({ reqId })}\n\n`;
    for (const res of subscribers) {
      try {
        res.write(msg);
      } catch {
        subscribers.delete(res);
      }
    }
  }

  return {
    name: "psx-ram-api",
    apply: "serve", // dev only
    configureServer(server) {
      // SSE endpoint: browser subscribes here to receive reqIds
      server.middlewares.use(EVENTS_PATH, (req, res) => {
        if (req.method !== "GET") {
          res.statusCode = 405;
          res.end();
          return;
        }
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.flushHeaders();
        subscribers.add(res);
        console.log(`[psx-ram-api] SSE subscriber connected (${subscribers.size} total)`);
        req.on("close", () => {
          subscribers.delete(res);
          console.log(`[psx-ram-api] SSE subscriber disconnected (${subscribers.size} remaining)`);
        });
      });

      // RAM read endpoint: triggers a browser RAM dump and streams it back
      server.middlewares.use(RAM_PATH, (req, res) => {
        if (req.method !== "GET") {
          res.statusCode = 405;
          res.end();
          return;
        }
        if (subscribers.size === 0) {
          res.statusCode = 503;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "no_game", message: "No active pcsx-wasm game connected. Open /pcsx-wasm/index.html?riskbreaker=1 first." }));
          return;
        }
        const reqId = Math.random().toString(36).slice(2);
        console.log(`[psx-ram-api] request ${reqId} — broadcasting to ${subscribers.size} subscriber(s)…`);
        const timer = setTimeout(() => {
          pending.delete(reqId);
          console.warn(`[psx-ram-api] request ${reqId} timed out — game may not be loaded yet`);
          res.statusCode = 503;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "no_game", message: "pcsx-wasm game did not respond. Is a disc loaded and running?" }));
        }, TIMEOUT_MS);

        pending.set(reqId, (buf) => {
          clearTimeout(timer);
          pending.delete(reqId);
          console.log(`[psx-ram-api] request ${reqId} fulfilled (${buf.length} bytes)`);
          res.setHeader("Content-Type", "application/octet-stream");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.end(buf);
        });

        broadcast(reqId);
      });

      // Upload endpoint: browser POSTs raw RAM bytes here
      server.middlewares.use(UPLOAD_PATH, (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }
        const url = new URL(req.url ?? "", "http://localhost");
        const reqId = url.searchParams.get("reqId") ?? "";
        const chunks: Buffer[] = [];
        req.on("data", (c: Buffer) => chunks.push(c));
        req.on("end", () => {
          res.end("ok");
          const resolve = pending.get(reqId);
          if (resolve) resolve(Buffer.concat(chunks));
        });
      });
    },
  };
}
