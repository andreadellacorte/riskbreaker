/**
 * Vite dev-mode plugin: PCSX-Redux-compatible REST API.
 *
 * Implements the same endpoint surface as the PCSX-Redux web server so tooling
 * written for Redux works unchanged against the riskbreaker dev server.
 * Reference: https://pcsx-redux.consoledev.net/web_server/
 *
 * All endpoints that require live emulator data use an SSE+POST roundtrip:
 *   1. Client hits the HTTP endpoint.
 *   2. Plugin broadcasts a typed event to SSE subscribers in the browser.
 *   3. Browser reads/writes via the PCSX worker and POSTs the result back.
 *   4. Plugin resolves the pending request and responds to the HTTP caller.
 *
 * SSE channel: GET /api/v1/psxram-events
 * Result upload: POST /api/v1/psxram-upload?reqId=X   (RAM dump bytes)
 *                POST /api/v1/psxram-result?reqId=X    (JSON result for everything else)
 */
import type { Plugin } from "vite";
import type { ServerResponse } from "http";
import type { IncomingMessage } from "http";

// ── Paths ─────────────────────────────────────────────────────────────────────

const EVENTS_PATH      = "/api/v1/psxram-events";
const UPLOAD_PATH      = "/api/v1/psxram-upload";   // binary RAM dump
const RESULT_PATH      = "/api/v1/psxram-result";   // JSON results (poke, exec-flow, vram)

const RAM_RAW_PATH     = "/api/v1/cpu/ram/raw";
const RAM_SEARCH_PATH  = "/api/v1/cpu/ram/search";
const EXEC_FLOW_PATH   = "/api/v1/execution-flow";
const VRAM_RAW_PATH    = "/api/v1/gpu/vram/raw";
const CD_FILES_PATH    = "/api/v1/cd/files";

const TIMEOUT_MS = 10_000;

// ── Types ─────────────────────────────────────────────────────────────────────

type PendingBinary = (buf: Buffer) => void;
type PendingJson   = (result: unknown) => void;

// ── Helpers ───────────────────────────────────────────────────────────────────

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise(resolve => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

function noGame(res: ServerResponse): void {
  res.statusCode = 503;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: "no_game", message: "No active pcsx-wasm game connected. Open /pcsx-wasm/index.html?riskbreaker=1 first." }));
}


// ── Plugin ────────────────────────────────────────────────────────────────────

