import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { ensureTables } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { compose } from "@/lib/api/compose";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { withMethods } from "@/lib/api/with-methods";
import { withSchema, email } from "@/lib/api/with-schema";
import { UnauthorizedError, ValidationError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

interface LoginBody { email: string; password: string }

function validateLogin(raw: unknown): LoginBody {
  if (typeof raw !== "object" || raw === null) throw new ValidationError("body required");
  const obj = raw as Record<string, unknown>;
  const em = email(obj.email);
  if (!em) throw new ValidationError({ email: "valid email required" });
  if (typeof obj.password !== "string" || !obj.password)
    throw new ValidationError({ password: "required" });
  return { email: em, password: obj.password };
}

export const POST = compose(
  withErrorHandler,
  withMethods(["POST"]),
  withSchema(validateLogin),
)(async (_req: NextRequest, { body }: { body: LoginBody }) => {
  await ensureTables();

  const rows = await sql<
    { id: number; email: string; name: string | null; password_hash: string }[]
  >`SELECT id, email, name, password_hash FROM users WHERE email = ${body.email} LIMIT 1`;

  if (rows.length === 0) throw new UnauthorizedError("Invalid email or password");

  const ok = await verifyPassword(body.password, rows[0].password_hash);
  if (!ok) throw new UnauthorizedError("Invalid email or password");

  await createSession(rows[0].id);
  return NextResponse.json({
    ok: true,
    user: { id: rows[0].id, email: rows[0].email, name: rows[0].name },
    isAdmin: isAdminEmail(rows[0].email),
  });
});
