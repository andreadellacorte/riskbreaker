import type { IInputInjector } from "./contracts.js";

export class MockInputInjector implements IInputInjector {
  private readonly queue: string[] = [];

  enqueue(steps: readonly string[]): void {
    this.queue.push(...steps);
  }

  /** Test hook: drain queued labels without a real controller stack. */
  drain(): string[] {
    const out = [...this.queue];
    this.queue.length = 0;
    return out;
  }
}
