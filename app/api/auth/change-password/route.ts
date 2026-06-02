import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import sql from "@/lib/db";
import { ensureTables } from "@/lib/db";
import { hashPassword, verifyPassword, createSession, type SessionUser } from "@/lib/auth";
import { compose } from "@/lib/api/compose";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { withMethods } from "@/lib/api/with-methods";
import { withAuth } from "@/lib/api/with-auth";
import { withSchema } from "@/lib/api/with-schema";
import { ApiError, UnauthorizedError, ValidationError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

interface ChangePasswordBody { currentPassword: string; newPassword: string }

function validateChangePassword(raw: unknown): ChangePasswordBody {
  if (typeof raw !== "object" || raw === null) throw new ValidationError("body required");
  const obj = raw as Record<string, unknown>;
  const cur = typeof obj.currentPassword === "string" ? obj.currentPassword : "";
  const next = typeof obj.newPassword === "string" ? obj.newPassword : "";
  if (!cur) throw new ValidationError({ currentPassword: "required" });
  if (next.length < 8) throw new ValidationError({ newPassword: "must be at least 8 characters" });
  if (cur === next) throw new ValidationError({ newPassword: "must differ from current password" });
  return { currentPassword: cur, newPassword: next };
}

export const POST = compose(
  withErrorHandler,
  withMethods(["POST"]),
  withAuth,
  withSchema(validateChangePassword),
)(async (_req: NextRequest, { user, body }: { user: SessionUser; body: ChangePasswordBody }) => {
  await ensureTables();

  const rows = await sql<{ password_hash: string }[]>`
    SELECT password_hash FROM users WHERE id = ${user.id} LIMIT 1
  `;
  if (rows.length === 0) throw new ApiError(404, "Account not found", "not_found");

  const ok = await verifyPassword(body.currentPassword, rows[0].password_hash);
  if (!ok) throw new UnauthorizedError("Current password is incorrect");

  const hash = await hashPassword(body.newPassword);
  const currentToken = cookies().get("ss_session")?.value;
  await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${user.id}`;
  if (currentToken) {
    await sql`DELETE FROM sessions WHERE user_id = ${user.id} AND token <> ${currentToken}`;
  } else {
    await sql`DELETE FROM sessions WHERE user_id = ${user.id}`;
    await createSession(user.id);
  }

  return NextResponse.json({ ok: true });
});
