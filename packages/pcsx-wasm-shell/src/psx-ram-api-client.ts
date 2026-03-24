/**
 * Dev-mode client: subscribes to /api/v1/psxram-events (SSE) and handles
 * peek, poke, VRAM, and execution-flow requests from the Vite dev server.
 *
 * Implements the browser-side of the PCSX-Redux-compatible REST API.
 * Reference: https://pcsx-redux.consoledev.net/web_server/
 *
 * Works on any page served by the Vite dev server — no import.meta.hot needed.
 */

import { peekWorkerVram, peekCdFile } from "./emulator-peek.js";
import { pokeWorkerMemory } from "./emulator-poke.js";

const PSX_MAIN_RAM_SIZE  = 2 * 1024 * 1024;
const PSX_VRAM_SIZE      = 1024 * 512 * 2; // 16bpp
const EVENTS_PATH        = "/api/v1/psxram-events";
const UPLOAD_PATH        = "/api/v1/psxram-upload";
const RESULT_PATH        = "/api/v1/psxram-result";

type EmulatorHost = { peek?: (a: number, l: number) => Promise<Uint8Array> };
type PcsxGlobals  = typeof globalThis & {
  __riskbreakerEmulatorHost?: EmulatorHost;
  __riskbreakerPcsxPause?:  () => void;
  __riskbreakerPcsxResume?: () => void;
  __riskbreakerPcsxWorker?: Worker;
};

type SseEvent =
  | { type: "peek";      reqId: string }
  | { type: "poke";      reqId: string; address: number; data: number[] }
  | { type: "vram-peek"; reqId: string }
  | { type: "vram-poke"; reqId: string; x: number; y: number; width: number; height: number; data: number[] }
  | { type: "exec-flow"; reqId: string; action: "pause" | "resume" | "reset"; resetType?: string }
  | { type: "cd-file";   reqId: string; filename: string };

function getHost(): EmulatorHost | undefined {
  return (globalThis as PcsxGlobals).__riskbreakerEmulatorHost;
}

async function postBinary(reqId: string, bytes: Uint8Array): Promise<void> {
  await fetch(`${UPLOAD_PATH}?reqId=${encodeURIComponent(reqId)}`, {
    method: "POST",
    body: bytes,
    headers: { "Content-Type": "application/octet-stream" },
  });
}

async function postResult(reqId: string, result: unknown): Promise<void> {
  await fetch(`${RESULT_PATH}?reqId=${encodeURIComponent(reqId)}`, {
    method: "POST",
    body: JSON.stringify(result),
    headers: { "Content-Type": "application/json" },
  });
}

// ── Handler: GET /api/v1/cpu/ram/raw ────────────────────────────────────────

async function handlePeek(reqId: string): Promise<void> {
  const host = getHost();
  if (!host?.peek) {
    console.warn("[psxram-api] emulator host not ready");
    return;
  }
  try {
    const bytes = await host.peek(0, PSX_MAIN_RAM_SIZE);
    await postBinary(reqId, bytes);
  } catch (err) {
    console.error("[psxram-api] peek failed:", err);
  }
}

// ── Handler: POST /api/v1/cpu/ram/raw ───────────────────────────────────────

async function handlePoke(reqId: string, address: number, data: number[]): Promise<void> {
  try {
    await pokeWorkerMemory(address, new Uint8Array(data));
    await postResult(reqId, { ok: true });
  } catch (err) {
    console.error("[psxram-api] poke failed:", err);
    await postResult(reqId, { ok: false, error: String(err) }).catch(() => undefined);
  }
}

// ── Handler: GET /api/v1/gpu/vram/raw ───────────────────────────────────────

async function handleVramPeek(reqId: string): Promise<void> {
  try {
    const bytes = await peekWorkerVram();
    await postBinary(reqId, bytes);
  } catch (err) {
    console.error("[psxram-api] VRAM peek failed:", err);
    // Return zeroed buffer so the server doesn't time out
    await postBinary(reqId, new Uint8Array(PSX_VRAM_SIZE));
  }
}

