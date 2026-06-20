import "server-only";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import sql from "@/lib/db";
import type { SectorRow } from "@/lib/sector-scraper/types";
import { SectorsCompareTable } from "@/components/SectorsCompareTable";
import { loadSectorIndex } from "@/lib/data";

// Normalizes an industry name so Screener's market-overview names can be
// matched against our internal sectors.slug/name without fuzzy guessing -
// only exact normalized matches count.
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function buildInternalSlugMap(): Promise<Map<string, string>> {
  const internalSectors = await loadSectorIndex();
  const map = new Map<string, string>();
  for (const s of internalSectors) {
    map.set(normalizeName(s.name), s.slug);
  }
  return map;
}

// Data only changes on the weekly refresh pipeline - cache the rendered page
// and revalidate hourly instead of re-querying Postgres on every request.
export const revalidate = 3600;

export const metadata = {
  title: "Compare All Sectors",
  description: "Industry-level overview: market cap, P/E, OPM, ROCE, and returns across every Indian sector.",
};

export type CompareSectorRow = SectorRow & { internalSlug: string | null };

async function loadMarketSectors(): Promise<{ rows: CompareSectorRow[]; refreshedAt: string | null }> {
  try {
    const [dbRows, slugMap] = await Promise.all([
      sql<{ name: string; slug: string; refreshed_at: string; metrics: unknown }[]>`
        SELECT name, slug, refreshed_at::text AS refreshed_at, metrics
        FROM market_sectors
        ORDER BY (metrics->>'totalMarketCap')::numeric DESC NULLS LAST
      `,
      buildInternalSlugMap(),
    ]);
    const rows: CompareSectorRow[] = dbRows.map((r) => {
      const metrics = r.metrics as SectorRow;
      return { ...metrics, internalSlug: slugMap.get(normalizeName(metrics.name)) ?? null };
    });
    const refreshedAt = dbRows[0]?.refreshed_at ?? null;
    return { rows, refreshedAt };
  } catch {
    return { rows: [], refreshedAt: null };
  }
}

export default async function SectorsComparePage() {
  const { rows, refreshedAt } = await loadMarketSectors();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
      <Link
        href="/sectors"
        className="inline-flex items-center gap-1.5 text-sm text-chalk-300 hover:text-chalk-50 mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> All Sectors
      </Link>

      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Sectors</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-chalk-50">
          Compare All Industries
        </h1>
        <p className="mt-3 text-chalk-300 max-w-2xl">
          Screener&apos;s full industry overview - market cap, valuation, margins, returns, and capital efficiency for every Indian sector.
          Sort any column, filter by valuation or quality, hover headers for definitions.
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-10 text-center">
          <p className="text-chalk-300 mb-3">No data yet. Run the market pipeline to populate this page.</p>
          <code className="text-xs text-accent bg-ink-800 px-3 py-1.5 rounded-md">
            npm run refresh:market
          </code>
        </div>
      ) : (
        <>
          <SectorAnalytics rows={rows} />
          <SectorsCompareTable rows={rows} refreshedAt={refreshedAt} />
        </>
      )}
    </div>
  );
}

function SectorAnalytics({ rows }: { rows: CompareSectorRow[] }) {
  const safe = rows.filter((r) => r.medianPE != null);

  const topRoce = [...safe]
    .sort((a, b) => (b.wtdAvgROCE ?? 0) - (a.wtdAvgROCE ?? 0))
    .slice(0, 5);
  const cheapest = [...safe]
    .filter((r) => (r.medianPE ?? 0) > 0)
    .sort((a, b) => (a.medianPE ?? 0) - (b.medianPE ?? 0))
    .slice(0, 5);
  const topOpm = [...safe]
    .sort((a, b) => (b.wtdAvgOPM ?? 0) - (a.wtdAvgOPM ?? 0))
    .slice(0, 5);

  return (
    <section className="mb-10 grid gap-4 md:grid-cols-3">
      <LeaderboardCard
        title="Highest capital efficiency"
        subtitle="By weighted-average sector ROCE"
        rows={topRoce.map((r) => [r.name, r.internalSlug, `${(r.wtdAvgROCE ?? 0).toFixed(1)}%`])}
      />
      <LeaderboardCard
        title="Cheapest by P/E"
        subtitle="Lower median P/E means the market is less optimistic"
        rows={cheapest.map((r) => [r.name, r.internalSlug, `${(r.medianPE ?? 0).toFixed(1)}×`])}
      />
      <LeaderboardCard
        title="Best operating margins"
        subtitle="Per-rupee profit after running the business"
        rows={topOpm.map((r) => [r.name, r.internalSlug, `${(r.wtdAvgOPM ?? 0).toFixed(1)}%`])}
      />
    </section>
  );
}

function LeaderboardCard({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: [string, string | null, string][];
}) {
  return (
    <div className="glass border-subtle rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-chalk-50">{title}</h3>
      <p className="text-xs text-chalk-300/60 mt-0.5 mb-3">{subtitle}</p>
      <ol className="space-y-1.5">
        {rows.map(([name, internalSlug, value], i) => (
          <li key={name} className="flex items-baseline justify-between text-sm">
            <span className="flex items-baseline gap-2 min-w-0">
              <span className="num text-xs text-chalk-300/40 w-4">{i + 1}.</span>
              {internalSlug ? (
                <Link
                  href={`/sector/${internalSlug}`}
                  className="text-chalk-100 hover:text-accent truncate"
                >
                  {name}
                </Link>
              ) : (
                <span className="text-chalk-300/60 truncate cursor-default">{name}</span>
              )}
            </span>
            <span className="num text-chalk-300 shrink-0">{value}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
