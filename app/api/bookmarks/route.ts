import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { ensureTables } from "@/lib/db";
import { type SessionUser } from "@/lib/auth";
import type { Company } from "@/lib/types";
import { snapshotFromCompany } from "@/lib/bookmark-diff";
import { compose } from "@/lib/api/compose";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { withAuth } from "@/lib/api/with-auth";
import { withSchema, str, optStr } from "@/lib/api/with-schema";
import { ValidationError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

// ─── GET /api/bookmarks ───────────────────────────────────────────────────────

export const GET = compose(
  withErrorHandler,
  withAuth,
)(async (_req: NextRequest, { user }: { user: SessionUser }) => {
  await ensureTables();

  const rows = await sql`
    SELECT
      b.sector_slug,
      b.company_slug,
      b.company_ticker,
      b.company_name,
      b.created_at,
      b.score_snapshot,
      b.snapshot_taken_at,
      b.is_backfilled,
      c.data          AS current_data,
      c.refreshed_at  AS current_refreshed_at
    FROM bookmarks b
    LEFT JOIN companies c ON c.symbol = b.company_ticker
    WHERE b.user_id = ${user.id}
    ORDER BY b.created_at DESC
  `;

  // Backfill snapshots for old bookmarks that have no snapshot yet
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
            UPDATE bookmarks
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

  return NextResponse.json({ bookmarks: rows });
});

// ─── POST /api/bookmarks ──────────────────────────────────────────────────────

interface BookmarkBody {
  sector_slug: string;
  company_slug: string;
  company_ticker: string | null;
  company_name: string | null;
}

function validateBookmark(raw: unknown): BookmarkBody {
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
  withSchema(validateBookmark),
)(async (
  _req: NextRequest,
  { user, body }: { user: SessionUser; body: BookmarkBody },
) => {
  await ensureTables();

  await sql`
    INSERT INTO bookmarks (user_id, sector_slug, company_slug, company_ticker, company_name)
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
          UPDATE bookmarks
          SET score_snapshot    = ${JSON.stringify(snapshot)},
              snapshot_taken_at = ${companyRows[0].refreshed_at},
              is_backfilled     = false
          WHERE user_id     = ${user.id}
            AND sector_slug  = ${body.sector_slug}
            AND company_slug = ${body.company_slug}
        `;
      }
    } catch {
      // Non-fatal - bookmark is saved, snapshot is best-effort
    }
  }

  return NextResponse.json({ ok: true });
});

// ─── DELETE /api/bookmarks ────────────────────────────────────────────────────

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
    DELETE FROM bookmarks
    WHERE user_id     = ${user.id}
      AND sector_slug  = ${sectorSlug}
      AND company_slug = ${companySlug}
  `;
  return NextResponse.json({ ok: true });
});
