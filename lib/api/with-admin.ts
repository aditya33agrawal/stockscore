import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { UnauthorizedError, ForbiddenError } from "./errors";
import type { AnyHandler } from "./compose";

export function withAdmin(handler: AnyHandler): AnyHandler {
  return async (req: NextRequest, ctx: Record<string, unknown>): Promise<Response> => {
    const user = await getCurrentUser();
    if (!user) throw new UnauthorizedError();
    if (!isAdminEmail(user.email)) throw new ForbiddenError();
    return handler(req, { ...ctx, user });
  };
}
