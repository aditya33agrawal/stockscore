import Link from "next/link";
import { ArrowRight, BarChart3, Database, Sparkles } from "lucide-react";
import { loadSectorIndex, loadSectorsConfig, loadCompaniesIndex } from "@/lib/data";
import { SectorSearch } from "@/components/SectorSearch";
import { HeroChart } from "@/components/HeroChart";
import { scoreGradient, scoreColor } from "@/lib/format";
import clsx from "clsx";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [sectorsConfig, scrapedIndex, companies] = await Promise.all([
    loadSectorsConfig(),
    loadSectorIndex(),
    loadCompaniesIndex(),
  ]);

  const scrapedMap   = new Map(scrapedIndex.map((s) => [s.slug, s]));
  const totalScraped = scrapedIndex.reduce((a, s) => a + s.companies_count, 0);

  const sectors = sectorsConfig
    .map((cfg) => ({ ...cfg, scraped: scrapedMap.get(cfg.slug) ?? null }))
    .sort((a, b) => (b.scraped?.top_score ?? -1) - (a.scraped?.top_score ?? -1))
    .slice(0, 9);

  return (
    <div>
      {/* ── HERO ──────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hero-grid" />
        <HeroChart />

        {/* Bottom fade so chart dissolves into page */}
        <div
          className="absolute bottom-0 inset-x-0 h-28 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgb(var(--ink-950)), transparent)" }}
        />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 pt-20 sm:pt-32 pb-20 sm:pb-28 text-center">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent mb-8 tracking-widest uppercase shadow-sm">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent" />
            Live · Updated weekly
          </div>

          <h1 className="text-[clamp(38px,5.5vw,74px)] font-bold tracking-tight text-chalk-50 leading-[1.05] mb-6">
            See exactly{" "}
            <span className="text-accent italic">why</span>
            <br />
            a stock scores high.
          </h1>

          <p className="max-w-lg mx-auto text-[17px] text-chalk-200 leading-relaxed mb-10">
            Transparent, rule-based fundamental analysis of every Indian sector
            across 10 categories. No black boxes — every +/− is traceable to a rule.
          </p>

          <SectorSearch sectors={scrapedIndex} companies={companies} />

          {/* Stats strip */}
          <div className="mt-10 inline-flex items-center divide-x border border-ink-700 rounded-2xl overflow-hidden bg-ink-900/60 backdrop-blur-sm shadow-sm">
            {[
              { num: sectorsConfig.length.toString(), label: "Sectors" },
              { num: `${totalScraped}+`,              label: "Companies" },
              { num: "10",                            label: "Score Categories" },
            ].map((s) => (
              <div key={s.label} className="text-center px-8 sm:px-12 py-5" style={{ borderColor: "rgb(var(--ink-700))" }}>
                <div className="num text-[28px] font-bold text-accent leading-none tracking-tight">
                  {s.num}
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-chalk-300 mt-1.5">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="section-rule mx-auto max-w-7xl" />

      {/* ── HOW IT WORKS ─────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent mb-3">How it works</p>
        <h2 className="text-2xl font-bold tracking-tight text-chalk-50 mb-3">
          From raw filings to a score you can trust.
        </h2>
        <p className="max-w-2xl text-[15px] text-chalk-200 leading-relaxed mb-10">
          Three purpose-built engines — each transparent by design. Every input, rule, and adjustment is traceable; nothing is hidden behind a black box.
        </p>

        <div className="grid gap-4 sm:gap-5 sm:grid-cols-3">
          {[
            {
              icon: Database,
              title: "Scraping Engine",
              body: "Pulls 5 years of annual financials, 12 quarters of results, shareholding patterns, and key ratios for every company — sourced directly from screener.in.",
            },
            {
              icon: BarChart3,
              title: "Scoring Engine",
              body: "A 10-category rubric blends absolute thresholds with peer-relative quartiles. Every contribution — positive or negative — maps to a specific, documented rule.",
            },
            {
              icon: Sparkles,
              title: "Intelligence Layer",
              body: "Sector leaderboards, radar overlays, and per-company breakdowns surface the story behind each score — so you know exactly why a company ranks where it does.",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="glass border-subtle rounded-2xl p-6 hover:border-accent/25 hover:-translate-y-0.5 transition-all duration-200"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 border border-accent/20 text-accent mb-4">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="font-bold text-[15px] text-chalk-50 mb-2">
                {i + 1}. {s.title}
              </h3>
              <p className="text-sm text-chalk-200 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className="section-rule mx-auto max-w-7xl" />

      {/* ── LEARN NUDGE ──────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="glass border-subtle rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-sm text-chalk-200">
            <span className="text-chalk-100 font-semibold">New to these metrics?</span>
            {" "}The Learn page explains every ratio — P/E, ROCE, D/E, promoter holding and more — from first principles.
          </p>
          <Link
            href="/learn"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-xs font-semibold text-accent hover:bg-accent/15 transition-colors"
          >
            Explore the Glossary <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </section>

      <hr className="section-rule mx-auto max-w-7xl" />

      {/* ── SECTORS GRID ─────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent mb-2">Top Sectors</p>
            <h2 className="text-2xl font-bold tracking-tight text-chalk-50">
              {sectorsConfig.length} sectors{" "}
              {totalScraped > 0 && (
                <span className="text-chalk-300 font-normal text-xl">
                  · {totalScraped} companies scored
                </span>
              )}
            </h2>
          </div>
          <div className="flex gap-2.5">
            <Link
              href="/sectors/compare"
              className="inline-flex items-center gap-1.5 rounded-xl border border-ink-700 px-4 py-2 text-sm font-medium text-chalk-200 hover:text-chalk-50 hover:border-ink-600 transition-all"
            >
              Compare <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/sectors"
              className="inline-flex items-center gap-1.5 rounded-xl border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent hover:bg-accent/18 hover:border-accent/45 transition-all"
            >
              See all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sectors.map((s) => {
            const scraped  = s.scraped;
            const score    = scraped?.top_score ?? null;
            const gradient = score != null ? scoreGradient(score) : undefined;

            return (
              <div
                key={s.slug}
                className="group glass border-subtle rounded-2xl p-6 flex flex-col hover:border-accent/25 hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Tag + name */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-chalk-300 mb-1.5">
                      {scraped ? `${scraped.companies_count} companies` : `${s.companies.length} companies`}
                    </p>
                    <h3 className={clsx(
                      "font-bold text-[16px] leading-tight transition-colors",
                      scraped ? "text-chalk-50 group-hover:text-accent" : "text-chalk-300/70",
                    )}>
                      {s.name}
                    </h3>
                  </div>

                  {score != null && (
                    <div className="text-right shrink-0">
                      <div className={clsx("num text-2xl font-bold leading-none", scoreColor(score))}>
                        {score.toFixed(1)}
                      </div>
                      <div className="text-[9px] text-chalk-300/60 mt-0.5 num">/100</div>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                {score != null && (
                  <div className="h-0.5 w-full rounded-full mb-4 overflow-hidden bg-ink-700/60">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${score}%`, background: gradient }}
                    />
                  </div>
                )}

                <p className={clsx(
                  "text-sm line-clamp-2 leading-relaxed flex-1",
                  scraped ? "text-chalk-200" : "text-chalk-300/50",
                )}>
                  {s.description}
                </p>

                {/* Footer */}
                {scraped?.top_company ? (
                  <div className="mt-4 pt-4 border-t border-ink-700/70 flex items-center justify-between">
                    <span className="text-[11px] text-chalk-300">Top pick</span>
                    <span className="num text-[12px] font-semibold text-chalk-100">
                      {scraped.top_ticker ?? scraped.top_company}{" "}
                      <span className="text-accent">{scraped.top_score?.toFixed(1)}</span>
                    </span>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-ink-700/50">
                    <span className="text-[11px] text-chalk-300/60">No data yet</span>
                  </div>
                )}

                {scraped && (
                  <div className="mt-3">
                    <Link
                      href={`/sector/${s.slug}`}
                      className="inline-flex items-center text-xs font-medium text-chalk-300 hover:text-accent transition-colors"
                    >
                      View sector <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <hr className="section-rule mx-auto max-w-7xl" />

      {/* ── WHY I BUILT THIS ─────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent mb-3">Why I built this</p>
        <div className="space-y-5 text-[16px] leading-[1.8] text-chalk-200">
          <p>
            I&apos;m a full-stack developer transitioning to wealth management. I&apos;ve
            been investing my own money since 2023 — first in direct equities,
            then across asset classes — and I offer pro-bono consulting to
            first-time investors who want to learn how to think about their money.
          </p>
          <p>
            Screeners exist. Reports exist. But neither shows you{" "}
            <em className="text-chalk-50 not-italic font-semibold">why</em> a company scores well.
            This project is my answer to that gap — and a way to put my fundamental-analysis approach in
            front of anyone who wants to see it.
          </p>
        </div>
      </section>
    </div>
  );
}
