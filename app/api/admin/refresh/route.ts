import { type NextRequest } from "next/server";
import { compose } from "@/lib/api/compose";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { withMethods } from "@/lib/api/with-methods";
import { withAdmin } from "@/lib/api/with-admin";
import { runRefresh, type Phase, type RefreshSummary } from "@/lib/refresh/run";
import sql from "@/lib/db";
import { type SessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

const VALID_PHASES = new Set<Phase>(["sectors", "market", "charts"]);

export const POST = compose(
  withErrorHandler,
  withMethods(["POST"]),
  withAdmin,
)(async (req: NextRequest, ctx: { user: SessionUser }) => {
  const body = await req.json().catch(() => ({}));
  const phases: Phase[] = (
    Array.isArray(body.phases) ? body.phases : ["sectors"]
  ).filter((p: unknown) => VALID_PHASES.has(p as Phase));
  const sectors: string[] | undefined = Array.isArray(body.sectors)
    ? body.sectors
    : undefined;
  const force: boolean = body.force === true;

  if (!phases.length) {
    return new Response(
      JSON.stringify({
        error: {
          code: "validation",
          message: "phases must be a non-empty array",
        },
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const refreshReq = { phases, sectors, force };
  const encoder = new TextEncoder();

  // Insert run record
  let runId: number | null = null;
  try {
    const rows = await sql<{ id: number }[]>`
      INSERT INTO refresh_runs (requested_by, request)
      VALUES (${ctx.user.email}, ${sql.json(refreshReq as never)})
      RETURNING id
    `;
    runId = rows[0]?.id ?? null;
  } catch {
    // Non-fatal - proceed without run record
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (msg: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${msg}\n\n`));
        } catch {
          // controller already closed
        }
      };

      let summary: RefreshSummary | null = null;
      try {
        summary = await runRefresh(refreshReq, send);
        send(`SUMMARY:${JSON.stringify(summary)}`);
        send("DONE");
      } catch (err) {
        send(`ERROR: ${String(err)}`);
      } finally {
        // Persist run result
        if (runId !== null) {
          try {
            await sql`
              UPDATE refresh_runs
              SET finished_at = now(), summary = ${sql.json((summary ?? {}) as never)}, ok = ${summary?.ok ?? false}
              WHERE id = ${runId}
            `;
            if (summary?.errors?.length) {
              for (const e of summary.errors) {
                await sql`
                  INSERT INTO refresh_errors (run_id, ts, phase, scope, item, reason, message, stack)
                  VALUES (
                    ${runId},
                    ${e.ts}::timestamptz,
                    ${e.phase},
                    ${e.scope ?? null},
                    ${e.item ?? null},
                    ${e.reason},
                    ${e.message},
                    ${e.stack ?? null}
                  )
                `;
              }
            }
          } catch {
            // Non-fatal
          }
        }
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
});
