/**
 * RSK-wbmb: postMessage peek channel into the PCSX WASM worker.
 *
 * Sends `{ cmd: "peek", address, length, reqId }` to the worker and returns
 * a Promise that resolves with the raw bytes read from HEAPU8.
 *
 * Requires `globalThis.__riskbreakerPcsxWorker` to be set (done in pcsx_ui.js
 * after `new Worker("pcsx_worker.js")`).
 *
 * **Addressing:** `address` is an offset into the WASM linear memory (HEAPU8),
 * NOT a PS1 virtual address. Translation from PS1 virtual → WASM offset is a
 * separate concern tracked in docs/emulator-runtime-gaps.md.
 */

type PeekGlobal = typeof globalThis & {
  __riskbreakerPcsxWorker?: Worker;
  __riskbreakerPcsxWorkerActive?: boolean;
};

let reqCounter = 0;

export function peekWorkerMemory(address: number, length: number): Promise<Uint8Array> {
  const g = globalThis as PeekGlobal;
  const worker = g.__riskbreakerPcsxWorker;
  if (!worker || !g.__riskbreakerPcsxWorkerActive) {
    return Promise.reject(new Error("peekWorkerMemory: PCSX worker not active"));
  }
  const reqId = ++reqCounter;
  return new Promise<Uint8Array>((resolve, reject) => {
    const onMsg = (event: MessageEvent): void => {
      const d = event.data as { cmd?: string; reqId?: number; data?: Uint8Array; msg?: string };
      if (d.reqId !== reqId) return;
      worker.removeEventListener("message", onMsg);
      if (d.cmd === "peek_result" && d.data instanceof Uint8Array) {
        resolve(d.data);
      } else {
        reject(new Error(d.msg ?? "peek failed"));
      }
    };
    worker.addEventListener("message", onMsg);
    worker.postMessage({ cmd: "peek", address, length, reqId });
  });
}
