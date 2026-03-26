import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { peekCdFile, peekWorkerMemory, peekWorkerVram } from "./emulator-peek.js";

type PeekGlobal = typeof globalThis & {
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
    listeners,
  };
}

describe("peekWorkerMemory", () => {
  let worker: ReturnType<typeof makeMockWorker>;
  const g = globalThis as PeekGlobal;

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
    await expect(peekWorkerMemory(0, 4)).rejects.toThrow("not active");
  });

  it("rejects when worker not set", async () => {
    delete g.__riskbreakerPcsxWorker;
    await expect(peekWorkerMemory(0, 4)).rejects.toThrow("not active");
  });

  it("resolves with data on peek_result", async () => {
    const data = new Uint8Array([1, 2, 3, 4]);
    const p = peekWorkerMemory(0x1000, 4);
    // reqId is incremented per call — capture from postMessage call
    const { reqId } = worker.postMessage.mock.calls[0][0] as { reqId: number };
    worker.emit({ cmd: "peek_result", reqId, data });
    await expect(p).resolves.toEqual(data);
  });

  it("rejects on non-peek_result cmd", async () => {
    const p = peekWorkerMemory(0, 4);
    const { reqId } = worker.postMessage.mock.calls[0][0] as { reqId: number };
    worker.emit({ cmd: "peek_error", reqId, msg: "fail" });
    await expect(p).rejects.toThrow("fail");
  });

  it("ignores messages with wrong reqId", async () => {
    const data = new Uint8Array([0xab]);
    const p = peekWorkerMemory(0, 1);
    const { reqId } = worker.postMessage.mock.calls[0][0] as { reqId: number };
    worker.emit({ cmd: "peek_result", reqId: reqId + 999, data: new Uint8Array([0xff]) });
    worker.emit({ cmd: "peek_result", reqId, data });
    await expect(p).resolves.toEqual(data);
  });

  it("sends correct postMessage", async () => {
    const p = peekWorkerMemory(0x8000, 16);
    const call = worker.postMessage.mock.calls[0][0] as { cmd: string; address: number; length: number };
    expect(call.cmd).toBe("peek");
    expect(call.address).toBe(0x8000);
    expect(call.length).toBe(16);
    // resolve to avoid unhandled rejection
    const { reqId } = call as unknown as { reqId: number };
    worker.emit({ cmd: "peek_result", reqId, data: new Uint8Array(16) });
    await p;
  });
});

describe("peekWorkerVram", () => {
  let worker: ReturnType<typeof makeMockWorker>;
  const g = globalThis as PeekGlobal;

  beforeEach(() => {
    worker = makeMockWorker();
    g.__riskbreakerPcsxWorker = worker;
    g.__riskbreakerPcsxWorkerActive = true;
  });

  afterEach(() => {
    delete g.__riskbreakerPcsxWorker;
    delete g.__riskbreakerPcsxWorkerActive;
  });

  it("throws when worker not active (worker set, active=false)", () => {
    g.__riskbreakerPcsxWorkerActive = false;
    expect(() => peekWorkerVram()).toThrow("not active");
  });

  it("throws when worker not set", () => {
    delete g.__riskbreakerPcsxWorker;
    expect(() => peekWorkerVram()).toThrow("not active");
  });

  it("resolves with data on vram_result", async () => {
    const data = new Uint8Array(1024 * 512 * 2);
    data[0] = 0xde;
    const p = peekWorkerVram();
    const { reqId } = worker.postMessage.mock.calls[0][0] as { reqId: number };
    worker.emit({ cmd: "vram_result", reqId, data });
    await expect(p).resolves.toBe(data);
  });

  it("rejects on error cmd", async () => {
    const p = peekWorkerVram();
    const { reqId } = worker.postMessage.mock.calls[0][0] as { reqId: number };
    worker.emit({ cmd: "vram_error", reqId, msg: "vram not ready" });
    await expect(p).rejects.toThrow("vram not ready");
  });

  it("rejects with default message when msg missing", async () => {
    const p = peekWorkerVram();
    const { reqId } = worker.postMessage.mock.calls[0][0] as { reqId: number };
    worker.emit({ cmd: "bad", reqId });
    await expect(p).rejects.toThrow("vram peek failed");
  });
});

describe("peekCdFile", () => {
  let worker: ReturnType<typeof makeMockWorker>;
  const g = globalThis as PeekGlobal;

  beforeEach(() => {
    worker = makeMockWorker();
    g.__riskbreakerPcsxWorker = worker;
    g.__riskbreakerPcsxWorkerActive = true;
  });

  afterEach(() => {
    delete g.__riskbreakerPcsxWorker;
    delete g.__riskbreakerPcsxWorkerActive;
  });

  it("throws when worker not active", () => {
    g.__riskbreakerPcsxWorkerActive = false;
    expect(() => peekCdFile("X.BIN;1")).toThrow("not active");
  });

  it("resolves with file bytes on cd-file_result", async () => {
    const data = new Uint8Array([0x01, 0x02]);
    const p = peekCdFile("SYSTEM.CNF;1");
    const call = worker.postMessage.mock.calls[0][0] as { reqId: number; cmd: string; filename: string };
    expect(call.cmd).toBe("cd-file");
    expect(call.filename).toBe("SYSTEM.CNF;1");
    worker.emit({ cmd: "cd-file_result", reqId: call.reqId, data });
    await expect(p).resolves.toBe(data);
  });

  it("rejects on error", async () => {
    const p = peekCdFile("MISSING.BIN;1");
    const { reqId } = worker.postMessage.mock.calls[0][0] as { reqId: number };
    worker.emit({ cmd: "cd-file_error", reqId, msg: "not found" });
    await expect(p).rejects.toThrow("not found");
  });
});
