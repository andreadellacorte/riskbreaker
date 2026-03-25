import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadWorkerState, saveWorkerState } from "./emulator-savestate.js";

type SaveGlobal = typeof globalThis & {
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

describe("saveWorkerState", () => {
  let worker: ReturnType<typeof makeMockWorker>;
  const g = globalThis as SaveGlobal;

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
    await expect(saveWorkerState()).rejects.toThrow("not active");
  });

  it("rejects when worker not set", async () => {
    delete g.__riskbreakerPcsxWorker;
    await expect(saveWorkerState()).rejects.toThrow("not active");
  });

  it("resolves with Uint8Array on savestate_result", async () => {
    const data = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
    const p = saveWorkerState();
    const { reqId } = worker.postMessage.mock.calls[0][0] as { reqId: number };
    worker.emit({ cmd: "savestate_result", reqId, data });
    const result = await p;
    expect(result).toBeInstanceOf(Uint8Array);
    expect(Array.from(result)).toEqual([0xde, 0xad, 0xbe, 0xef]);
  });

  it("rejects on non-savestate_result cmd", async () => {
    const p = saveWorkerState();
    const { reqId } = worker.postMessage.mock.calls[0][0] as { reqId: number };
    worker.emit({ cmd: "error", reqId, msg: "save failed" });
    await expect(p).rejects.toThrow("save failed");
  });

  it("rejects with default message when msg missing", async () => {
    const p = saveWorkerState();
    const { reqId } = worker.postMessage.mock.calls[0][0] as { reqId: number };
    worker.emit({ cmd: "bad", reqId });
    await expect(p).rejects.toThrow("savestate failed");
  });

  it("ignores messages with wrong reqId", async () => {
    const data = new Uint8Array([1]);
    const p = saveWorkerState();
    const { reqId } = worker.postMessage.mock.calls[0][0] as { reqId: number };
    worker.emit({ cmd: "savestate_result", reqId: reqId + 999, data: new Uint8Array([0]) });
    worker.emit({ cmd: "savestate_result", reqId, data });
    await expect(p).resolves.toBeInstanceOf(Uint8Array);
  });

  it("rejects when savestate_result has no data", async () => {
    const p = saveWorkerState();
    const { reqId } = worker.postMessage.mock.calls[0][0] as { reqId: number };
    worker.emit({ cmd: "savestate_result", reqId }); // no data field
    await expect(p).rejects.toThrow("savestate failed");
  });

  it("posts cmd=savestate", async () => {
    const p = saveWorkerState();
    const call = worker.postMessage.mock.calls[0][0] as { cmd: string };
    expect(call.cmd).toBe("savestate");
    const { reqId } = call as { reqId: number };
    worker.emit({ cmd: "savestate_result", reqId, data: new Uint8Array(0) });
    await p;
  });
});

describe("loadWorkerState", () => {
  let worker: ReturnType<typeof makeMockWorker>;
  const g = globalThis as SaveGlobal;

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
    await expect(loadWorkerState(new Uint8Array([1]))).rejects.toThrow("not active");
  });

  it("resolves on loadstate_result", async () => {
    const p = loadWorkerState(new Uint8Array([1, 2, 3]));
    const { reqId } = worker.postMessage.mock.calls[0][0] as { reqId: number };
    worker.emit({ cmd: "loadstate_result", reqId });
    await expect(p).resolves.toBeUndefined();
  });

  it("rejects on error cmd", async () => {
    const p = loadWorkerState(new Uint8Array([1]));
    const { reqId } = worker.postMessage.mock.calls[0][0] as { reqId: number };
    worker.emit({ cmd: "error", reqId, msg: "load failed" });
    await expect(p).rejects.toThrow("load failed");
  });

  it("rejects with default message when msg missing", async () => {
    const p = loadWorkerState(new Uint8Array([1]));
    const { reqId } = worker.postMessage.mock.calls[0][0] as { reqId: number };
    worker.emit({ cmd: "bad", reqId });
    await expect(p).rejects.toThrow("loadstate failed");
  });

  it("posts cmd=loadstate with data transfer", async () => {
    const p = loadWorkerState(new Uint8Array([0xaa, 0xbb]));
    const call = worker.postMessage.mock.calls[0];
    expect((call[0] as { cmd: string }).cmd).toBe("loadstate");
    expect(call[1]).toBeInstanceOf(Array);
    const { reqId } = call[0] as { reqId: number };
    worker.emit({ cmd: "loadstate_result", reqId });
    await p;
  });
});
