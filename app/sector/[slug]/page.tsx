import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Layers, TrendingUp } from "lucide-react";
import { formatDate, loadSector } from "@/lib/data";
import { Leaderboard } from "@/components/Leaderboard";
import { RadarCompare } from "@/components/RadarCompare";
import { ScoreBarChart } from "@/components/ScoreBar";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const sector = await loadSector(params.slug);
  if (!sector) return {};
  return {
    title: `${sector.name} — Sector Scoring`,
    description: `${sector.companies_count} ${sector.name} companies scored across 10 fundamental categories.`,
  };
}

export default async function SectorPage({ params }: { params: { slug: string } }) {
  const sector = await loadSector(params.slug);
  if (!sector) notFound();

  const stats = sector.sector_stats;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">

      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-chalk-300/40 hover:text-accent transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> All sectors
      </Link>

      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-6 mb-10">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent mb-2">Sector Analysis</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-chalk-50 mb-3">
            {sector.name}
          </h1>
          <p className="max-w-2xl text-chalk-200/75 leading-relaxed mb-4">{sector.description}</p>
          <div className="flex flex-wrap items-center gap-4 num text-[11px] text-chalk-300/55">
            <span className="inline-flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" /> {sector.companies_count} companies
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Refreshed {formatDate(sector.refreshed_at)}
            </span>
            <Link
              href="/methodology"
              className="inline-flex items-center gap-1.5 text-accent/70 hover:text-accent transition-colors"
            >
              <TrendingUp className="h-3.5 w-3.5" /> How scoring works
            </Link>
            <Link
              href="/learn"
              className="inline-flex items-center gap-1.5 text-chalk-300/40 hover:text-accent transition-colors"
            >
              Learn the metrics →
            </Link>
          </div>
        </div>
      </header>

      {/* Sector medians */}
      <section className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent mb-4">Sector Medians</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[
            ["Median P/E",        stats.median_pe?.toFixed(1) ?? "—"],
            ["Median ROCE",       stats.median_roce != null ? `${stats.median_roce.toFixed(1)}%` : "—"],
            ["Median OPM",        stats.median_opm  != null ? `${stats.median_opm.toFixed(1)}%`  : "—"],
            ["Median D/E",        stats.median_de?.toFixed(2) ?? "—"],
            ["Median Div Yield",  stats.median_dividend_yield != null ? `${stats.median_dividend_yield.toFixed(2)}%` : "—"],
          ].map(([label, value]) => (
            <div key={label} className="glass border-subtle rounded-2xl p-4 hover:border-[rgb(var(--accent)_/_0.15)] transition-all">
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-chalk-300/55 mb-1.5">{label}</p>
              <p className="num text-xl font-bold text-chalk-50">{value}</p>
            </div>
          ))}
        </div>
        {sector.analyst_note && (
          <div className="mt-4 glass border-subtle rounded-xl px-5 py-4 border-l-2 border-l-accent/40">
            <p className="text-sm text-chalk-300/60 italic">
              &ldquo;{sector.analyst_note}&rdquo;{" "}
              </p>
          </div>
        )}
      </section>

      {/* Leaderboard */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">Leaderboard</p>
          <p className="text-[11px] text-chalk-300/50">Click column headers to sort</p>
        </div>
        <Leaderboard sectorSlug={sector.slug} companies={sector.companies} />
        <p className="mt-3 text-xs text-chalk-300/50">
          Click any company name to see the full +/− breakdown across all 10 categories.
        </p>
      </section>

      {/* Radar — full width */}
      <section className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent mb-4">
          Category profile
        </p>
        <div className="w-full">
          <RadarCompare companies={sector.companies} />
        </div>
      </section>

      {/* Score distribution */}
      <section className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent mb-4">
          Score distribution
        </p>
        <ScoreBarChart companies={sector.companies} />
      </section>

    </div>
  );
}
