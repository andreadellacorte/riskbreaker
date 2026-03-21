export type TimelineEvent = {
  readonly ts: number;
  readonly kind: string;
  readonly payload?: unknown;
};

export class EventTimeline {
  private readonly events: TimelineEvent[] = [];

  push(event: Omit<TimelineEvent, "ts"> & { ts?: number }): void {
    this.events.push({
      ts: event.ts ?? Date.now(),
      kind: event.kind,
      payload: event.payload,
    });
  }

  all(): readonly TimelineEvent[] {
    return this.events;
  }

  clear(): void {
    this.events.length = 0;
  }
}
