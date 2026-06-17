import "server-only";
import sql from "@/lib/db";
import { loadSectorsConfig } from "@/lib/data";

function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`DB query timed out after ${ms}ms`)),
        ms,
      ),
    ),
  ]);
}

const STALE_MS = 7 * 24 * 3600 * 1000; // mirrors the pipeline 7-day freshness rule

export interface AdminSectorStat {
  slug: string;
  name: string;
  companies: number;
  lastRefreshed: string | null;
  stale: boolean;
}

export interface AdminStats {
  companies: { total: number };
  sectors: {
    configured: number;
    scored: number;
    list: AdminSectorStat[];
  };
  charts: { symbols: number; lastRefreshed: string | null };
  market: { lastRefreshed: string | null };
  runs: {
    total: number;
    lastOk: boolean | null;
    lastFinishedAt: string | null;
    lastStartedAt: string | null;
    openErrors: number;
  };
  error?: string;
}

function isStale(iso: string | null): boolean {
  if (!iso) return true;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return true;
  return Date.now() - t > STALE_MS;
}

const EMPTY_STATS: AdminStats = {
  companies: { total: 0 },
  sectors: { configured: 0, scored: 0, list: [] },
  charts: { symbols: 0, lastRefreshed: null },
  market: { lastRefreshed: null },
  runs: {
    total: 0,
    lastOk: null,
    lastFinishedAt: null,
    lastStartedAt: null,
    openErrors: 0,
  },
};

export async function getAdminStats(): Promise<
  AdminStats & { error?: string }
> {
  let config: Awaited<ReturnType<typeof loadSectorsConfig>>;
  try {
    config = await loadSectorsConfig();
  } catch (err) {
    console.error("[admin-stats] loadSectorsConfig failed:", err);
    return { ...EMPTY_STATS, error: "Could not load sector config" };
  }

  let companiesRows: { total: number }[];
  let sectorRows: {
    slug: string;
    name: string;
    companies_count: number | null;
    refreshed_at: string | null;
  }[];
  let chartRows: { symbols: number; last: string | null }[];
  let marketRows: { last: string | null }[];
  let runCountRows: { total: number }[];
  let lastRunRows: {
    id: number;
    ok: boolean | null;
    started_at: string | null;
    finished_at: string | null;
  }[];

  try {
    [
      companiesRows,
      sectorRows,
      chartRows,
      marketRows,
      runCountRows,
      lastRunRows,
    ] = await withTimeout(
      Promise.all([
        sql<{ total: number }[]>`SELECT COUNT(*)::int AS total FROM companies`,
        sql<
          {
            slug: string;
            name: string;
            companies_count: number | null;
            refreshed_at: string | null;
          }[]
        >`
      SELECT slug, name, companies_count, refreshed_at FROM sectors
    `,
        sql<{ symbols: number; last: string | null }[]>`
      SELECT COUNT(*)::int AS symbols, MAX(fetched_at) AS last FROM chart_data
    `,
        sql<{ last: string | null }[]>`
      SELECT last_full_refresh AS last FROM market_sectors_meta ORDER BY id LIMIT 1
    `,
        sql<
          { total: number }[]
        >`SELECT COUNT(*)::int AS total FROM refresh_runs`,
        sql<
          {
            id: number;
            ok: boolean | null;
            started_at: string | null;
            finished_at: string | null;
          }[]
        >`
      SELECT id, ok, started_at, finished_at
      FROM refresh_runs ORDER BY started_at DESC LIMIT 1
    `,
        // 25s: comfortably above the 15s connect_timeout so cold starts can establish the connection
      ]),
      25000,
    );
  } catch (err) {
    console.error("[admin-stats] DB queries failed:", err);
    return {
      ...EMPTY_STATS,
      sectors: { configured: config.length, scored: 0, list: [] },
      error: err instanceof Error ? err.message : "DB unavailable",
    };
  }

  const lastRun = lastRunRows[0];
  let openErrors = 0;
  if (lastRun) {
    try {
      const errRows = await withTimeout(
        sql<{ count: number }[]>`
        SELECT COUNT(*)::int AS count FROM refresh_errors WHERE run_id = ${lastRun.id}
      `,
        8000,
      );
      openErrors = errRows[0]?.count ?? 0;
    } catch {
      // non-fatal - leave openErrors = 0
    }
  }

  const scoredBySlug = new Map(sectorRows.map((r) => [r.slug, r]));

  // Drive the list from the config (source of truth for which sectors exist),
  // enriched with the scored row's count + last-refreshed timestamp.
  const list: AdminSectorStat[] = config.map((c) => {
    const row = scoredBySlug.get(c.slug);
    const lastRefreshed = row?.refreshed_at ?? null;
    return {
      slug: c.slug,
      name: row?.name ?? c.name,
      companies: row?.companies_count ?? 0,
      lastRefreshed,
      stale: isStale(lastRefreshed),
    };
  });
  // Include any scored sectors not present in the config (defensive).
  for (const row of sectorRows) {
    if (!config.some((c) => c.slug === row.slug)) {
      list.push({
        slug: row.slug,
        name: row.name,
        companies: row.companies_count ?? 0,
        lastRefreshed: row.refreshed_at ?? null,
        stale: isStale(row.refreshed_at ?? null),
      });
    }
  }
  list.sort((a, b) => a.name.localeCompare(b.name));

  return {
    companies: { total: companiesRows[0]?.total ?? 0 },
    sectors: {
      configured: config.length,
      scored: sectorRows.length,
      list,
    },
    charts: {
      symbols: chartRows[0]?.symbols ?? 0,
      lastRefreshed: chartRows[0]?.last ?? null,
    },
    market: { lastRefreshed: marketRows[0]?.last ?? null },
    runs: {
      total: runCountRows[0]?.total ?? 0,
      lastOk: lastRun?.ok ?? null,
      lastFinishedAt: lastRun?.finished_at ?? null,
      lastStartedAt: lastRun?.started_at ?? null,
      openErrors,
    },
  };
}
