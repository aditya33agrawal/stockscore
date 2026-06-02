/**
 * lib/api/compose.ts
 *
 * Tiny compose helper for Next.js App Router route handlers.
 *
 * Usage:
 *   export const POST = compose(
 *     withErrorHandler,
 *     withMethods(["POST"]),
 *     withAuth,
 *     withSchema(MySchema),
 *   )(async (req, { user, body }) => {
 *     ...
 *     return NextResponse.json({ ok: true });
 *   });
 *
 * Order: outermost wrapper is listed FIRST. The handler is always the
 * argument to `compose(...)()`.
 *
 * compose(f, g, h)(handler) === f(g(h(handler)))
 */

import type { NextRequest } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyHandler = (req: NextRequest, ctx: any) => Promise<Response>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Wrapper = (handler: AnyHandler) => AnyHandler;

export function compose(...wrappers: Wrapper[]) {
  return (handler: AnyHandler): AnyHandler => {
    // reduceRight: apply innermost wrapper first
    return wrappers.reduceRight<AnyHandler>((h, wrapper) => wrapper(h), handler);
  };
}
