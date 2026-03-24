/**
 * save / load state via the pcsx worker postMessage channel.
 */

let reqCounter = 0;

function getWorker(): Worker | null {
  const g = globalThis as {
    __riskbreakerPcsxWorker?: Worker;
    __riskbreakerPcsxWorkerActive?: boolean;
  };
  if (!g.__riskbreakerPcsxWorker || !g.__riskbreakerPcsxWorkerActive) return null;
  return g.__riskbreakerPcsxWorker;
}

export function saveWorkerState(): Promise<Uint8Array> {
  const worker = getWorker();
  if (!worker) return Promise.reject(new Error("PCSX worker not active"));
  const reqId = ++reqCounter;
  return new Promise((resolve, reject) => {
    const onMsg = (event: MessageEvent) => {
      const d = event.data as { cmd: string; reqId: number; data?: Uint8Array; msg?: string };
      if (d.reqId !== reqId) return;
      worker.removeEventListener("message", onMsg);
      if (d.cmd === "savestate_result" && d.data) resolve(new Uint8Array(d.data));
      else reject(new Error(d.msg ?? "savestate failed"));
    };
    worker.addEventListener("message", onMsg);
    worker.postMessage({ cmd: "savestate", reqId });
  });
}

export function loadWorkerState(bytes: Uint8Array): Promise<void> {
  const worker = getWorker();
  if (!worker) return Promise.reject(new Error("PCSX worker not active"));
  const reqId = ++reqCounter;
  const copy = bytes.slice();
  return new Promise((resolve, reject) => {
    const onMsg = (event: MessageEvent) => {
      const d = event.data as { cmd: string; reqId: number; ok?: boolean; msg?: string };
      if (d.reqId !== reqId) return;
      worker.removeEventListener("message", onMsg);
      if (d.cmd === "loadstate_result") resolve();
      else reject(new Error(d.msg ?? "loadstate failed"));
    };
    worker.addEventListener("message", onMsg);
    worker.postMessage({ cmd: "loadstate", reqId, data: copy }, [copy.buffer]);
  });
}
