import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Layers, TrendingUp } from "lucide-react";
import { allSectorSlugs, formatDate, loadSector } from "@/lib/data";
import { Leaderboard } from "@/components/Leaderboard";
import { RadarCompare } from "@/components/RadarCompare";
import { ScoreBarChart } from "@/components/ScoreBar";

export async function generateStaticParams() {
  const slugs = await allSectorSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const sector = await loadSector(params.slug);
  if (!sector) return {};
  return {
    title: `${sector.name} — Sector Scoring`,
    description: `${sector.companies_count} ${sector.name} companies scored across 10 fundamental categories.`,
  };
}

export default async function SectorPage({
  params,
}: {
  params: { slug: string };
}) {
  const sector = await loadSector(params.slug);
  if (!sector) notFound();

  const stats = sector.sector_stats;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-chalk-300 hover:text-chalk-50 mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> All sectors
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-chalk-50">
            {sector.name}
          </h1>
          <p className="mt-2 max-w-2xl text-chalk-300">{sector.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-chalk-300/70">
            <span className="inline-flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" /> {sector.companies_count}{" "}
              companies
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Refreshed{" "}
              {formatDate(sector.refreshed_at)}
            </span>
            <Link
              href="/methodology"
              className="inline-flex items-center gap-1.5 text-accent hover:underline"
            >
              <TrendingUp className="h-3.5 w-3.5" /> How the scoring works
            </Link>
          </div>
        </div>
      </header>

      {/* SECTOR CONTEXT BOX */}
      <section className="mb-8 rounded-xl border border-ink-700/60 bg-ink-900/40 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">
          Sector medians
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            ["Median P/E", stats.median_pe?.toFixed(1) ?? "—"],
            ["Median ROCE", stats.median_roce ? `${stats.median_roce}%` : "—"],
            ["Median OPM", stats.median_opm ? `${stats.median_opm}%` : "—"],
            ["Median D/E", stats.median_de?.toFixed(2) ?? "—"],
            [
              "Median Div Yield",
              stats.median_dividend_yield
                ? `${stats.median_dividend_yield}%`
                : "—",
            ],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-chalk-300/70">{label}</p>
              <p className="num text-xl font-semibold text-chalk-50 mt-1">
                {value}
              </p>
            </div>
          ))}
        </div>
        {sector.analyst_note && (
          <p className="mt-4 text-sm text-chalk-300 italic border-l-2 border-accent/40 pl-3">
            "{sector.analyst_note}" — Aditya
          </p>
        )}
      </section>

      {/* LEADERBOARD */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-accent mb-3">
          Leaderboard
        </h2>
        <Leaderboard sectorSlug={sector.slug} companies={sector.companies} />
        <p className="mt-2 text-xs text-chalk-300/60">
          Click any company to see the full +/- breakdown across all 10
          categories. Click column headers to sort.
        </p>
      </section>

      {/* CHARTS */}
      <section className="mb-8 grid gap-6 lg:grid-cols-2">
        <RadarCompare companies={sector.companies} />
        <ScoreBarChart companies={sector.companies} />
      </section>
    </div>
  );
}
