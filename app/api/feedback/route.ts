import { NextResponse } from "next/server";
import { compose } from "@/lib/api/compose";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { withMethods } from "@/lib/api/with-methods";
import { withSchema, requireFields, str, optStr } from "@/lib/api/with-schema";
import { ValidationError } from "@/lib/api/errors";
import sql from "@/lib/db";

const VALID_TYPES = ["opportunity", "feedback", "feature", "bug", "other"] as const;

const FeedbackSchema = (raw: unknown) =>
  requireFields(raw, {
    type: (v) => {
      const s = str(v);
      return s && (VALID_TYPES as readonly string[]).includes(s) ? s : null;
    },
    message: (v) => {
      const s = str(v);
      if (!s) return null;
      if (s.length > 2000) throw new ValidationError("message too long (max 2000 chars)");
      return s;
    },
    email: (v) => {
      if (v === undefined || v === null || v === "") return "";
      const s = optStr(v);
      if (!s) return "";
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s.toLowerCase() : null;
    },
  });

export const POST = compose(
  withErrorHandler,
  withMethods(["POST"]),
  withSchema(FeedbackSchema),
)(async (_req, { body }) => {
  await sql`
    INSERT INTO feedback (type, message, email)
    VALUES (${body.type}, ${body.message}, ${body.email || null})
  `;
  return NextResponse.json({ ok: true }, { status: 201 });
});
