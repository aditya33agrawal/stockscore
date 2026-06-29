import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { ensureTables } from "@/lib/db";
import { type SessionUser } from "@/lib/auth";
import type { Company } from "@/lib/types";
import { snapshotFromCompany } from "@/lib/watchlist-diff";
import { WATCHLIST_MAX } from "@/lib/watchlist";
import { compose } from "@/lib/api/compose";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { withAuth } from "@/lib/api/with-auth";
import { withSchema, str, optStr } from "@/lib/api/with-schema";
import { ApiError, ValidationError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

// ─── Helper: current watchlist size for a user ────────────────────────────────

async function countFor(userId: number): Promise<number> {
  const rows = await sql<{ count: number }[]>`
    SELECT COUNT(*)::int AS count FROM watchlist WHERE user_id = ${userId}
  `;
  return rows[0]?.count ?? 0;
}

// ─── GET /api/watchlist ───────────────────────────────────────────────────────

export const GET = compose(
  withErrorHandler,
  withAuth,
)(async (_req: NextRequest, { user }: { user: SessionUser }) => {
  await ensureTables();

  const rows = await sql`
    SELECT
      w.sector_slug,
      w.company_slug,
      w.company_ticker,
      w.company_name,
      w.created_at,
      w.score_snapshot,
      w.snapshot_taken_at,
      w.is_backfilled,
      c.data          AS current_data,
      c.refreshed_at  AS current_refreshed_at
    FROM watchlist w
    LEFT JOIN companies c ON c.symbol = w.company_ticker
    WHERE w.user_id = ${user.id}
    ORDER BY w.created_at DESC
  `;

  // Backfill snapshots for old entries that have no snapshot yet
  const backfillTargets = rows.filter(
    (r) => !r.score_snapshot && r.current_data,
  );
  if (backfillTargets.length > 0) {
    await Promise.allSettled(
      backfillTargets.map(async (r) => {
        try {
          const company = r.current_data as Company;
          const snapshot = snapshotFromCompany(company);
          await sql`
            UPDATE watchlist
            SET score_snapshot    = ${JSON.stringify(snapshot)},
                snapshot_taken_at = ${r.current_refreshed_at},
                is_backfilled     = true
            WHERE user_id     = ${user.id}
              AND sector_slug  = ${r.sector_slug}
              AND company_slug = ${r.company_slug}
          `;
          r.score_snapshot = snapshot;
          r.snapshot_taken_at = r.current_refreshed_at;
          r.is_backfilled = true;
        } catch {
          // Silently ignore - backfill is best-effort
        }
      }),
    );
  }

  return NextResponse.json({
    watchlist: rows,
    count: rows.length,
    max: WATCHLIST_MAX,
  });
});

// ─── POST /api/watchlist ──────────────────────────────────────────────────────

interface WatchlistBody {
  sector_slug: string;
  company_slug: string;
  company_ticker: string | null;
  company_name: string | null;
}

function validateWatchlist(raw: unknown): WatchlistBody {
  if (typeof raw !== "object" || raw === null)
    throw new ValidationError("body required");
  const obj = raw as Record<string, unknown>;
  const sectorSlug = str(obj.sector_slug);
  const companySlug = str(obj.company_slug);
  if (!sectorSlug) throw new ValidationError({ sector_slug: "required" });
  if (!companySlug) throw new ValidationError({ company_slug: "required" });
  return {
    sector_slug: sectorSlug,
    company_slug: companySlug,
    company_ticker: optStr(obj.company_ticker),
    company_name: optStr(obj.company_name),
  };
}

export const POST = compose(
  withErrorHandler,
  withAuth,
  withSchema(validateWatchlist),
)(async (
  _req: NextRequest,
  { user, body }: { user: SessionUser; body: WatchlistBody },
) => {
  await ensureTables();

  // Enforce the cap: reject only genuinely new entries once the list is full.
  // Re-adding a stock already on the list (a no-op) is always allowed.
  const existing = await sql`
    SELECT 1 FROM watchlist
    WHERE user_id     = ${user.id}
      AND sector_slug  = ${body.sector_slug}
      AND company_slug = ${body.company_slug}
    LIMIT 1
  `;
  if (existing.length === 0) {
    const count = await countFor(user.id);
    if (count >= WATCHLIST_MAX) {
      throw new ApiError(
        409,
        `Watchlist full (${WATCHLIST_MAX}/${WATCHLIST_MAX}) — remove a stock to add another.`,
        "WATCHLIST_FULL",
      );
    }
  }

  await sql`
    INSERT INTO watchlist (user_id, sector_slug, company_slug, company_ticker, company_name)
    VALUES (${user.id}, ${body.sector_slug}, ${body.company_slug}, ${body.company_ticker}, ${body.company_name})
    ON CONFLICT (user_id, sector_slug, company_slug) DO NOTHING
  `;

  // Capture a score snapshot if the company exists in the DB
  if (body.company_ticker) {
    try {
      const companyRows = await sql`
        SELECT data, refreshed_at
        FROM companies
        WHERE symbol = ${body.company_ticker}
        LIMIT 1
      `;
      if (companyRows.length > 0) {
        const snapshot = snapshotFromCompany(companyRows[0].data as Company);
        await sql`
          UPDATE watchlist
          SET score_snapshot    = ${JSON.stringify(snapshot)},
              snapshot_taken_at = ${companyRows[0].refreshed_at},
              is_backfilled     = false
          WHERE user_id     = ${user.id}
            AND sector_slug  = ${body.sector_slug}
            AND company_slug = ${body.company_slug}
        `;
      }
    } catch {
      // Non-fatal - entry is saved, snapshot is best-effort
    }
  }

  return NextResponse.json({ ok: true, count: await countFor(user.id) });
});

// ─── DELETE /api/watchlist ────────────────────────────────────────────────────

export const DELETE = compose(
  withErrorHandler,
  withAuth,
)(async (req: NextRequest, { user }: { user: SessionUser }) => {
  await ensureTables();

  const url = new URL(req.url);
  const sectorSlug = url.searchParams.get("sector_slug");
  const companySlug = url.searchParams.get("company_slug");

  if (!sectorSlug || !companySlug) {
    throw new ValidationError({
      query: "sector_slug and company_slug are required",
    });
  }

  await sql`
    DELETE FROM watchlist
    WHERE user_id     = ${user.id}
      AND sector_slug  = ${sectorSlug}
      AND company_slug = ${companySlug}
  `;
  return NextResponse.json({ ok: true, count: await countFor(user.id) });
});
