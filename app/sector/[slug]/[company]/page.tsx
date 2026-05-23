import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import clsx from "clsx";
import { loadSector, pointsColor, loadCompanyDetail } from "@/lib/data";
import { extractChartData } from "@/lib/company-data";
import { ScoreBadge } from "@/components/ScoreBadge";
import { CategoryCard } from "@/components/CategoryCard";
import { FinancialCharts } from "@/components/FinancialCharts";
import { FinancialTable } from "@/components/FinancialTable";

export const dynamic = "force-dynamic";

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

  const detail = await loadCompanyDetail(co.ticker);
  const chartData = detail ? extractChartData(detail, co.ticker) : null;
  const peers = sector.companies
    .filter((c) => c.slug !== co.slug)
    .map((c) => ({ name: c.name, symbol: c.ticker, ticker: c.ticker }));

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

      {/* COMPANY PROFILE */}
      {detail && (detail.about || detail.key_points) && (
        <section className="mb-10 grid gap-6 md:grid-cols-2">
          {detail.about && (
            <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-5">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">About</h3>
              <p className="text-sm text-chalk-300 leading-relaxed">{detail.about.replace(/\[\d+\]/g, "")}</p>
            </div>
          )}
          {detail.key_points && (
            <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-5">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">Key Points</h3>
              <p className="text-sm text-chalk-300 leading-relaxed whitespace-pre-line">{detail.key_points.replace(/\[\d+\]/g, "").trim()}</p>
            </div>
          )}
        </section>
      )}

      {/* ALL KEY RATIOS */}
      {detail && Object.keys(detail.ratios).length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-accent mb-3">All Key Ratios</h2>
          <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-4">
              {Object.entries(detail.ratios).map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-chalk-300/70 leading-tight">{k}</p>
                  <p className="num text-sm font-semibold text-chalk-100 mt-0.5">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* GROWTH & CAGR + PROS & CONS */}
      {detail && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-accent mb-3">Growth & CAGR</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(detail.growth_tables).map(([title, rows]) => (
              <div key={title} className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-4">
                <p className="text-xs font-semibold text-chalk-300 mb-2">{title}</p>
                <div className="space-y-1">
                  {Object.entries(rows).map(([period, value]) => (
                    <div key={period} className="flex justify-between text-xs">
                      <span className="text-chalk-300/70">{period}</span>
                      <span className={`num font-semibold ${parseFloat(value) >= 0 ? "text-accent" : "text-bad"}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* {(detail.pros_cons.pros.length > 0 || detail.pros_cons.cons.length > 0) && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-accent mb-3">Screener Analysis</h2>
              <div className="space-y-3">
                {detail.pros_cons.pros.length > 0 && (
                  <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
                    <p className="text-xs font-semibold text-accent mb-2">Positives</p>
                    <ul className="space-y-1.5">
                      {detail.pros_cons.pros.map((p, i) => (
                        <li key={i} className="text-xs text-chalk-300 flex gap-2">
                          <span className="text-accent shrink-0">+</span>{p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {detail.pros_cons.cons.length > 0 && (
                  <div className="rounded-xl border border-bad/20 bg-bad/5 p-4">
                    <p className="text-xs font-semibold text-bad mb-2">Concerns</p>
                    <ul className="space-y-1.5">
                      {detail.pros_cons.cons.map((c, i) => (
                        <li key={i} className="text-xs text-chalk-300 flex gap-2">
                          <span className="text-bad shrink-0">−</span>{c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )} */}
        </section>
      )}

      {/* FINANCIAL CHARTS */}
      {chartData && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-accent mb-4">Financial Charts</h2>
          <FinancialCharts primaryData={chartData} primaryName={co.name} peers={peers} />
        </section>
      )}

      {/* FINANCIAL TABLES */}
      {detail && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-accent mb-3">Financial Tables</h2>
          <div className="space-y-2">
            {(
              [
                ["Quarterly Results", detail.financial_tables.quarters],
                ["Profit & Loss", detail.financial_tables.profit_loss],
                ["Balance Sheet", detail.financial_tables.balance_sheet],
                ["Cash Flow", detail.financial_tables.cash_flow],
                ["Annual Ratios", detail.financial_tables.ratios],
                ["Shareholding Pattern", detail.financial_tables.shareholding],
                ["Peer Comparison", detail.financial_tables.peers],
              ] as [string, string | null][]
            ).map(([title, csv]) => (
              <details key={title} className="group rounded-xl border border-ink-700/60 bg-ink-900/40">
                <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer list-none select-none">
                  <span className="text-sm font-medium text-chalk-100">{title}</span>
                  <ChevronDown className="h-4 w-4 text-chalk-300 transition-transform group-open:rotate-180" />
                </summary>
                <div className="border-t border-ink-700/40">
                  <FinancialTable csv={csv} />
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* ANNOUNCEMENTS */}
      {detail && (detail.announcements.important.length > 0 || detail.announcements.recent.length > 0) && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-accent mb-3">Announcements</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {detail.announcements.important.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-chalk-300/70 uppercase tracking-wider mb-2">Important</h3>
                <div className="space-y-2">
                  {detail.announcements.important.map((a, i) => (
                    <a
                      key={i}
                      href={a.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="block rounded-lg border border-ink-700/60 bg-ink-900/40 px-4 py-3 hover:border-accent/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs text-chalk-100 leading-snug flex-1">{a.summary || a.title}</p>
                        <ExternalLink className="h-3 w-3 text-chalk-300/40 shrink-0 mt-0.5" />
                      </div>
                      <p className="text-xs text-chalk-300/50 mt-1.5 num">{a.date}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}
            {detail.announcements.recent.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-chalk-300/70 uppercase tracking-wider mb-2">Recent</h3>
                <div className="space-y-2">
                  {detail.announcements.recent.map((a, i) => (
                    <a
                      key={i}
                      href={a.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="block rounded-lg border border-ink-700/60 bg-ink-900/40 px-4 py-3 hover:border-accent/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs text-chalk-100 leading-snug flex-1">{a.summary || a.title}</p>
                        <ExternalLink className="h-3 w-3 text-chalk-300/40 shrink-0 mt-0.5" />
                      </div>
                      <p className="text-xs text-chalk-300/50 mt-1.5 num">{a.date}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