// ── Handler: POST /api/v1/gpu/vram/raw ──────────────────────────────────────

async function handleVramPoke(reqId: string, _x: number, _y: number, _w: number, _h: number, _data: number[]): Promise<void> {
  // VRAM writes not yet plumbed in the worker — acknowledge so callers don't hang.
  console.warn("[psxram-api] VRAM write not yet implemented");
  await postResult(reqId, { ok: false, error: "vram_write_not_implemented" }).catch(() => undefined);
}

// ── Handler: GET /api/v1/cd/files ───────────────────────────────────────────

async function handleCdFile(reqId: string, filename: string): Promise<void> {
  try {
    const bytes = await peekCdFile(filename);
    await postBinary(reqId, bytes);
  } catch (err) {
    console.error("[psxram-api] cd-file failed:", err);
    await postResult(reqId, { ok: false, error: String(err) }).catch(() => undefined);
  }
}

// ── Handler: POST /api/v1/execution-flow ────────────────────────────────────

async function handleExecFlow(reqId: string, action: string, resetType?: string): Promise<void> {
  const g = globalThis as PcsxGlobals;
  try {
    if (action === "pause") {
      g.__riskbreakerPcsxPause?.();
    } else if (action === "resume") {
      g.__riskbreakerPcsxResume?.();
    } else if (action === "reset") {
      // Hard/soft reset: reinitialize the worker if possible.
      // Not yet fully implemented — acknowledge optimistically.
      console.warn(`[psxram-api] reset (type=${resetType ?? "hard"}) not yet fully implemented`);
    }
    await postResult(reqId, { ok: true, action });
  } catch (err) {
    await postResult(reqId, { ok: false, error: String(err) }).catch(() => undefined);
  }
}

// ── SSE event dispatcher ────────────────────────────────────────────────────

function handleSseEvent(raw: string): void {
  let ev: SseEvent;
  try {
    const parsed = JSON.parse(raw) as Partial<SseEvent> & { reqId?: string };
    // Legacy format: bare { reqId } — treat as peek
    if (!parsed.type) {
      ev = { type: "peek", reqId: parsed.reqId ?? "" };
    } else {
      ev = parsed as SseEvent;
    }
  } catch {
    return;
  }

  switch (ev.type) {
    case "peek":
      void handlePeek(ev.reqId);
      break;
    case "poke":
      void handlePoke(ev.reqId, ev.address, ev.data);
      break;
    case "vram-peek":
      void handleVramPeek(ev.reqId);
      break;
    case "vram-poke":
      void handleVramPoke(ev.reqId, ev.x, ev.y, ev.width, ev.height, ev.data);
      break;
    case "exec-flow":
      void handleExecFlow(ev.reqId, ev.action, ev.resetType);
      break;
    case "cd-file":
      void handleCdFile(ev.reqId, ev.filename);
      break;
  }
}

// ── Install ──────────────────────────────────────────────────────────────────

export function installPsxRamApiClient(): void {
  // Use import.meta.hot if available (Vite-processed pages)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hot = (import.meta as any).hot;
  if (hot) {
    hot.on("psxram-request", ({ reqId }: { reqId: string }) => handlePeek(reqId));
    console.log("[psxram-api] registered via import.meta.hot");
    return;
  }

  // Fallback: SSE (works on pre-built static pages like pcsx-wasm/index.html)
  // Auto-reconnects: EventSource natively retries on error; we just log it.
  // Do NOT call es.close() on error — that permanently kills the connection.
  const es = new EventSource(EVENTS_PATH);
  es.addEventListener("message", (ev) => handleSseEvent(ev.data as string));
  es.addEventListener("open", () =>
    console.log("[psxram-api] registered via SSE (peek / poke / vram / exec-flow)"),
  );
  es.addEventListener("error", () => {
    console.warn("[psxram-api] SSE error — will auto-reconnect when dev server is available");
  });
}
