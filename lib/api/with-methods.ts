/**
 * lib/api/with-methods.ts
 *
 * Returns a 405 Method Not Allowed response with an `Allow` header if the
 * incoming request method is not in the allowed list.
 *
 * Usage:
 *   export const POST = compose(withErrorHandler, withMethods(["POST"]))(handler);
 *
 * Note: Next.js App Router already returns 405 for unexported HTTP methods,
 * so withMethods is most useful for routes that export a single handler or to
 * return a well-formed Allow header.
 */

import { NextRequest } from "next/server";
import { MethodNotAllowedError } from "./errors";
import type { AnyHandler } from "./compose";

export function withMethods(allowed: string[]): (handler: AnyHandler) => AnyHandler {
  const allowedUpper = allowed.map((m) => m.toUpperCase());
  return (handler: AnyHandler): AnyHandler => {
    return async (req: NextRequest, ctx: unknown): Promise<Response> => {
      if (!allowedUpper.includes(req.method.toUpperCase())) {
        throw new MethodNotAllowedError(allowedUpper);
      }
      return handler(req, ctx);
    };
  };
}
