import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { ensureTables } from "@/lib/db";
import { type SessionUser } from "@/lib/auth";
import { compose } from "@/lib/api/compose";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { withAuth } from "@/lib/api/with-auth";
import { withSchema } from "@/lib/api/with-schema";
import { ValidationError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

// ─── GET /api/allocation-history ───────────────────────────────────────────

export const GET = compose(
  withErrorHandler,
  withAuth,
)(async (_req: NextRequest, { user }: { user: SessionUser }) => {
  await ensureTables();

  const rows = await sql`
    SELECT id, mode, input, result, created_at
    FROM allocation_history
    WHERE user_id = ${user.id}
    ORDER BY created_at DESC
    LIMIT 20
  `;

  return NextResponse.json({ history: rows });
});

// ─── POST /api/allocation-history ──────────────────────────────────────────

interface HistoryBody {
  mode: "wealth" | "goal";
  input: Record<string, unknown>;
  result: Record<string, unknown>;
}

function validateHistory(raw: unknown): HistoryBody {
  if (typeof raw !== "object" || raw === null)
    throw new ValidationError("body required");
  const obj = raw as Record<string, unknown>;
  if (obj.mode !== "wealth" && obj.mode !== "goal")
    throw new ValidationError({ mode: "must be 'wealth' or 'goal'" });
  if (typeof obj.input !== "object" || obj.input === null)
    throw new ValidationError({ input: "required" });
  if (typeof obj.result !== "object" || obj.result === null)
    throw new ValidationError({ result: "required" });
  return {
    mode: obj.mode,
    input: obj.input as Record<string, unknown>,
    result: obj.result as Record<string, unknown>,
  };
}

export const POST = compose(
  withErrorHandler,
  withAuth,
  withSchema(validateHistory),
)(async (
  _req: NextRequest,
  { user, body }: { user: SessionUser; body: HistoryBody },
) => {
  await ensureTables();

  const rows = await sql`
    INSERT INTO allocation_history (user_id, mode, input, result)
    VALUES (${user.id}, ${body.mode}, ${sql.json(body.input as never)}, ${sql.json(body.result as never)})
    RETURNING id, mode, input, result, created_at
  `;

  // Keep only the 20 most recent entries per user
  await sql`
    DELETE FROM allocation_history
    WHERE user_id = ${user.id}
      AND id NOT IN (
        SELECT id FROM allocation_history
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
        LIMIT 20
      )
  `;

  return NextResponse.json({ entry: rows[0] });
});

// ─── DELETE /api/allocation-history?id=<n> ─────────────────────────────────

export const DELETE = compose(
  withErrorHandler,
  withAuth,
)(async (req: NextRequest, { user }: { user: SessionUser }) => {
  await ensureTables();

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) throw new ValidationError({ query: "id is required" });

  await sql`
    DELETE FROM allocation_history
    WHERE user_id = ${user.id} AND id = ${id}
  `;
  return NextResponse.json({ ok: true });
});
