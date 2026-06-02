/**
 * lib/api/with-auth.ts
 *
 * Requires a valid session cookie. Throws UnauthorizedError (→ 401) if
 * the user is not signed in. Injects `user: SessionUser` into ctx so the
 * handler can access it.
 *
 * Usage:
 *   export const GET = compose(withErrorHandler, withAuth)(
 *     async (req, { user }) => { ... }
 *   );
 */

import { NextRequest } from "next/server";
import { getCurrentUser, type SessionUser } from "@/lib/auth";
import { UnauthorizedError } from "./errors";
import type { AnyHandler } from "./compose";

export function withAuth(handler: AnyHandler): AnyHandler {
  return async (req: NextRequest, ctx: Record<string, unknown>): Promise<Response> => {
    const user: SessionUser | null = await getCurrentUser();
    if (!user) throw new UnauthorizedError();
    return handler(req, { ...ctx, user });
  };
}
