import { NextResponse } from "next/server";
import { compose } from "@/lib/api/compose";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { withMethods } from "@/lib/api/with-methods";
import { withSchema, requireFields, str, optStr } from "@/lib/api/with-schema";
import { ValidationError } from "@/lib/api/errors";
import { extractRequestMeta } from "@/lib/api/request-meta";
import { getCurrentUser } from "@/lib/auth";
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
)(async (req, { body }) => {
  const meta = extractRequestMeta(req);
  const user = await getCurrentUser().catch(() => null);

  await sql`
    INSERT INTO feedback (
      type, message, email,
      ip, user_agent, referer, request_id, country,
      user_id
    ) VALUES (
      ${body.type},
      ${body.message},
      ${body.email || null},
      ${meta.ip},
      ${meta.userAgent},
      ${meta.referer},
      ${meta.requestId},
      ${meta.country},
      ${user?.id ?? null}
    )
  `;
  return NextResponse.json({ ok: true }, { status: 201 });
});
