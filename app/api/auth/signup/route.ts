import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { ensureTables } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { compose } from "@/lib/api/compose";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { withMethods } from "@/lib/api/with-methods";
import { withSchema, email, optStr } from "@/lib/api/with-schema";
import { ApiError, ValidationError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

interface SignupBody { email: string; password: string; name: string | null }

function validateSignup(raw: unknown): SignupBody {
  if (typeof raw !== "object" || raw === null) throw new ValidationError("body required");
  const obj = raw as Record<string, unknown>;
  const em = email(obj.email);
  if (!em) throw new ValidationError({ email: "valid email required" });
  const pw = typeof obj.password === "string" ? obj.password : "";
  if (pw.length < 8) throw new ValidationError({ password: "must be at least 8 characters" });
  return { email: em, password: pw, name: optStr(obj.name) ?? null };
}

export const POST = compose(
  withErrorHandler,
  withMethods(["POST"]),
  withSchema(validateSignup),
)(async (_req: NextRequest, { body }: { body: SignupBody }) => {
  await ensureTables();

  const existing = await sql<{ id: number }[]>`SELECT id FROM users WHERE email = ${body.email}`;
  if (existing.length > 0) throw new ApiError(409, "Email already registered", "conflict");

  const hash = await hashPassword(body.password);
  const inserted = await sql<{ id: number }[]>`
    INSERT INTO users (email, password_hash, name)
    VALUES (${body.email}, ${hash}, ${body.name})
    RETURNING id
  `;
  await createSession(inserted[0].id);
  return NextResponse.json({
    ok: true,
    user: { id: inserted[0].id, email: body.email, name: body.name },
  });
});
