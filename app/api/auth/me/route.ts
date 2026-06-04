import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { compose } from "@/lib/api/compose";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { withMethods } from "@/lib/api/with-methods";

export const dynamic = "force-dynamic";

// /api/auth/me is intentionally unauthenticated — it returns null when not
// signed in so the client can determine session state without triggering a 401.
export const GET = compose(
  withErrorHandler,
  withMethods(["GET"]),
)(async () => {
  const user = await getCurrentUser();
  const isAdmin = user ? isAdminEmail(user.email) : false;
  return NextResponse.json({ user, isAdmin });
});
