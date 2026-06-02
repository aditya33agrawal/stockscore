import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { ensureTables } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { compose } from "@/lib/api/compose";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { withMethods } from "@/lib/api/with-methods";
import { withSchema, email } from "@/lib/api/with-schema";
import { ApiError, ValidationError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

interface ForgotPasswordBody { email: string; newPassword: string }

function validateForgotPassword(raw: unknown): ForgotPasswordBody {
  if (typeof raw !== "object" || raw === null) throw new ValidationError("body required");
  const obj = raw as Record<string, unknown>;
  const em = email(obj.email);
  if (!em) throw new ValidationError({ email: "valid email required" });
  const pw = typeof obj.newPassword === "string" ? obj.newPassword : "";
  if (pw.length < 8) throw new ValidationError({ newPassword: "must be at least 8 characters" });
  return { email: em, newPassword: pw };
}

export const POST = compose(
  withErrorHandler,
  withMethods(["POST"]),
  withSchema(validateForgotPassword),
)(async (_req: NextRequest, { body }: { body: ForgotPasswordBody }) => {
  await ensureTables();

  const rows = await sql<{ id: number }[]>`
    SELECT id FROM users WHERE email = ${body.email} LIMIT 1
  `;
  if (rows.length === 0) throw new ApiError(404, "No account found with that email", "not_found");

  const hash = await hashPassword(body.newPassword);
  const userId = rows[0].id;
  await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${userId}`;
  await sql`DELETE FROM sessions WHERE user_id = ${userId}`;
  await createSession(userId);

  return NextResponse.json({ ok: true });
});
