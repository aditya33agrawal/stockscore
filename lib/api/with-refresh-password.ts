/**
 * lib/api/with-refresh-password.ts
 *
 * Guards admin/pipeline routes behind the REFRESH_PASSWORD env var.
 * Reads the password from the `x-refresh-password` request header and
 * performs a constant-time comparison to prevent timing attacks.
 *
 * If REFRESH_PASSWORD is not set in the environment, the route is
 * unguarded (open access) — same behaviour as before.
 *
 * Usage:
 *   export const POST = compose(
 *     withErrorHandler,
 *     withMethods(["POST"]),
 *     withRefreshPassword,
 *   )(handler);
 *
 * Client must send:
 *   fetch("/api/refresh", {
 *     method: "POST",
 *     headers: { "x-refresh-password": password },
 *   });
 */

import { NextRequest } from "next/server";
import { ForbiddenError } from "./errors";
import type { AnyHandler } from "./compose";

/** Constant-time string comparison to prevent timing attacks. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function withRefreshPassword(handler: AnyHandler): AnyHandler {
  return async (req: NextRequest, ctx: unknown): Promise<Response> => {
    const expected = process.env.REFRESH_PASSWORD;
    // If no password is configured, the route is publicly accessible.
    if (!expected) return handler(req, ctx);

    const provided = req.headers.get("x-refresh-password") ?? "";
    if (!safeEqual(provided, expected)) {
      throw new ForbiddenError("Invalid refresh password");
    }
    return handler(req, ctx);
  };
}
