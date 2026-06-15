import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { loadSector, loadCompanyDetail } from "@/lib/data";
import { extractChartData, parseFinancialCSV, toNum } from "@/lib/company-data";
import { CompanyHero } from "@/components/CompanyHero";
import { StoryPanel } from "@/components/StoryPanel";
import { ScoreBars } from "@/components/ScoreBars";
import { MetricsGlance } from "@/components/MetricsGlance";
import { PriceSnapshot } from "@/components/PriceSnapshot";
import { DeepDive } from "@/components/DeepDive";
import { StickyVerdict } from "@/components/StickyVerdict";
import { PeerComparisonTable } from "@/components/PeerComparisonTable";
import { AnnouncementList } from "@/components/AnnouncementList";
import { CompanySideNav } from "@/components/CompanySideNav";
import {
  evaluatePE,
  evaluateROE,
  evaluateROCE,
  evaluateOPM,
  evaluateDE,
  evaluateDividend,
  evaluateSalesProfit,
  evaluateTrend,
  evaluateCashConversion,
  evaluateCurrentRatio,
} from "@/lib/evaluators";
import type { MetricCardProps } from "@/components/MetricCard";

// Data only changes on the weekly refresh pipeline — pages render on first
// request and are then cached for an hour (on-demand ISR), instead of
// re-querying Postgres on every request.
export const revalidate = 3600;

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

  // Build MetricCard data
  const metricCards: MetricCardProps[] = [];

  // currentRatioVal is hoisted so it can be used both inside the metric-card block
  // and later in the Balance Sheet category patch.
  let currentRatioVal: number | null = co.raw.current_ratio != null
    ? co.raw.current_ratio
    : (() => {
        if (detail?.ratios) {
          const key = Object.keys(detail.ratios).find(
            (k) => k.toLowerCase() === "current ratio"
          );
          const stripRaw = key ? detail.ratios[key] : undefined;
          if (stripRaw) {
            const n = parseFloat(stripRaw.replace(/[^0-9.]/g, ""));
            if (!isNaN(n)) return n;
          }
        }
        const ratTable = parseFinancialCSV(detail?.financial_tables.ratios ?? null);
        const rowKey = Object.keys(ratTable.rowMap).find(
          (k) => k.toLowerCase() === "current ratio"
        );
        if (rowKey) {
          const vals = ratTable.rowMap[rowKey] ?? [];
          for (let i = vals.length - 1; i >= 0; i--) {
            const n = toNum(vals[i]);
            if (n !== null) return n;
          }
        }
        return null;
      })();

  if (chartData) {
    const evPE = evaluatePE(co.raw);
    metricCards.push({
      title: "Valuation: P/E",
      learnHref: "/learn#pe",
      headline: co.raw.pe ? `${co.raw.pe.toFixed(1)}x` : "N/A",
      badge: co.raw.pe && co.raw.industry_pe
        ? (() => {
            const r = co.raw.pe / co.raw.industry_pe;
            if (r < 0.6) return { label: "Deep discount", tone: "excellent" as const };
            if (r < 0.8) return { label: "Cheap vs sector", tone: "good" as const };
            if (r <= 1.2) return { label: "In line with sector", tone: "neutral" as const };
            if (r <= 1.5) return { label: "Pricier than sector", tone: "warn" as const };
            return { label: "Very expensive", tone: "bad" as const };
          })()
        : undefined,
      sentence: evPE.sentence,
      sentenceTone: evPE.tone,
      spark: co.raw.pe && co.raw.industry_pe
        ? {
            type: "comparison",
            rows: [
              { label: "Stock P/E", value: co.raw.pe },
              { label: "Industry P/E", value: co.raw.industry_pe },
            ],
            formatter: "x",
          }
        : undefined,
    });

    const evROE = evaluateROE(co.raw);
    metricCards.push({
      title: "Return on Equity",
      learnHref: "/learn#roe",
      headline: co.raw.roe ? `${co.raw.roe.toFixed(1)}%` : "N/A",
      badge: co.raw.roe
        ? (() => {
            const v = co.raw.roe;
            if (v >= 25) return { label: "Excellent", tone: "excellent" as const };
            if (v >= 18) return { label: "Strong", tone: "good" as const };
            if (v >= 12) return { label: "Decent", tone: "neutral" as const };
            if (v >= 8)  return { label: "Weak", tone: "warn" as const };
            return { label: "Very weak", tone: "bad" as const };
          })()
        : undefined,
      sentence: evROE.sentence,
      sentenceTone: evROE.tone,
      spark: chartData.annualRoe.some((v) => v !== null)
        ? {
            type: "line",
            rows: chartData.annualLabels.map((l, i) => ({ label: l, value: chartData.annualRoe[i] })),
            label: "ROE %",
            formatter: "pct",
          }
        : undefined,
    });

    const evROCE = evaluateROCE(co.raw);
    metricCards.push({
      title: "Return on Capital Employed",
      learnHref: "/learn#roce",
      headline: co.raw.roce ? `${co.raw.roce.toFixed(1)}%` : "N/A",
      badge: co.raw.roce
        ? (() => {
            const v = co.raw.roce;
            if (v >= 25) return { label: "Exceptional", tone: "excellent" as const };
            if (v >= 18) return { label: "Strong", tone: "good" as const };
            if (v >= 12) return { label: "Decent", tone: "neutral" as const };
            if (v >= 8)  return { label: "Below par", tone: "warn" as const };
            return { label: "Poor", tone: "bad" as const };
          })()
        : undefined,
      sentence: evROCE.sentence,
      sentenceTone: evROCE.tone,
      spark: chartData.annualRoce.some((v) => v !== null)
        ? {
            type: "line",
            rows: chartData.annualLabels.map((l, i) => ({ label: l, value: chartData.annualRoce[i] })),
            label: "ROCE %",
            formatter: "pct",
          }
        : undefined,
    });

    const evOPM = evaluateOPM(co.raw);
    metricCards.push({
      title: "Operating Margin (OPM)",
      learnHref: "/learn#opm",
      headline: co.raw.opm ? `${co.raw.opm.toFixed(1)}%` : "N/A",
      badge: co.raw.opm
        ? (() => {
            const v = co.raw.opm;
            if (v >= 30) return { label: "Exceptional margin", tone: "excellent" as const };
            if (v >= 20) return { label: "Wide margin", tone: "good" as const };
            if (v >= 10) return { label: "Healthy", tone: "neutral" as const };
            if (v >= 5)  return { label: "Thin margin", tone: "warn" as const };
            return { label: "Very thin / loss", tone: "bad" as const };
          })()
        : undefined,
      sentence: evOPM.sentence,
      sentenceTone: evOPM.tone,
      spark: chartData.quarterlyOpm.some((v) => v !== null)
        ? {
            type: "bar",
            rows: chartData.quarterlyLabels.slice(-8).map((l, i) => ({
              label: l,
              value: chartData.quarterlyOpm[chartData.quarterlyLabels.length - 8 + i] ?? null,
            })),
            label: "OPM %",
            formatter: "pct",
          }
        : undefined,
    });

    const evDE = evaluateDE(co.raw);
    metricCards.push({
      title: "Debt to Equity",
      learnHref: "/learn#de",
      headline: co.raw.debt_to_equity != null ? `${co.raw.debt_to_equity.toFixed(2)}` : "N/A",
      badge: co.raw.debt_to_equity != null
        ? (() => {
            const v = co.raw.debt_to_equity;
            if (v < 0.1) return { label: "Debt-free", tone: "excellent" as const };
            if (v < 0.5) return { label: "Low leverage", tone: "good" as const };
            if (v < 1)   return { label: "Moderate", tone: "neutral" as const };
            if (v < 2)   return { label: "High leverage", tone: "warn" as const };
            return { label: "Very high leverage", tone: "bad" as const };
          })()
        : undefined,
      sentence: evDE.sentence,
      sentenceTone: evDE.tone,
      spark: chartData.annualDe.some((v) => v !== null)
        ? {
            type: "line",
            rows: chartData.annualLabels.map((l, i) => ({ label: l, value: chartData.annualDe[i] })),
            label: "D/E",
            formatter: "ratio",
          }
        : undefined,
    });

    const evCR = evaluateCurrentRatio({ ...co.raw, current_ratio: currentRatioVal ?? undefined });
    metricCards.push({
      title: "Current Ratio",
      learnHref: "/learn#current-ratio",
      headline: currentRatioVal != null ? currentRatioVal.toFixed(2) : "N/A",
      badge: currentRatioVal != null
        ? (() => {
            const v = currentRatioVal;
            if (v >= 3)   return { label: "Excellent liquidity", tone: "excellent" as const };
            if (v >= 2)   return { label: "Strong liquidity", tone: "good" as const };
            if (v >= 1.5) return { label: "Adequate", tone: "neutral" as const };
            if (v >= 1)   return { label: "Thin buffer", tone: "warn" as const };
            return { label: "Below 1", tone: "bad" as const };
          })()
        : undefined,
      sentence: evCR.sentence,
      sentenceTone: evCR.tone,
    });

    const evSP = evaluateSalesProfit(co.raw);
    metricCards.push({
      title: "Revenue & Profit Growth",
      learnHref: "/learn#sales-growth",
      headline: co.raw.sales_5y_cagr && co.raw.profit_5y_cagr
        ? `${co.raw.profit_5y_cagr.toFixed(0)}% profit CAGR`
        : co.raw.profit_5y_cagr
        ? `${co.raw.profit_5y_cagr.toFixed(0)}% 5Y`
        : "—",
      sentence: evSP.sentence,
      sentenceTone: evSP.tone,
      spark: chartData.annualSales.some((v) => v !== null)
        ? {
            type: "dualBar",
            rows: chartData.annualLabels.map((l, i) => ({
              label: l,
              value: chartData.annualSales[i],
              value2: chartData.annualNetProfit[i],
            })),
            label: "Sales",
            label2: "Net Profit",
            formatter: "cr",
          }
        : undefined,
    });

    const evDiv = evaluateDividend(co.raw);
    metricCards.push({
      title: "Dividend Yield",
      learnHref: "/learn#dividend-yield",
      headline: co.raw.dividend_yield ? `${co.raw.dividend_yield.toFixed(2)}%` : "Nil",
      badge: co.raw.dividend_yield
        ? (() => {
            const v = co.raw.dividend_yield;
            if (v >= 5) return { label: "Excellent yield", tone: "excellent" as const };
            if (v >= 3) return { label: "Strong yield", tone: "good" as const };
            if (v >= 1) return { label: "Moderate", tone: "neutral" as const };
            return { label: "Low", tone: "neutral" as const };
          })()
        : { label: "No dividend", tone: "neutral" },
      sentence: evDiv.sentence,
      sentenceTone: evDiv.tone,
    });

    const evCC = evaluateCashConversion(chartData.cfCfo, chartData.annualNetProfit);
    if (evCC.ratio !== null) {
      metricCards.push({
        title: "Earnings Quality (CFO / PAT)",
        learnHref: "/learn#cfo-pat",
        headline: `${(evCC.ratio * 100).toFixed(0)}%`,
        badge: (() => {
          const v = evCC.ratio!;
          if (v >= 1.2) return { label: "Pristine earnings", tone: "excellent" as const };
          if (v >= 1.0) return { label: "Cash-backed", tone: "good" as const };
          if (v >= 0.7) return { label: "Reasonable", tone: "neutral" as const };
          if (v >= 0.4) return { label: "Watch earnings", tone: "warn" as const };
          return { label: "Earnings quality risk", tone: "bad" as const };
        })(),
        sentence: evCC.sentence,
        sentenceTone: evCC.tone,
        spark: chartData.cfCfo.some((v) => v !== null)
          ? {
              type: "dualBar",
              rows: chartData.cfLabels.map((l, i) => ({
                label: l,
                value: chartData.cfCfo[i],
                value2: chartData.annualNetProfit[chartData.annualLabels.indexOf(l)] ?? null,
              })),
              label: "CFO",
              label2: "Net Profit",
              formatter: "cr",
            }
          : undefined,
      });
    }

    const nonNullPromoter = chartData.shPromoter.filter((v): v is number => v != null);
    let latestPromoter: number | null = nonNullPromoter.length > 0 ? nonNullPromoter[nonNullPromoter.length - 1] : null;
    if (latestPromoter == null) {
      const hasOtherShareholders =
        chartData.shFii.some((v) => v != null) ||
        chartData.shDii.some((v) => v != null) ||
        chartData.shPublic.some((v) => v != null);
      if (hasOtherShareholders) latestPromoter = 0;
    }
    const prevPromoter = nonNullPromoter.length > 4 ? nonNullPromoter[nonNullPromoter.length - 5] : nonNullPromoter.length > 0 ? nonNullPromoter[0] : null;
    const promoterDelta = latestPromoter != null && prevPromoter != null ? latestPromoter - prevPromoter : null;
    const isPledgedHigh = co.raw.pledged_pct != null && co.raw.pledged_pct > 10;
    const isPledgedSevere = co.raw.pledged_pct != null && co.raw.pledged_pct > 25;
    const hasNoPromoters = latestPromoter != null && latestPromoter < 0.05;
    metricCards.push({
      title: "Promoter Holding",
      learnHref: "/learn#promoter-holding",
      headline: hasNoPromoters
        ? "None"
        : latestPromoter != null
        ? `${latestPromoter.toFixed(1)}%`
        : "N/A",
      badge: hasNoPromoters
        ? { label: "No promoters", tone: "neutral" }
        : isPledgedSevere
        ? { label: `${co.raw.pledged_pct!.toFixed(1)}% pledged ⚠`, tone: "bad" }
        : isPledgedHigh
        ? { label: `${co.raw.pledged_pct!.toFixed(1)}% pledged ⚠`, tone: "warn" }
        : promoterDelta != null
        ? {
            label: promoterDelta > 0.5 ? `↑ ${promoterDelta.toFixed(1)}pp` : promoterDelta < -0.5 ? `↓ ${Math.abs(promoterDelta).toFixed(1)}pp` : "Stable",
            tone: promoterDelta > 2 ? "excellent" : promoterDelta > 0.5 ? "good" : promoterDelta < -2 ? "bad" : promoterDelta < -0.5 ? "warn" : "neutral",
          }
        : undefined,
      sentence: hasNoPromoters
        ? `No promoter holding — company is widely held (typical of PSUs or professionally-managed firms).`
        : latestPromoter == null
        ? `Promoter holding data not available.`
        : isPledgedHigh
        ? `${co.raw.pledged_pct!.toFixed(1)}% of promoter shares are pledged — a key risk if the stock corrects sharply.`
        : promoterDelta != null && Math.abs(promoterDelta) > 0.5
        ? `Promoters ${promoterDelta > 0 ? "increased" : "reduced"} stake by ${Math.abs(promoterDelta).toFixed(1)}pp over the last year.`
        : `Promoters hold ${latestPromoter.toFixed(1)}% — stable ownership structure.`,
      sentenceTone: hasNoPromoters ? "neutral" : isPledgedHigh ? "warn" : promoterDelta != null && promoterDelta > 0.5 ? "good" : promoterDelta != null && promoterDelta < -0.5 ? "warn" : "neutral",
      spark: chartData.shPromoter.some((v) => v !== null)
        ? {
            type: "line",
            rows: chartData.shLabels.map((l, i) => ({ label: l, value: chartData.shPromoter[i] })),
            label: "Promoter %",
            formatter: "pct",
          }
        : undefined,
    });
  }

  const trendInfo = evaluateTrend(co.cmp, co.raw);

  // Patch Balance Sheet category — update the "Current Ratio" item detail with the
  // actual fetched value (the scorer may have stored 0 / "unavailable" if the scraper
  // didn't capture it at scoring time, but detail.ratios always has it).
  const patchedCategories = co.categories.map((cat) => {
    if (cat.name !== "Balance Sheet") return cat;
    return {
      ...cat,
      items: cat.items.map((item) => {
        if (item.label !== "Current Ratio") return item;
        // Use the already-computed currentRatioVal which has the full fallback chain
        if (currentRatioVal != null && (!item.detail || item.detail.includes("unavailable") || item.detail.includes("0.00"))) {
          return {
            ...item,
            detail: `Current ratio ${currentRatioVal.toFixed(2)}`,
          };
        }
        return item;
      }),
    };
  });

  function parse52wHL(value: string | undefined): { high: number | null; low: number | null } {
    if (!value) return { high: null, low: null };
    const parts = value.split("/").map((p) => parseFloat(p.replace(/[₹,\s]/g, "")));
    return {
      high: parts[0] > 0 ? parts[0] : null,
      low: parts[1] > 0 ? parts[1] : null,
    };
  }
  const { high: high52w, low: low52w } = parse52wHL(detail?.ratios["High / Low"]);

  const hasAnnouncements =
    detail && (detail.announcements.important.length > 0 || detail.announcements.recent.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 scroll-smooth">
      {/* Sticky verdict mini-bar (appears when hero scrolls off) */}
      <StickyVerdict
        name={co.name}
        score={co.final_score}
        classification={co.classification}
      />

      {/* Fixed side navigation */}
      <CompanySideNav />

      {/* ── LAYER 1: VERDICT ──────────────────────────────────── */}
      <CompanyHero
        co={co}
        sector={sector}
        trendInfo={trendInfo}
        refreshedAt={detail?.refreshed_at ?? sector.refreshed_at}
      />

      {/* Learn nudge */}
      <p className="mb-8 text-xs text-chalk-300/35">
        Not sure what these metrics mean?{" "}
        <Link href="/learn" className="hover:text-accent transition-colors underline underline-offset-2">
          Learn the fundamentals →
        </Link>
      </p>

      {/* ── LAYER 2: THE STORY ───────────────────────────────────── */}
      <div className="mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent mb-1">The Story</p>
        <h2 className="text-xl font-bold text-chalk-50 mb-1">What&apos;s strong · What to watch</h2>
        <p className="text-xs text-chalk-300/50 mb-5">
          Top factors that shaped the score. Points in green helped; red/amber are risks.
        </p>
      </div>
      <StoryPanel co={co} />

      {/* ── LAYER 3: SCORE BREAKDOWN ─────────────────────────────── */}
      <section id="breakdown" className="mb-10 scroll-mt-24">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent mb-1">Score Breakdown</p>
            <h2 className="text-xl font-bold text-chalk-50">10 categories · every point explained</h2>
          </div>
          <Link
            href="/methodology"
            className="text-xs text-chalk-300/40 hover:text-accent transition-colors"
          >
            Methodology →
          </Link>
        </div>
        <p className="mb-4 text-[12px] text-chalk-300/50 leading-relaxed">
          <span className="font-semibold text-chalk-300/80">Source:</span> based on my own research, parameters, and judgement —{" "}
          <span className="text-chalk-100">not investment advice.</span>
        </p>
        <ScoreBars categories={patchedCategories} />
      </section>

      {/* ── LAYER 4: EVIDENCE ────────────────────────────────────── */}
      <section id="evidence" className="mb-10 scroll-mt-24 space-y-8">
        {/* Financials at a Glance */}
        {metricCards.length > 0 && <MetricsGlance cards={metricCards} />}

        {/* Price snapshot */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent mb-3">
            Price &amp; Technicals
          </p>
          <PriceSnapshot
            symbol={co.ticker}
            cmp={co.cmp}
            dma50={co.raw.dma50}
            dma200={co.raw.dma200}
            high52w={high52w}
            low52w={low52w}
          />
        </div>

        {/* Peer comparison — collapsed by default */}
        {sector.companies.length > 1 && (
          <details className="group glass border-subtle rounded-2xl">
            <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none select-none">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent mb-0.5">Context</p>
                <p className="text-sm font-semibold text-chalk-50">
                  How does it compare to its sector?
                </p>
                <p className="text-xs text-chalk-300/50 mt-0.5">
                  {sector.name} · {sector.companies.length} companies
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-chalk-300 transition-transform group-open:rotate-180 shrink-0" />
            </summary>
            <div className="border-t border-[rgb(var(--chalk-100)_/_0.06)] px-5 py-5">
              <PeerComparisonTable
                companies={sector.companies}
                currentSlug={co.slug}
                sectorSlug={sector.slug}
              />
            </div>
          </details>
        )}

        {/* About company — collapsed by default */}
        {detail && (detail.about || detail.key_points) && (
          <details className="group glass border-subtle rounded-2xl">
            <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none select-none">
              <div>
                <p className="text-sm font-semibold text-chalk-50">About the company</p>
                {detail.about && (
                  <p className="text-xs text-chalk-300/50 mt-0.5 line-clamp-1 max-w-sm">
                    {detail.about.replace(/\[\d+\]/g, "").slice(0, 100)}…
                  </p>
                )}
              </div>
              <ChevronDown className="h-4 w-4 text-chalk-300 transition-transform group-open:rotate-180 shrink-0" />
            </summary>
            <div className="border-t border-[rgb(var(--chalk-100)_/_0.06)] px-5 py-5 grid gap-5 md:grid-cols-2">
              {detail.about && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-accent mb-2">About</h3>
                  <p className="text-sm text-chalk-300 leading-relaxed">{detail.about.replace(/\[\d+\]/g, "")}</p>
                </div>
              )}
              {detail.key_points && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-accent mb-2">Key Points</h3>
                  <p className="text-sm text-chalk-300 leading-relaxed whitespace-pre-line">
                    {detail.key_points.replace(/\[\d+\]/g, "").trim()}
                  </p>
                </div>
              )}
            </div>
          </details>
        )}
      </section>

      {/* ── LAYER 5: DEEP DIVE ───────────────────────────────────── */}
      <div className="mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent mb-1">Deep Dive</p>
        <h2 className="text-xl font-bold text-chalk-50 mb-1">Charts, tables & raw data</h2>
        <p className="text-xs text-chalk-300/50 mb-5">
          Switch tabs to explore financials, ratios, and factor-level scoring detail.
        </p>
      </div>
      <DeepDive
        chartData={chartData}
        companyName={co.name}
        ticker={co.ticker}
        peers={peers}
        tables={detail?.financial_tables}
        growthTables={detail?.growth_tables}
        ratiosMap={detail?.ratios}
        factorBreakdown={co.factor_breakdown}
        assumptions={co.assumptions}
        rawTotal={co.raw_total}
      />

      {/* Announcements — collapsed */}
      {hasAnnouncements && (
        <details className="group glass border-subtle rounded-2xl mb-10">
          <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none select-none">
            <div>
              <p className="text-sm font-semibold text-chalk-50">Announcements</p>
              <p className="text-xs text-chalk-300/50 mt-0.5">
                {detail!.announcements.important.length > 0 && `${detail!.announcements.important.length} important`}
                {detail!.announcements.important.length > 0 && detail!.announcements.recent.length > 0 && " · "}
                {detail!.announcements.recent.length > 0 && `${detail!.announcements.recent.length} recent`}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-chalk-300 transition-transform group-open:rotate-180 shrink-0" />
          </summary>
          <div className="border-t border-[rgb(var(--chalk-100)_/_0.06)] px-5 py-5">
            <div className="grid gap-6 md:grid-cols-2">
              {detail!.announcements.important.length > 0 && (
                <AnnouncementList announcements={detail!.announcements.important} heading="Important" />
              )}
              {detail!.announcements.recent.length > 0 && (
                <AnnouncementList announcements={detail!.announcements.recent} heading="Recent" />
              )}
            </div>
          </div>
        </details>
      )}
    </div>
  );
}
