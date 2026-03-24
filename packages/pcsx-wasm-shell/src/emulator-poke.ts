/**
 * postMessage poke channel into the PCSX WASM worker.
 *
 * Sends `{ cmd: "poke", address, data, reqId }` to the worker and returns
 * a Promise that resolves when the write is confirmed.
 *
 * `address` is a physical PS1 RAM offset (virtual & 0x1fffff).
 */

type PokeGlobal = typeof globalThis & {
  __riskbreakerPcsxWorker?: Worker;
  __riskbreakerPcsxWorkerActive?: boolean;
};

let reqCounter = 0;

export function pokeWorkerMemory(address: number, data: Uint8Array): Promise<void> {
  const g = globalThis as PokeGlobal;
  const worker = g.__riskbreakerPcsxWorker;
  if (!worker || !g.__riskbreakerPcsxWorkerActive) {
    return Promise.reject(new Error("pokeWorkerMemory: PCSX worker not active"));
  }
  const reqId = ++reqCounter;
  return new Promise<void>((resolve, reject) => {
    const onMsg = (event: MessageEvent): void => {
      const d = event.data as { cmd?: string; reqId?: number; ok?: boolean; msg?: string };
      if (d.reqId !== reqId) return;
      worker.removeEventListener("message", onMsg);
      if (d.cmd === "poke_result" && d.ok) {
        resolve();
      } else {
        reject(new Error(d.msg ?? "poke failed"));
      }
    };
    worker.addEventListener("message", onMsg);
    // Transfer ownership of the buffer for efficiency
    const copy = new Uint8Array(data);
    worker.postMessage({ cmd: "poke", address, data: copy.buffer, reqId }, [copy.buffer]);
  });
}
