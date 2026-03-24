import * as fs from "fs";
import type { Page } from "@playwright/test";

/**
 * Load a pcsx-wasm save state fixture into the running emulator.
 * The page must already have the pcsx-wasm shell loaded and the worker active.
 */
export async function loadPcsxState(page: Page, fixturePath: string): Promise<void> {
  const bytes = Array.from(fs.readFileSync(fixturePath));
  await page.evaluate(async (bytes: number[]) => {
    const { loadWorkerState } = await import("/pcsx-wasm/js/riskbreaker-pcsx-wasm-boot.js");
    // fallback: use the global helper exposed by the boot script
    const g = globalThis as { __riskbreakerLoadState?: (b: Uint8Array) => Promise<void> };
    if (g.__riskbreakerLoadState) {
      await g.__riskbreakerLoadState(new Uint8Array(bytes));
    }
  }, bytes);
}
