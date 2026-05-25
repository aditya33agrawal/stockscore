import "server-only";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import sql from "@/lib/db";
import type { SectorRow } from "@/lib/sector-scraper/types";
import { SectorsCompareTable } from "@/components/SectorsCompareTable";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Compare All Sectors",
  description: "Industry-level overview: market cap, P/E, OPM, ROCE, and returns across every Indian sector.",
};

async function loadMarketSectors(): Promise<{ rows: SectorRow[]; refreshedAt: string | null }> {
  try {
    const dbRows = await sql<{ name: string; slug: string; refreshed_at: string; metrics: unknown }[]>`
      SELECT name, slug, refreshed_at::text AS refreshed_at, metrics
      FROM market_sectors
      ORDER BY (metrics->>'totalMarketCap')::numeric DESC NULLS LAST
    `;
    const rows = dbRows.map((r) => r.metrics as SectorRow);
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
          Screener&apos;s full industry overview — market cap, valuation, margins, returns, and capital efficiency for every Indian sector.
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
        <SectorsCompareTable rows={rows} refreshedAt={refreshedAt} />
      )}
    </div>
  );
}
