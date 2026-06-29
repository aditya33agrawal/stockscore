import Link from "next/link";
import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import sql from "@/lib/db";
import { ensureTables } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { WatchlistCard } from "@/components/WatchlistCard";
import { WatchlistAddBox } from "@/components/WatchlistAddBox";
import { WATCHLIST_MAX } from "@/lib/watchlist";
import type { Company } from "@/lib/types";
import {
  computeScoreDiff,
  snapshotFromCompany,
  type WatchlistSnapshot,
  type ScoreDiff,
} from "@/lib/watchlist-diff";

export const dynamic = "force-dynamic";

export const metadata = { title: "My Watchlist" };

function prettySector(slug: string): string {
  return slug
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

interface WatchlistRow {
  sector_slug:          string;
  company_slug:         string;
  company_ticker:       string | null;
  company_name:         string | null;
  created_at:           string;
  score_snapshot:       WatchlistSnapshot | null;
  snapshot_taken_at:    string | null;
  is_backfilled:        boolean;
  current_data:         Company | null;
  current_refreshed_at: string | null;
}

interface EnrichedEntry {
  row:           WatchlistRow;
  diff:          ScoreDiff | null;
  snapshotScore: number | null;
}

export default async function WatchlistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await ensureTables();

  // Fetch watchlist joined with live company data
  const rawRows = await sql<WatchlistRow[]>`
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
    ORDER BY w.sector_slug ASC, w.company_name ASC, w.created_at DESC
  `;

  // Backfill snapshots for old entries that have no snapshot yet
  const needsBackfill = rawRows.filter((r) => !r.score_snapshot && r.current_data);
  if (needsBackfill.length > 0) {
    await Promise.allSettled(
      needsBackfill.map(async (r) => {
        try {
          const snapshot = snapshotFromCompany(r.current_data!);
          await sql`
            UPDATE watchlist
            SET score_snapshot    = ${JSON.stringify(snapshot)},
                snapshot_taken_at = ${r.current_refreshed_at},
                is_backfilled     = true
            WHERE user_id     = ${user.id}
              AND sector_slug  = ${r.sector_slug}
              AND company_slug = ${r.company_slug}
          `;
          // Patch in-memory so we render diffs this request too
          r.score_snapshot    = snapshot;
          r.snapshot_taken_at = r.current_refreshed_at;
          r.is_backfilled     = true;
        } catch {
          // Best-effort; silently ignore
        }
      })
    );
  }

  // Compute diffs
  const enriched: EnrichedEntry[] = rawRows.map((row) => {
    let diff: ScoreDiff | null = null;

    if (row.score_snapshot && row.current_data && row.current_refreshed_at) {
      const currentSnapshot = snapshotFromCompany(row.current_data);
      diff = computeScoreDiff(
        row.score_snapshot,
        currentSnapshot,
        new Date(row.created_at),
        new Date(row.current_refreshed_at),
        row.is_backfilled ?? false,
      );
    }

    return {
      row,
      diff,
      snapshotScore: row.score_snapshot?.final_score ?? null,
    };
  });

  // Group by sector
  const grouped = new Map<string, EnrichedEntry[]>();
  for (const e of enriched) {
    const list = grouped.get(e.row.sector_slug) ?? [];
    list.push(e);
    grouped.set(e.row.sector_slug, list);
  }
  const sectors = Array.from(grouped.keys()).sort((a, b) => a.localeCompare(b));

  const watchedKeys = rawRows.map((r) => `${r.sector_slug}/${r.company_slug}`);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent mb-2">
          My Watchlist
        </p>
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-chalk-50">
            Watchlist
          </h1>
          <span className="num text-sm font-semibold text-chalk-300/50 shrink-0">
            {enriched.length} / {WATCHLIST_MAX}
          </span>
        </div>
        <p className="mt-2 text-sm text-chalk-300/60">
          Signed in as {user.name ?? user.email}.
          {enriched.length > 0 && (
            <>
              {" · "}
              {enriched.length} stock{enriched.length === 1 ? "" : "s"} across{" "}
              {sectors.length} sector{sectors.length === 1 ? "" : "s"}.
            </>
          )}
        </p>
      </header>

      <WatchlistAddBox
        count={enriched.length}
        max={WATCHLIST_MAX}
        watchedKeys={watchedKeys}
      />

      {enriched.length === 0 ? (
        <div className="glass border-subtle rounded-2xl p-10 text-center">
          <Star className="h-8 w-8 mx-auto text-chalk-300/30 mb-3" />
          <p className="text-chalk-300/70 mb-1">Your watchlist is empty</p>
          <p className="text-xs text-chalk-300/40 mb-5">
            Search above to add a stock, or hit the Watch button on any company page.
          </p>
          <Link
            href="/sectors"
            className="inline-flex items-center gap-1.5 rounded-xl border border-accent/25 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent hover:bg-accent/15 transition-all"
          >
            Browse sectors
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {sectors.map((slug) => {
            const items = grouped.get(slug) ?? [];
            return (
              <section key={slug}>
                <div className="flex items-baseline justify-between mb-3">
                  <Link
                    href={`/sector/${slug}`}
                    className="text-xs font-semibold uppercase tracking-[0.12em] text-chalk-300/70 hover:text-accent transition-colors"
                  >
                    {prettySector(slug)}
                  </Link>
                  <span className="text-[11px] text-chalk-300/40 num">
                    {items.length} compan{items.length === 1 ? "y" : "ies"}
                  </span>
                </div>
                <ul className="space-y-2">
                  {items.map((e) => (
                    <WatchlistCard
                      key={`${e.row.sector_slug}/${e.row.company_slug}`}
                      sectorSlug={e.row.sector_slug}
                      companySlug={e.row.company_slug}
                      companyName={e.row.company_name}
                      ticker={e.row.company_ticker}
                      createdAt={e.row.created_at}
                      diff={e.diff}
                      snapshotScore={e.snapshotScore}
                      snapshotTakenAt={e.row.snapshot_taken_at}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
