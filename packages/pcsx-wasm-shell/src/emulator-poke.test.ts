import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pokeWorkerMemory } from "./emulator-poke.js";

type PokeGlobal = typeof globalThis & {
  __riskbreakerPcsxWorker?: unknown;
  __riskbreakerPcsxWorkerActive?: boolean;
};

function makeMockWorker() {
  const listeners: ((e: MessageEvent) => void)[] = [];
  return {
    postMessage: vi.fn(),
    addEventListener: vi.fn((_: string, fn: (e: MessageEvent) => void) => {
      listeners.push(fn);
    }),
    removeEventListener: vi.fn((_: string, fn: (e: MessageEvent) => void) => {
      const i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    }),
    emit(data: object) {
      const evt = { data } as MessageEvent;
      for (const fn of [...listeners]) fn(evt);
    },
  };
}

describe("pokeWorkerMemory", () => {
  let worker: ReturnType<typeof makeMockWorker>;
  const g = globalThis as PokeGlobal;

  beforeEach(() => {
    worker = makeMockWorker();
    g.__riskbreakerPcsxWorker = worker;
    g.__riskbreakerPcsxWorkerActive = true;
  });

  afterEach(() => {
    delete g.__riskbreakerPcsxWorker;
    delete g.__riskbreakerPcsxWorkerActive;
  });

  it("rejects when worker not active", async () => {
    g.__riskbreakerPcsxWorkerActive = false;
    await expect(pokeWorkerMemory(0, new Uint8Array([1]))).rejects.toThrow("not active");
  });

  it("rejects when worker not set", async () => {
    delete g.__riskbreakerPcsxWorker;
    await expect(pokeWorkerMemory(0, new Uint8Array([1]))).rejects.toThrow("not active");
  });

  it("resolves on poke_result ok=true", async () => {
    const p = pokeWorkerMemory(0x1000, new Uint8Array([0xab, 0xcd]));
    const call = worker.postMessage.mock.calls[0][0] as { reqId: number; cmd: string; address: number };
    expect(call.cmd).toBe("poke");
    expect(call.address).toBe(0x1000);
    worker.emit({ cmd: "poke_result", reqId: call.reqId, ok: true });
    await expect(p).resolves.toBeUndefined();
  });

  it("rejects on poke_result ok=false", async () => {
    const p = pokeWorkerMemory(0, new Uint8Array([1]));
    const { reqId } = worker.postMessage.mock.calls[0][0] as { reqId: number };
    worker.emit({ cmd: "poke_result", reqId, ok: false, msg: "write failed" });
    await expect(p).rejects.toThrow("write failed");
  });

  it("rejects with default message when msg missing", async () => {
    const p = pokeWorkerMemory(0, new Uint8Array([1]));
    const { reqId } = worker.postMessage.mock.calls[0][0] as { reqId: number };
    worker.emit({ cmd: "bad", reqId });
    await expect(p).rejects.toThrow("poke failed");
  });

  it("ignores messages with wrong reqId", async () => {
    const p = pokeWorkerMemory(0, new Uint8Array([1]));
    const { reqId } = worker.postMessage.mock.calls[0][0] as { reqId: number };
    worker.emit({ cmd: "poke_result", reqId: reqId + 999, ok: true });
    worker.emit({ cmd: "poke_result", reqId, ok: true });
    await expect(p).resolves.toBeUndefined();
  });

  it("transfers data as an ArrayBuffer", async () => {
    const p = pokeWorkerMemory(0, new Uint8Array([1, 2, 3]));
    const call = worker.postMessage.mock.calls[0];
    // second arg to postMessage should be transfer list
    expect(call[1]).toBeInstanceOf(Array);
    expect(call[1][0]).toBeInstanceOf(ArrayBuffer);
    const { reqId } = call[0] as { reqId: number };
    worker.emit({ cmd: "poke_result", reqId, ok: true });
    await p;
  });
});
