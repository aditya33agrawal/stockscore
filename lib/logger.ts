/**
 * lib/logger.ts
 *
 * Shared structured JSON logger. One line per call, emitted to stdout.
 * Works in both Node.js (route handlers) and Edge Runtime (middleware).
 *
 * Format: { ts, level, msg, ...meta }
 */

type Level = "debug" | "info" | "warn" | "error";

function emit(level: Level, msg: string, meta?: Record<string, unknown>): void {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      level,
      msg,
      ...(meta ?? {}),
    })
  );
}

export const log = {
  debug: (msg: string, meta?: Record<string, unknown>) => emit("debug", msg, meta),
  info:  (msg: string, meta?: Record<string, unknown>) => emit("info",  msg, meta),
  warn:  (msg: string, meta?: Record<string, unknown>) => emit("warn",  msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => emit("error", msg, meta),
};
