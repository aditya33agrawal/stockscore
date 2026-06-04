import { NextResponse, type NextRequest } from "next/server";
import { compose } from "@/lib/api/compose";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { withMethods } from "@/lib/api/with-methods";
import { withAdmin } from "@/lib/api/with-admin";
import sql from "@/lib/db";

export const dynamic = "force-dynamic";

interface RunRow {
  id: number;
  started_at: string;
  finished_at: string | null;
  requested_by: string | null;
  ok: boolean | null;
  request: unknown;
  summary: unknown;
  error_count: number;
}

interface ErrorRow {
  id: number;
  ts: string;
  phase: string;
  scope: string | null;
  item: string | null;
  reason: string | null;
  message: string;
  stack: string | null;
}

export const GET = compose(
  withErrorHandler,
  withMethods(["GET"]),
  withAdmin,
)(async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");

  // Single-run detail with its full error list.
  if (id) {
    const runId = Number(id);
    if (!Number.isInteger(runId)) {
      return NextResponse.json({ error: { message: "invalid id" } }, { status: 400 });
    }
    const [runRows, errorRows] = await Promise.all([
      sql<RunRow[]>`
        SELECT r.id, r.started_at, r.finished_at, r.requested_by, r.ok, r.request, r.summary,
               (SELECT COUNT(*)::int FROM refresh_errors e WHERE e.run_id = r.id) AS error_count
        FROM refresh_runs r WHERE r.id = ${runId} LIMIT 1
      `,
      sql<ErrorRow[]>`
        SELECT id, ts, phase, scope, item, reason, message, stack
        FROM refresh_errors WHERE run_id = ${runId} ORDER BY ts ASC
      `,
    ]);
    if (runRows.length === 0) {
      return NextResponse.json({ error: { message: "not found" } }, { status: 404 });
    }
    return NextResponse.json({ run: runRows[0], errors: errorRows });
  }

  // Recent runs list (with error counts).
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 25, 100);
  const runs = await sql<RunRow[]>`
    SELECT r.id, r.started_at, r.finished_at, r.requested_by, r.ok, r.request, r.summary,
           (SELECT COUNT(*)::int FROM refresh_errors e WHERE e.run_id = r.id) AS error_count
    FROM refresh_runs r
    ORDER BY r.started_at DESC
    LIMIT ${limit}
  `;
  return NextResponse.json({ runs });
});
