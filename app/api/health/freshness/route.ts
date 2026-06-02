/**
 * GET /api/health/freshness
 *
 * Reports the staleness of the most recently refreshed company row.
 * Intended for external uptime monitors (UptimeRobot, Cronitor, etc.) to
 * page when the weekly refresh stops running.
 *
 * Returns HTTP 200 with `ok: true` if the most recent refresh is within
 * `STALENESS_THRESHOLD_HOURS` (default 8 days = 192h). Otherwise 503.
 */

import { NextResponse } from "next/server";
import sql from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const STALENESS_THRESHOLD_HOURS = 24 * 8; // weekly job + 1 day grace

export async function GET() {
  try {
    const rows = await sql<{
      last_company: Date | null;
      last_sector: Date | null;
      last_market: Date | null;
      last_chart: Date | null;
      company_count: number;
    }[]>`
      SELECT
        (SELECT MAX(refreshed_at) FROM companies)       AS last_company,
        (SELECT MAX(refreshed_at) FROM sectors)         AS last_sector,
        (SELECT MAX(refreshed_at) FROM market_sectors)  AS last_market,
        (SELECT MAX(fetched_at)   FROM chart_data)      AS last_chart,
        (SELECT COUNT(*)::int     FROM companies)       AS company_count
    `;

    const r = rows[0] ?? {};
    const now = Date.now();
    const toIso = (d: Date | null | undefined) => (d ? new Date(d).toISOString() : null);
    const hoursSince = (d: Date | null | undefined) =>
      d ? Math.round(((now - new Date(d).getTime()) / 36e5) * 10) / 10 : null;

    const lastRefresh = r.last_company ? new Date(r.last_company) : null;
    const stalenessHours = hoursSince(lastRefresh);
    const ok = stalenessHours !== null && stalenessHours <= STALENESS_THRESHOLD_HOURS;

    const body = {
      ok,
      stalenessHours,
      thresholdHours: STALENESS_THRESHOLD_HOURS,
      companyCount: r.company_count ?? 0,
      lastRefresh: toIso(lastRefresh),
      details: {
        companies:      { lastRefresh: toIso(r.last_company), hoursSince: hoursSince(r.last_company) },
        sectors:        { lastRefresh: toIso(r.last_sector),  hoursSince: hoursSince(r.last_sector)  },
        marketSectors:  { lastRefresh: toIso(r.last_market),  hoursSince: hoursSince(r.last_market)  },
        chartData:      { lastRefresh: toIso(r.last_chart),   hoursSince: hoursSince(r.last_chart)   },
      },
    };

    return NextResponse.json(body, {
      status: ok ? 200 : 503,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "freshness probe failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
