/**
 * lib/api/with-error-handler.ts
 *
 * Outermost wrapper - catches any error thrown by inner handlers and
 * converts it to a structured JSON error envelope.
 *
 * Response shape on error:
 *   { error: { code: string, message: string, details?: unknown } }
 *
 * Stack traces are included in dev only.
 */

import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "./errors";
import { log } from "@/lib/logger";
import type { AnyHandler } from "./compose";

export function withErrorHandler(handler: AnyHandler): AnyHandler {
  return async (req: NextRequest, ctx: unknown): Promise<Response> => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) {
        const body: Record<string, unknown> = {
          error: {
            code: err.code ?? "error",
            message: err.message,
            ...(err.details !== undefined ? { details: err.details } : {}),
          },
        };
        if (process.env.NODE_ENV !== "production" && err.stack) {
          (body.error as Record<string, unknown>).stack = err.stack;
        }
        return NextResponse.json(body, { status: err.status });
      }

      // Unknown / unexpected error
      const message = err instanceof Error ? err.message : String(err);
      log.error("unhandled_route_error", {
        message,
        path: req.nextUrl?.pathname,
        stack: err instanceof Error ? err.stack : undefined,
      });

      const body: Record<string, unknown> = {
        error: {
          code: "internal_error",
          message:
            process.env.NODE_ENV === "production"
              ? "Internal server error"
              : message,
        },
      };
      return NextResponse.json(body, { status: 500 });
    }
  };
}
