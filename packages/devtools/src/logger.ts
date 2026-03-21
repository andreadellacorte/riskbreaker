export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogRecord = {
  readonly scope: string;
  readonly level: LogLevel;
  readonly message: string;
  readonly meta?: unknown;
  readonly ts: number;
};

/** Collects structured logs for a future debug panel. */
export function createLogger(scope: string, sink: (r: LogRecord) => void = defaultSink) {
  return (level: LogLevel, message: string, meta?: unknown) => {
    sink({ scope, level, message, meta, ts: Date.now() });
  };
}

function defaultSink(record: LogRecord): void {
  void record;
}
