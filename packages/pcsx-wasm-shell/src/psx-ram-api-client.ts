/**
 * Dev-mode client: subscribes to /api/v1/psxram-events (SSE) and uploads
 * 2 MB of PS1 RAM to /api/v1/psxram-upload so the dev server can serve it.
 *
 * Works on any page served by the Vite dev server — no import.meta.hot needed.
 * The SSE connection is only opened when the Vite dev server is reachable
 * (i.e., this is a no-op in production builds where the module is dead-code-
 * eliminated or the endpoint doesn't exist).
 */

const PSX_MAIN_RAM_SIZE = 2 * 1024 * 1024;
const EVENTS_PATH = "/api/v1/psxram-events";

type EmulatorHost = { peek?: (a: number, l: number) => Promise<Uint8Array> };

function getHost(): EmulatorHost | undefined {
  return (globalThis as { __riskbreakerEmulatorHost?: EmulatorHost })
    .__riskbreakerEmulatorHost;
}

async function handlePsxRamRequest(reqId: string): Promise<void> {
  const host = getHost();
  if (!host?.peek) {
    console.warn("[psxram-api] emulator host not ready — disc may not be loaded yet");
    return;
  }
  try {
    const bytes = await host.peek(0, PSX_MAIN_RAM_SIZE);
    await fetch(`/api/v1/psxram-upload?reqId=${encodeURIComponent(reqId)}`, {
      method: "POST",
      body: bytes,
      headers: { "Content-Type": "application/octet-stream" },
    });
  } catch (err) {
    console.error("[psxram-api] upload failed:", err);
  }
}

export function installPsxRamApiClient(): void {
  // Use import.meta.hot if available (Vite-processed pages)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hot = (import.meta as any).hot;
  if (hot) {
    hot.on("psxram-request", ({ reqId }: { reqId: string }) =>
      handlePsxRamRequest(reqId),
    );
    console.log("[psxram-api] registered via import.meta.hot");
    return;
  }

  // Fallback: SSE (works on pre-built static pages like pcsx-wasm/index.html)
  const es = new EventSource(EVENTS_PATH);
  es.addEventListener("message", (ev) => {
    try {
      const { reqId } = JSON.parse(ev.data as string) as { reqId: string };
      void handlePsxRamRequest(reqId);
    } catch {
      // ignore malformed frames
    }
  });
  es.addEventListener("open", () =>
    console.log("[psxram-api] registered via SSE"),
  );
  es.addEventListener("error", () => {
    console.warn("[psxram-api] SSE connection failed — RAM API unavailable (dev server only)");
    es.close();
  });
}
