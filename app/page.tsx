import Link from "next/link";
import { ArrowRight, BarChart3, Database, Sparkles } from "lucide-react";
import { loadSectorIndex, loadSectorsConfig } from "@/lib/data";
import { SectorSearch } from "@/components/SectorSearch";
import { SectorRefreshButton } from "@/components/SectorRefreshButton";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [sectorsConfig, scrapedIndex] = await Promise.all([
    loadSectorsConfig(),
    loadSectorIndex(),
  ]);

  const scrapedMap = new Map(scrapedIndex.map((s) => [s.slug, s]));
  const totalScraped = scrapedIndex.reduce((a, s) => a + s.companies_count, 0);

  const sectors = sectorsConfig.map((cfg) => ({
    ...cfg,
    scraped: scrapedMap.get(cfg.slug) ?? null,
  }));

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hero-grid" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 pt-14 sm:pt-24 pb-12 sm:pb-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            Stockscore · Updated weekly
          </span>
          <h1 className="mt-6 text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-chalk-50 leading-[1.1]">
            Fundamental analysis,{" "}
            <span className="text-accent">made transparent.</span>
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-base sm:text-lg text-chalk-300">
            Score every company in an Indian sector against its peers — across
            10 categories, 1000 points — and see exactly where each point was
            earned or lost.
          </p>

          <div className="mt-10">
            <SectorSearch sectors={scrapedIndex} />
          </div>

          <div className="mt-4 text-xs text-chalk-300/70">
            Or browse all {sectors.length} sectors below.
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-accent">
          How it works
        </h2>
        <div className="mt-6 grid gap-4 sm:gap-6 sm:grid-cols-3">
          {[
            {
              icon: Database,
              title: "Scrape",
              body: "Python pipeline pulls 5 years of financials, last 12 quarters, shareholding, and key ratios for every company in a sector — direct from screener.in.",
            },
            {
              icon: BarChart3,
              title: "Score",
              body: "A 10-category, 1000-point rubric mixes absolute thresholds with peer-relative quartiles. Every +/- point is traceable to a specific rule.",
            },
            {
              icon: Sparkles,
              title: "Visualise",
              body: "Sector leaderboards, radar overlays, and per-company breakdowns let you see the story behind the score — not just the number.",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-6"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent ring-1 ring-accent/30">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold text-chalk-50">
                {i + 1}. {s.title}
              </h3>
              <p className="mt-2 text-sm text-chalk-300">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTORS GRID */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-12">
        <div className="mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-accent">
            Sectors covered
          </h2>
          <p className="mt-2 text-2xl font-semibold text-chalk-50">
            {sectorsConfig.length} sectors
            {totalScraped > 0 && (
              <span className="text-chalk-300 font-normal text-lg">
                {" "}· {totalScraped} companies scored
              </span>
            )}
          </p>
          {scrapedIndex.length < sectorsConfig.length && (
            <p className="mt-1 text-xs text-chalk-300/50">
              {scrapedIndex.length} of {sectorsConfig.length} sectors have data — refresh any card below to fetch.
            </p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sectors.map((s) => {
            const scraped = s.scraped;
            return (
              <div
                key={s.slug}
                className="group rounded-xl border border-ink-700/60 bg-ink-900/40 hover:border-accent/40 hover:bg-ink-900 transition-colors flex flex-col"
              >
                {/* Main content */}
                <div className="p-5 flex-1">
                  <div className="flex items-baseline justify-between">
                    <h3 className={`font-semibold transition-colors group-hover:text-accent ${scraped ? "text-chalk-50" : "text-chalk-300"}`}>
                      {s.name}
                    </h3>
                    <span className="num text-xs text-chalk-300/60">
                      {scraped ? scraped.companies_count : s.companies.length}
                    </span>
                  </div>
                  <p className={`mt-2 text-sm line-clamp-2 ${scraped ? "text-chalk-300" : "text-chalk-300/50"}`}>
                    {s.description}
                  </p>

                  {scraped?.top_company ? (
                    <div className="mt-4 pt-4 border-t border-ink-700/40 flex items-center justify-between text-xs">
                      <span className="text-chalk-300/70">Top pick</span>
                      <span className="num text-chalk-100">
                        {scraped.top_ticker ?? scraped.top_company}{" "}
                        <span className="text-accent">{scraped.top_score?.toFixed(1)}</span>
                      </span>
                    </div>
                  ) : (
                    <div className="mt-4 pt-4 border-t border-ink-700/30">
                      <span className="text-xs text-chalk-300/30">
                        No data yet — refresh to fetch
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer: view link + refresh button */}
                <div className="px-5 pb-4 flex items-center justify-between gap-2">
                  {scraped ? (
                    <Link
                      href={`/sector/${s.slug}`}
                      className="inline-flex items-center text-xs text-chalk-300 hover:text-accent transition-colors"
                    >
                      View sector <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  ) : (
                    <span />
                  )}
                  {process.env.NEXT_PUBLIC_ENABLE_REFRESH && (
                    <SectorRefreshButton sectorSlug={s.slug} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* MY PITCH */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-accent">
          Why I built this
        </h2>
        <div className="mt-4 space-y-4 text-chalk-200 serif text-lg leading-relaxed">
          <p>
            I'm a full-stack developer transitioning to wealth management. I've
            been investing my own money since 2021 — first in direct equities,
            then across asset classes — and I've guided seven friends and
            family members through their first investing decisions.
          </p>
          <p>
            Screeners exist. Reports exist. But neither shows you{" "}
            <em>why</em> a company scores well. This project is my answer to
            that gap — and a way to put my fundamental-analysis approach in
            front of anyone who wants to see it.
          </p>
          <p className="text-chalk-300 text-base">
            <Link
              href="/about"
              className="text-accent hover:underline inline-flex items-center gap-1"
            >
              Read more about me <ArrowRight className="h-3 w-3" />
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