// Process-level shared state — survives Vite HMR module reloads.
//
// When Vite restarts the dev server (e.g. after editing this file), it re-evaluates
// this module, but the OLD middleware handlers registered with Connect are still active.
// Module-level `const` is re-created on each reload, so old handlers would reference
// the old empty Set. Using `process.__psxRamApiState` ensures every handler instance
// (old and new) operates on the same shared state object.
type PsxRamApiState = {
  pendingBinary: Map<string, PendingBinary>;
  pendingJson: Map<string, PendingJson>;
  subscribers: Set<ServerResponse>;
  executionState: "running" | "paused";
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _proc = process as any;
const state: PsxRamApiState = (_proc.__psxRamApiState ??= {
  pendingBinary: new Map<string, PendingBinary>(),
  pendingJson: new Map<string, PendingJson>(),
  subscribers: new Set<ServerResponse>(),
  executionState: "running" as const,
});
const { pendingBinary, pendingJson, subscribers } = state;
function getExecutionState() { return state.executionState; }
function setExecutionState(s: "running" | "paused") { state.executionState = s; }

export function psxRamApiPlugin(): Plugin {
  function newReqId(): string {
    return Math.random().toString(36).slice(2);
  }

  function broadcast(payload: object): void {
    const msg = `data: ${JSON.stringify(payload)}\n\n`;
    for (const res of subscribers) {
      try { res.write(msg); }
      catch { subscribers.delete(res); }
    }
  }

  function withSubscribers(res: ServerResponse): boolean {
    if (subscribers.size === 0) { noGame(res); return false; }
    return true;
  }

  return {
    name: "psx-ram-api",
    apply: "serve",
    configureServer(server) {
      // ── Debug endpoint ──────────────────────────────────────────────────────
      server.middlewares.use("/api/v1/debug", (_req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ subscribers: state.subscribers.size, pendingBinary: state.pendingBinary.size, pendingJson: state.pendingJson.size }));
      });

      // ── SSE subscriber endpoint ─────────────────────────────────────────────
      server.middlewares.use(EVENTS_PATH, (req, res) => {
        if (req.method !== "GET") { res.statusCode = 405; res.end(); return; }
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.flushHeaders();
        subscribers.add(res);
        console.log(`[psx-api] SSE connected (${subscribers.size} total)`);
        req.on("close", () => {
          subscribers.delete(res);
          console.log(`[psx-api] SSE disconnected (${subscribers.size} remaining)`);
        });
      });

      // ── Binary RAM dump upload (GET /api/v1/cpu/ram/raw result) ────────────
      server.middlewares.use(UPLOAD_PATH, async (req, res) => {
        if (req.method !== "POST") { res.statusCode = 405; res.end(); return; }
        const url = new URL(req.url ?? "", "http://localhost");
        const reqId = url.searchParams.get("reqId") ?? "";
        const buf = await readBody(req);
        res.end("ok");
        pendingBinary.get(reqId)?.(buf);
      });

      // ── JSON result upload (poke / exec-flow / vram-write results) ──────────
      server.middlewares.use(RESULT_PATH, async (req, res) => {
        if (req.method !== "POST") { res.statusCode = 405; res.end(); return; }
        const url = new URL(req.url ?? "", "http://localhost");
        const reqId = url.searchParams.get("reqId") ?? "";
        const buf = await readBody(req);
        res.end("ok");
        try {
          pendingJson.get(reqId)?.(JSON.parse(buf.toString()));
        } catch {
          pendingJson.get(reqId)?.({ ok: false, error: "invalid json" });
        }
      });

      // ── GET /api/v1/cpu/ram/raw — Dump full PS1 RAM ─────────────────────────
      server.middlewares.use(RAM_RAW_PATH, async (req, res) => {
        if (req.method === "GET") {
          if (!withSubscribers(res)) return;
          const reqId = newReqId();
          console.log(`[psx-api] RAM dump ${reqId} → ${subscribers.size} subscriber(s)`);
          const timer = setTimeout(() => {
            pendingBinary.delete(reqId);
            noGame(res);
          }, TIMEOUT_MS);
          pendingBinary.set(reqId, (buf) => {
            clearTimeout(timer);
            pendingBinary.delete(reqId);
            res.setHeader("Content-Type", "application/octet-stream");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.end(buf);
          });
          broadcast({ type: "peek", reqId });
          return;
        }

        // POST /api/v1/cpu/ram/raw?offset=<n>&size=<n> — Write bytes to RAM
        if (req.method === "POST") {
          if (!withSubscribers(res)) return;
          const url = new URL(req.url ?? "", "http://localhost");
          const offsetStr = url.searchParams.get("offset") ?? "0";
          const offset = offsetStr.startsWith("0x") || offsetStr.startsWith("0X")
            ? parseInt(offsetStr, 16)
            : parseInt(offsetStr, 10);
          const body = await readBody(req);

          if (isNaN(offset) || offset < 0 || offset > 0x1fffff) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "bad_request", message: "offset must be in [0, 0x1FFFFF]" }));
            return;
          }
          if (offset + body.length > 0x200000) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "bad_request", message: "offset + size exceeds RAM bounds" }));
            return;
          }

          const reqId = newReqId();
          console.log(`[psx-api] RAM write ${reqId} offset=0x${offset.toString(16)} size=${body.length}`);
          const timer = setTimeout(() => {
            pendingJson.delete(reqId);
            noGame(res);
          }, TIMEOUT_MS);
          pendingJson.set(reqId, (result) => {
            clearTimeout(timer);
            pendingJson.delete(reqId);
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.end(JSON.stringify(result));
          });
          broadcast({ type: "poke", reqId, address: offset, data: Array.from(body) });
          return;
        }

        res.statusCode = 405; res.end();
      });

      // ── GET /api/v1/cpu/ram/search — Search RAM for a byte pattern ──────────
      //
      // Query params:
      //   pattern  (required) comma-separated bytes, each as decimal or 0x hex
      //            e.g. pattern=0,4,1  or  pattern=0x00,0x04,0x01
      //   offset   (optional) physical start offset into RAM, default 0
      //   size     (optional) number of bytes to search, default full RAM
      //
      // Returns: { matches: number[] }  — physical offsets of every occurrence
      server.middlewares.use(RAM_SEARCH_PATH, async (req, res) => {
        if (req.method !== "GET") { res.statusCode = 405; res.end(); return; }
        if (!withSubscribers(res)) return;

        const url = new URL(req.url ?? "", "http://localhost");

        const patternStr = url.searchParams.get("pattern") ?? "";
        if (!patternStr) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "bad_request", message: "pattern query param required, e.g. pattern=0,4,1" }));
          return;
        }
        const pattern: number[] = patternStr.split(",").map(s => {
          const t = s.trim();
          return t.startsWith("0x") || t.startsWith("0X") ? parseInt(t, 16) : parseInt(t, 10);
        });
        if (pattern.some(isNaN) || pattern.length === 0) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "bad_request", message: "pattern contains invalid byte values" }));
          return;
        }

        const offsetStr = url.searchParams.get("offset") ?? "0";
        const offset = offsetStr.startsWith("0x") || offsetStr.startsWith("0X")
          ? parseInt(offsetStr, 16) : parseInt(offsetStr, 10);
        const sizeStr = url.searchParams.get("size");
        const size = sizeStr
          ? (sizeStr.startsWith("0x") || sizeStr.startsWith("0X") ? parseInt(sizeStr, 16) : parseInt(sizeStr, 10))
          : (0x200000 - offset);

        if (isNaN(offset) || offset < 0 || offset >= 0x200000) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "bad_request", message: "offset out of range [0, 0x1FFFFF]" }));
          return;
        }

        const reqId = newReqId();
        console.log(`[psx-api] RAM search ${reqId} pattern=[${pattern.join(",")}] offset=0x${offset.toString(16)} size=0x${size.toString(16)}`);

        const timer = setTimeout(() => {
          pendingBinary.delete(reqId);
          noGame(res);
        }, TIMEOUT_MS);

        pendingBinary.set(reqId, (buf) => {
          clearTimeout(timer);
          pendingBinary.delete(reqId);
          const matches: number[] = [];
          const end = buf.length - pattern.length;
          outer: for (let i = 0; i <= end; i++) {
            for (let j = 0; j < pattern.length; j++) {
              if (buf[i + j] !== pattern[j]) continue outer;
            }
            matches.push(offset + i);
          }
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.end(JSON.stringify({ matches, pattern, offset, size: buf.length }));
        });

        broadcast({ type: "peek-range", reqId, offset, size });
      });

      // ── GET+POST /api/v1/execution-flow — Emulation status / control ────────
      server.middlewares.use(EXEC_FLOW_PATH, async (req, res) => {
        res.setHeader("Access-Control-Allow-Origin", "*");

        if (req.method === "GET") {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ status: getExecutionState() }));
          return;
        }

        if (req.method === "POST") {
          if (!withSubscribers(res)) return;
          const url = new URL(req.url ?? "", "http://localhost");
          const fn   = url.searchParams.get("function") ?? "";
          const type = url.searchParams.get("type") ?? "";

          if (!["pause", "start", "resume", "reset"].includes(fn)) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "bad_request", message: `Unknown function '${fn}'. Valid: pause, start, resume, reset` }));
            return;
          }

          const action = fn === "start" ? "resume" : fn; // redux uses both "start" and "resume"
          const reqId = newReqId();
          console.log(`[psx-api] exec-flow ${reqId} action=${action} type=${type}`);

          // Optimistically track state
          if (action === "pause")  setExecutionState("paused");
          if (action === "resume") setExecutionState("running");
          if (action === "reset")  setExecutionState("running");

          const timer = setTimeout(() => {
            pendingJson.delete(reqId);
            noGame(res);
          }, TIMEOUT_MS);
          pendingJson.set(reqId, (result) => {
            clearTimeout(timer);
            pendingJson.delete(reqId);
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(result));
          });
          broadcast({ type: "exec-flow", reqId, action, resetType: type || undefined });
          return;
        }

        res.statusCode = 405; res.end();
      });

      // ── GET /api/v1/gpu/vram/raw — Dump VRAM ────────────────────────────────
      server.middlewares.use(VRAM_RAW_PATH, async (req, res) => {
        res.setHeader("Access-Control-Allow-Origin", "*");

        if (req.method === "GET") {
          if (!withSubscribers(res)) return;
          const reqId = newReqId();
          console.log(`[psx-api] VRAM dump ${reqId}`);
          const timer = setTimeout(() => {
            pendingBinary.delete(reqId);
            noGame(res);
          }, TIMEOUT_MS);
          pendingBinary.set(reqId, (buf) => {
            clearTimeout(timer);
            pendingBinary.delete(reqId);
            res.setHeader("Content-Type", "application/octet-stream");
            res.end(buf);
          });
          broadcast({ type: "vram-peek", reqId });
          return;
        }

        if (req.method === "POST") {
          // POST /api/v1/gpu/vram/raw?x=&y=&width=&height= — Write VRAM rectangle
          const url = new URL(req.url ?? "", "http://localhost");
          const x = parseInt(url.searchParams.get("x") ?? "0", 10);
          const y = parseInt(url.searchParams.get("y") ?? "0", 10);
          const w = parseInt(url.searchParams.get("width")  ?? "0", 10);
          const h = parseInt(url.searchParams.get("height") ?? "0", 10);
          if ([x, y, w, h].some(isNaN) || w <= 0 || h <= 0 || x + w > 1024 || y + h > 512) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "bad_request", message: "Invalid VRAM rectangle. Must be within 1024×512." }));
            return;
          }
          const body = await readBody(req);
          if (body.length !== w * h * 2) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "bad_request", message: `Expected ${w * h * 2} bytes (width*height*2), got ${body.length}` }));
            return;
          }
          if (!withSubscribers(res)) return;
          const reqId = newReqId();
          const timer = setTimeout(() => { pendingJson.delete(reqId); noGame(res); }, TIMEOUT_MS);
          pendingJson.set(reqId, (result) => {
            clearTimeout(timer);
            pendingJson.delete(reqId);
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(result));
          });
          broadcast({ type: "vram-poke", reqId, x, y, width: w, height: h, data: Array.from(body) });
          return;
        }

        res.statusCode = 405; res.end();
      });

      // ── GET /api/v1/cd/files?filename= — Dump a file from the loaded disc ───
      server.middlewares.use(CD_FILES_PATH, (req, res) => {
        if (req.method !== "GET") { res.statusCode = 405; res.end(); return; }
        if (!withSubscribers(res)) return;
        const url = new URL(req.url ?? "", "http://localhost");
        const filename = url.searchParams.get("filename") ?? "";
        if (!filename) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "bad_request", message: "filename query param required" }));
          return;
        }
        const reqId = newReqId();
        console.log(`[psx-api] cd-file ${reqId} filename=${filename}`);
        const timer = setTimeout(() => {
          pendingBinary.delete(reqId);
          pendingJson.delete(reqId);
          noGame(res);
        }, TIMEOUT_MS);
        // Success: binary file data comes back via UPLOAD_PATH
        pendingBinary.set(reqId, (buf) => {
          clearTimeout(timer);
          pendingBinary.delete(reqId);
          pendingJson.delete(reqId);
          res.setHeader("Content-Type", "application/octet-stream");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.end(buf);
        });
        // Failure: JSON error comes back via RESULT_PATH
        pendingJson.set(reqId, (result) => {
          clearTimeout(timer);
          pendingBinary.delete(reqId);
          pendingJson.delete(reqId);
          res.statusCode = 404;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(result));
        });
        broadcast({ type: "cd-file", reqId, filename });
      });
    },
  };
}
