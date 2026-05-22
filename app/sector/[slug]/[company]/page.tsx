import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
} from "lucide-react";
import clsx from "clsx";
import { allSectorSlugs, loadSector, pointsColor } from "@/lib/data";
import { ScoreBadge } from "@/components/ScoreBadge";
import { CategoryCard } from "@/components/CategoryCard";

export async function generateStaticParams() {
  const slugs = await allSectorSlugs();
  const all: { slug: string; company: string }[] = [];
  for (const slug of slugs) {
    const sector = await loadSector(slug);
    if (!sector) continue;
    for (const co of sector.companies) {
      all.push({ slug, company: co.slug });
    }
  }
  return all;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string; company: string };
}) {
  const sector = await loadSector(params.slug);
  const co = sector?.companies.find((c) => c.slug === params.company);
  if (!co) return {};
  return {
    title: `${co.name} — ${co.final_score.toFixed(1)}/100`,
    description: `${co.name} fundamental score breakdown across 10 categories. Ranked ${co.rank} in ${sector?.name}.`,
  };
}

export default async function CompanyPage({
  params,
}: {
  params: { slug: string; company: string };
}) {
  const sector = await loadSector(params.slug);
  if (!sector) notFound();
  const co = sector.companies.find((c) => c.slug === params.company);
  if (!co) notFound();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link
        href={`/sector/${sector.slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-chalk-300 hover:text-chalk-50 mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to {sector.name}
      </Link>

      {/* HEADER */}
      <header className="rounded-2xl border border-ink-700/60 bg-ink-900/40 p-6 mb-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest text-accent">
              Rank {co.rank} of {sector.companies.length} in {sector.name}
            </p>
            <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-chalk-50">
              {co.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-chalk-300 num">
              <span className="font-semibold text-chalk-100">{co.ticker}</span>
              <span>CMP ₹{co.cmp.toLocaleString("en-IN")}</span>
              {co.raw.pe && <span>P/E {co.raw.pe.toFixed(1)}</span>}
              {co.raw.industry_pe && (
                <span>Industry P/E {co.raw.industry_pe.toFixed(1)}</span>
              )}
              {co.classification && (
                <span className="rounded-md border border-ink-700/60 px-2 py-0.5 text-xs uppercase tracking-wider">
                  {co.classification}
                </span>
              )}
            </div>
          </div>
          <ScoreBadge score={co.final_score} raw={co.raw_total} size="lg" />
        </div>

        {co.assumptions && co.assumptions.length > 0 && (
          <div className="mt-5 flex items-start gap-2 rounded-lg border border-warn/20 bg-warn/5 px-3 py-2">
            <AlertTriangle className="h-4 w-4 text-warn shrink-0 mt-0.5" />
            <div className="text-xs text-chalk-300">
              <span className="font-semibold text-warn">Assumptions: </span>
              {co.assumptions.join(" · ")}
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href={`https://www.screener.in/company/${co.ticker}/consolidated/`}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 rounded-md border border-ink-700/60 bg-ink-900 px-3 py-1.5 text-xs hover:bg-ink-800 transition-colors"
          >
            View on Screener <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </header>

      {/* CATEGORY BREAKDOWN */}
      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-accent">
            Score breakdown
          </h2>
          <Link
            href="/methodology"
            className="text-xs text-chalk-300 hover:text-accent"
          >
            How is this calculated? →
          </Link>
        </div>
        <div className="grid gap-3">
          {co.categories.map((cat) => (
            <CategoryCard key={cat.name} category={cat} />
          ))}
        </div>
        <p className="mt-3 text-xs text-chalk-300/70">
          Click any category to expand the per-rule breakdown. Green rows added
          points; red rows deducted.
        </p>
      </section>

      {/* PENALTIES */}
      {co.penalties.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-bad mb-3">
            Penalty deductions
          </h2>
          <ul className="rounded-xl border border-bad/30 bg-bad/5 divide-y divide-bad/10">
            {co.penalties.map((p, i) => (
              <li
                key={i}
                className="flex items-center justify-between px-5 py-3"
              >
                <div>
                  <p className="text-sm text-chalk-50">{p.label}</p>
                  <p className="text-xs text-chalk-300/80">{p.detail}</p>
                </div>
                <span className="num font-semibold text-bad">{p.points}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* STRENGTHS / WEAKNESSES */}
      <section className="mb-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <ThumbsUp className="h-4 w-4 text-accent" />
            <h3 className="font-semibold text-chalk-50">Key Strengths</h3>
          </div>
          <ul className="space-y-2">
            {co.strengths.map((s, i) => (
              <li key={i} className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="text-chalk-100">{s.label}</p>
                  <p className="text-xs text-chalk-300/70">{s.category}</p>
                </div>
                <span className={clsx("num font-semibold shrink-0", pointsColor(s.points))}>
                  +{s.points}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-bad/20 bg-bad/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <ThumbsDown className="h-4 w-4 text-bad" />
            <h3 className="font-semibold text-chalk-50">Key Risks</h3>
          </div>
          <ul className="space-y-2">
            {co.weaknesses.map((w, i) => (
              <li key={i} className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="text-chalk-100">{w.label}</p>
                  <p className="text-xs text-chalk-300/70">{w.category}</p>
                </div>
                <span className={clsx("num font-semibold shrink-0", pointsColor(w.points))}>
                  {w.points}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* RAW DATA */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-accent mb-3">
          Raw financial snapshot
        </h2>
        <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ["P/E", co.raw.pe?.toFixed(1)],
              ["Industry P/E", co.raw.industry_pe?.toFixed(1)],
              ["P/BV", co.raw.pbv?.toFixed(2)],
              ["ROE", co.raw.roe ? `${co.raw.roe}%` : null],
              ["ROCE", co.raw.roce ? `${co.raw.roce}%` : null],
              ["OPM (TTM)", co.raw.opm ? `${co.raw.opm}%` : null],
              ["D/E", co.raw.debt_to_equity?.toFixed(2)],
              ["Current Ratio", co.raw.current_ratio?.toFixed(2)],
              [
                "Dividend Yield",
                co.raw.dividend_yield ? `${co.raw.dividend_yield}%` : null,
              ],
              [
                "Pledged",
                co.raw.pledged_pct != null ? `${co.raw.pledged_pct}%` : null,
              ],
              [
                "Sales 5Y CAGR",
                co.raw.sales_5y_cagr ? `${co.raw.sales_5y_cagr}%` : null,
              ],
              [
                "Profit 5Y CAGR",
                co.raw.profit_5y_cagr ? `${co.raw.profit_5y_cagr}%` : null,
              ],
            ]
              .filter(([, v]) => v != null)
              .map(([label, value]) => (
                <div key={label as string}>
                  <p className="text-xs text-chalk-300/70">{label}</p>
                  <p className="num font-semibold text-chalk-50 mt-1">{value}</p>
                </div>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}
