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

function getWorker(): Worker {
  const g = globalThis as PeekGlobal;
  if (!g.__riskbreakerPcsxWorker || !g.__riskbreakerPcsxWorkerActive) {
    throw new Error("peekWorkerMemory: PCSX worker not active");
  }
  return g.__riskbreakerPcsxWorker;
}

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

/** Dump the full 1024×512 16bpp VRAM (2 MB) from the PCSX worker. */
export function peekWorkerVram(): Promise<Uint8Array> {
  const worker = getWorker();
  const reqId = ++reqCounter;
  return new Promise<Uint8Array>((resolve, reject) => {
    const onMsg = (event: MessageEvent): void => {
      const d = event.data as { cmd?: string; reqId?: number; data?: Uint8Array; msg?: string };
      if (d.reqId !== reqId) return;
      worker.removeEventListener("message", onMsg);
      if (d.cmd === "vram_result" && d.data instanceof Uint8Array) {
        resolve(d.data);
      } else {
        reject(new Error(d.msg ?? "vram peek failed"));
      }
    };
    worker.addEventListener("message", onMsg);
    worker.postMessage({ cmd: "vram", reqId });
  });
}

/**
 * Read a file from the Emscripten virtual filesystem (disc image).
 * `filename` should be the bare filename as it appears in the ISO root,
 * e.g. `"SYSTEM.CNF;1"`. Returns the raw file bytes.
 */
export function peekCdFile(filename: string): Promise<Uint8Array> {
  const worker = getWorker();
  const reqId = ++reqCounter;
  return new Promise<Uint8Array>((resolve, reject) => {
    const onMsg = (event: MessageEvent): void => {
      const d = event.data as { cmd?: string; reqId?: number; data?: Uint8Array; msg?: string };
      if (d.reqId !== reqId) return;
      worker.removeEventListener("message", onMsg);
      if (d.cmd === "cd-file_result" && d.data instanceof Uint8Array) {
        resolve(d.data);
      } else {
        reject(new Error(d.msg ?? "cd-file read failed"));
      }
    };
    worker.addEventListener("message", onMsg);
    worker.postMessage({ cmd: "cd-file", filename, reqId });
  });
}
