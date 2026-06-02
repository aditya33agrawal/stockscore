import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { compose } from "@/lib/api/compose";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { withMethods } from "@/lib/api/with-methods";
import { withAuth } from "@/lib/api/with-auth";

export const dynamic = "force-dynamic";

export const POST = compose(
  withErrorHandler,
  withMethods(["POST"]),
  withAuth,
)(async () => {
  await destroySession();
  return NextResponse.json({ ok: true });
});
