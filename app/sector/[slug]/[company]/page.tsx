import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  ChevronDown,
  Star,
} from "lucide-react";
import clsx from "clsx";
import { loadSector, pointsColor, loadCompanyDetail } from "@/lib/data";
import { extractChartData, parseFinancialCSV, toNum } from "@/lib/company-data";
import { ScoreBadge } from "@/components/ScoreBadge";
import { CategoryCard } from "@/components/CategoryCard";
import { FinancialCharts } from "@/components/FinancialCharts";
import { FinancialTable } from "@/components/FinancialTable";
import { MetricCard } from "@/components/MetricCard";
import { AnnouncementList } from "@/components/AnnouncementList";
import { PriceChart } from "@/components/PriceChart";
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
import { PeerComparisonTable } from "@/components/PeerComparisonTable";
import { PriceRuler } from "@/components/PriceRuler";
import { RadarCompare } from "@/components/RadarCompare";
import { CompanySideNav } from "@/components/CompanySideNav";
import { BookmarkButton } from "@/components/BookmarkButton";

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

const ITEM_LEARN_MAP: Record<string, string> = {
  "Current Ratio":          "/learn#current-ratio",
  "Promoter Holding Level": "/learn#promoter-holding",
  "Promoter Trend (8Q)":    "/learn#promoter-holding",
  "P/E vs Industry":        "/learn#pe",
  "Debt / Equity":          "/learn#de",
  "Return on Equity":       "/learn#roe",
  "ROCE Consistency":       "/learn#roce",
  "OPM vs Sector":          "/learn#opm",
  "Dividend Yield":         "/learn#dividend-yield",
  "CFO / PAT":              "/learn#cfo-pat",
  "Sales CAGR 5Y":          "/learn#sales-growth",
};

// Ordered groups for All Key Ratios
const RATIO_GROUPS: { label: string; keys: string[] }[] = [
  {
    label: "Valuation",
    keys: [
      "Current Price",
      "Market Cap",
      "High / Low",
      "Stock P/E",
      "Industry PE",
      "PEG Ratio",
      "Price to book value",
      "Book Value",
      "Intrinsic Value",
      "Face Value",
    ],
  },
  {
    label: "Returns & Margins",
    keys: [
      "ROE",
      "ROCE",
      "ROCE 5Yr",
      "Dividend Yield",
      "Profit Var 10Yrs",
      "Sales Var 10Yrs",
    ],
  },
  {
    label: "Leverage & Debt",
    keys: [
      "Debt to equity",
      "Pledged percentage",
      "Debt",
      "Secured loan",
      "Unsecured loan",
      "Debt 5Years back",
      "Debt 10Years back",
    ],
  },
  {
    label: "Technicals",
    keys: [
      "DMA 50",
      "DMA 200",
      "Down from 52w high",
      "Up from 52w low",
    ],
  },
];

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

    // Fall back to raw ratios table when the scored snapshot is missing current_ratio
    const currentRatioVal: number | null = co.raw.current_ratio != null
      ? co.raw.current_ratio
      : (() => {
          // 1) Top-ratios strip — case-insensitive lookup ("Current Ratio" / "Current ratio")
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
          // 2) Ratios financial table — row "Current Ratio" (latest non-empty cell)
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

    // Cash Conversion Quality
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

    // Promoter Holding — use last non-null value so a missing most-recent quarter doesn't show N/A
    const nonNullPromoter = chartData.shPromoter.filter((v): v is number => v != null);
    let latestPromoter: number | null = nonNullPromoter.length > 0 ? nonNullPromoter[nonNullPromoter.length - 1] : null;
    // If no Promoter row exists but other shareholding rows do (FII/DII/Public), promoters = 0 (e.g. ITC, HDFC Bank widely-held)
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

  // Compute trend info
  const trendInfo = evaluateTrend(co.cmp, co.raw);

  // Parse 52-week high/low from ratios
  function parse52wHL(value: string | undefined): { high: number | null; low: number | null } {
    if (!value) return { high: null, low: null };
    const parts = value.split("/").map((p) => parseFloat(p.replace(/[₹,\s]/g, "")));
    return {
      high: parts[0] > 0 ? parts[0] : null,
      low: parts[1] > 0 ? parts[1] : null,
    };
  }
  const { high: high52w, low: low52w } = parse52wHL(detail?.ratios["High / Low"]);

  // Build ordered ratios
  const ratiosMap = detail?.ratios ?? {};
  const allKeys = Object.keys(ratiosMap);
  const usedKeys = new Set<string>();

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 scroll-smooth">
      <CompanySideNav />
      <Link
        href={`/sector/${sector.slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-chalk-300/40 hover:text-accent transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> {sector.name}
      </Link>

      {/* HEADER */}
      <header id="overview" className="glass border-subtle rounded-2xl p-6 sm:p-8 mb-8 scroll-mt-24">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent mb-2">
              Rank {co.rank} of {sector.companies.length} in {sector.name}
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-chalk-50 mb-3">
              {co.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-chalk-300/50 num">
              <span className="font-semibold text-chalk-100">{co.ticker}</span>
              <span>CMP ₹{co.cmp.toLocaleString("en-IN")}</span>
              {co.raw.pe && <span>P/E {co.raw.pe.toFixed(1)}</span>}
              {co.raw.industry_pe && (
                <span>Industry P/E {co.raw.industry_pe.toFixed(1)}</span>
              )}
              {co.classification && (
                <span className="rounded-md border border-accent/20 bg-accent/8 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-accent">
                  {co.classification}
                </span>
              )}
              {/* Trend Tag */}
              <span
                title={trendInfo.sentence}
                className={clsx(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider cursor-help",
                  trendInfo.trend === "up" && trendInfo.strength === "strong" && "border-accent bg-accent/20 text-accent",
                  trendInfo.trend === "up" && trendInfo.strength !== "strong" && "border-accent/40 bg-accent/10 text-accent",
                  trendInfo.trend === "down" && trendInfo.strength === "strong" && "border-bad bg-bad/20 text-bad",
                  trendInfo.trend === "down" && trendInfo.strength !== "strong" && "border-bad/40 bg-bad/10 text-bad",
                  trendInfo.trend === "sideways" && "border-warn/40 bg-warn/10 text-warn"
                )}
              >
                {trendInfo.label}
              </span>
              {/* Peer percentile */}
              {co.peer_percentile != null && (
                <span
                  title={`Scores at the ${Math.round(co.peer_percentile * 100)}th percentile among sector peers across P/E, ROCE, OPM, growth and leverage`}
                  className="inline-flex items-center gap-1 rounded-md border border-ink-600/60 bg-ink-800/60 px-2 py-0.5 text-xs text-chalk-300 cursor-help"
                >
                  Peer rank {Math.round(co.peer_percentile * 100)}th %ile
                </span>
              )}
            </div>
          </div>
          <ScoreBadge score={co.final_score} classification={co.classification} raw={co.raw_total} size="lg" />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href={`https://www.screener.in/company/${co.ticker}/consolidated/`}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(255,255,255,0.08)] px-3 py-1.5 text-xs font-medium text-chalk-300/50 hover:border-[rgba(255,255,255,0.15)] hover:text-chalk-50 transition-all"
          >
            View on Screener <ExternalLink className="h-3 w-3" />
          </a>
          <BookmarkButton
            sectorSlug={sector.slug}
            companySlug={co.slug}
            companyTicker={co.ticker}
            companyName={co.name}
          />
        </div>
      </header>

      {/* LEARN NUDGE — quiet one-liner above score breakdown */}
      <p className="mb-5 text-xs text-chalk-300/35">
        Not sure what Balance Sheet or Shareholding mean?{" "}
        <Link href="/learn" className="hover:text-accent transition-colors underline underline-offset-2">
          Learn the metrics →
        </Link>
      </p>

      {/* CATEGORY BREAKDOWN */}
      <section id="breakdown" className="mb-10 scroll-mt-24">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent mb-1">Score Breakdown</p>
            <h2 className="text-xl font-bold text-chalk-50 flex items-center gap-2">
              10 categories · every point explained
              <span className="group/why relative inline-flex items-center">
                <span
                  aria-label="Why these categories"
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-chalk-300/30 text-[10px] text-chalk-300/60 cursor-help"
                >i</span>
                <span className="pointer-events-none absolute left-6 top-0 z-50 w-72 rounded-xl glass border-subtle px-3.5 py-2.5 text-xs text-chalk-200 leading-relaxed opacity-0 group-hover/why:opacity-100 transition-opacity shadow-xl">
                  These 10 categories cover the questions a fundamental analyst actually asks: profitability, growth, leverage, cash quality, who owns the stock, and how it&apos;s priced. Each one is independently scored so you can see where the company is strong and where it isn&apos;t.
                </span>
              </span>
            </h2>
          </div>
          <Link
            href="/methodology"
            className="text-xs text-chalk-300/40 hover:text-accent transition-colors"
          >
            Methodology →
          </Link>
        </div>
        {/* Source / disclaimer */}
        <p className="mb-5 text-[12px] text-chalk-300/50 leading-relaxed">
          <span className="font-semibold text-chalk-300/80">Source:</span> based on my own research,
          parameters, and judgement — <span className="text-chalk-100">not investment advice.</span> Use it as one
          input alongside annual reports and your own due diligence.
        </p>
        {/* Radar chart — visual fingerprint of the company's score profile */}
        <div className="grid gap-3">
          {co.categories.map((cat) => (
            <CategoryCard key={cat.name} category={cat} />
          ))}
        </div>
        <div className="mb-5">
          <RadarCompare companies={[co]} />
        </div>
        <p className="mt-3 text-xs text-chalk-300/70">
          Click any category to expand the per-rule breakdown. Green rows added
          points; red rows deducted.
        </p>
      </section>

      {/* BONUSES */}
      {co.bonuses && co.bonuses.length > 0 && (
        <section id="bonuses" className="mb-6 scroll-mt-24">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-accent mb-3">
            Bonus points
          </h2>
          <ul className="glass rounded-2xl border border-accent/20 bg-accent/[0.04] divide-y divide-accent/[0.08]">
            {co.bonuses.map((b, i) => (
              <li key={i} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2">
                  <Star className="h-3.5 w-3.5 text-accent shrink-0" />
                  <div>
                    <p className="text-sm text-chalk-50">{b.label}</p>
                    <p className="text-xs text-chalk-300/80">{b.detail}</p>
                  </div>
                </div>
                <span className="num font-semibold text-accent">+{b.points}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* PENALTIES */}
      {co.penalties.length > 0 && (
        <section id="penalties" className="mb-10 scroll-mt-24">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-bad mb-3">
            Penalty deductions
          </h2>
          <ul className="glass rounded-2xl border border-bad/20 bg-bad/[0.04] divide-y divide-bad/[0.08]">
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
      <section id="strengths" className="mb-10 grid gap-4 md:grid-cols-2 scroll-mt-24">
        <div className="glass rounded-2xl border border-accent/15 bg-accent/[0.04] p-5">
          <div className="flex items-center gap-2 mb-3">
            <ThumbsUp className="h-4 w-4 text-accent" />
            <h3 className="font-semibold text-chalk-50">Key Strengths</h3>
          </div>
          <ul className="space-y-2">
            {co.strengths.map((s, i) => (
              <li key={i} className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-chalk-100">{s.label}</p>
                    {ITEM_LEARN_MAP[s.label] && (
                      <Link href={ITEM_LEARN_MAP[s.label]} className="text-[10px] text-chalk-300/30 hover:text-accent transition-colors">
                        Learn →
                      </Link>
                    )}
                  </div>
                  <p className="text-xs text-chalk-300/70">{s.category}</p>
                </div>
                <span className={clsx("num font-semibold shrink-0", pointsColor(s.points))}>
                  +{s.points}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="glass rounded-2xl border border-bad/15 bg-bad/[0.04] p-5">
          <div className="flex items-center gap-2 mb-3">
            <ThumbsDown className="h-4 w-4 text-bad" />
            <h3 className="font-semibold text-chalk-50">Key Risks</h3>
          </div>
          <ul className="space-y-2">
            {co.weaknesses.map((w, i) => (
              <li key={i} className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-chalk-100">{w.label}</p>
                    {ITEM_LEARN_MAP[w.label] && (
                      <Link href={ITEM_LEARN_MAP[w.label]} className="text-[10px] text-chalk-300/30 hover:text-accent transition-colors">
                        Learn →
                      </Link>
                    )}
                  </div>
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

      {/* FINANCIALS AT A GLANCE — replaces raw snapshot */}
      {metricCards.length > 0 && (
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
              Financials at a Glance
            </h2>
            <Link href="/learn" className="text-xs text-chalk-300 hover:text-accent">
              Learn what these mean →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {metricCards.map((card) => (
              <MetricCard key={card.title} {...card} />
            ))}
          </div>
        </section>
      )}

      {/* PEER COMPARISON */}
      {sector.companies.length > 1 && (
        <section id="peers" className="mb-10 scroll-mt-24">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
              How Does It Compare?
            </h2>
            <span className="text-xs text-chalk-300/50">{sector.name} · {sector.companies.length} companies</span>
          </div>
          <PeerComparisonTable
            companies={sector.companies}
            currentSlug={co.slug}
            sectorSlug={sector.slug}
          />
        </section>
      )}

      {/* COMPANY PROFILE */}
      {detail && (detail.about || detail.key_points) && (
        <section id="about-company" className="mb-10 grid gap-6 md:grid-cols-2 scroll-mt-24">
          {detail.about && (
            <div className="glass border-subtle rounded-2xl p-5">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">About</h3>
              <p className="text-sm text-chalk-300 leading-relaxed">{detail.about.replace(/\[\d+\]/g, "")}</p>
            </div>
          )}
          {detail.key_points && (
            <div className="glass border-subtle rounded-2xl p-5">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">Key Points</h3>
              <p className="text-sm text-chalk-300 leading-relaxed whitespace-pre-line">{detail.key_points.replace(/\[\d+\]/g, "").trim()}</p>
            </div>
          )}
        </section>
      )}

      {/* ALL KEY RATIOS — grouped */}
      {detail && Object.keys(detail.ratios).length > 0 && (
        <section id="ratios" className="mb-10 scroll-mt-24">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-accent mb-3">All Key Ratios</h2>
          <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-5 space-y-6">
            {RATIO_GROUPS.map((group) => {
              const groupEntries = group.keys
                .filter((k) => ratiosMap[k] != null)
                .map((k) => { usedKeys.add(k); return [k, ratiosMap[k]] as [string, string]; });
              if (groupEntries.length === 0) return null;
              return (
                <div key={group.label}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-chalk-300/40 mb-3">{group.label}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-4">
                    {groupEntries.map(([k, v]) => (
                      <div key={k}>
                        <p className="text-xs text-chalk-300/70 leading-tight">{k}</p>
                        <p className="num text-sm font-semibold text-chalk-100 mt-0.5">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {/* Tail: any keys not in any group */}
            {(() => {
              const remaining = allKeys.filter((k) => !usedKeys.has(k));
              if (remaining.length === 0) return null;
              return (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-chalk-300/40 mb-3">Other</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-4">
                    {remaining.map((k) => (
                      <div key={k}>
                        <p className="text-xs text-chalk-300/70 leading-tight">{k}</p>
                        <p className="num text-sm font-semibold text-chalk-100 mt-0.5">{ratiosMap[k]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* GROWTH & CAGR */}
      {detail && (
        <section id="growth" className="mb-10 scroll-mt-24">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-accent mb-3">Growth & CAGR</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(detail.growth_tables).map(([title, rows]) => (
              <div key={title} className="glass border-subtle rounded-2xl p-4">
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
        </section>
      )}

      {/* PRICE CHART (technicals) */}
      <section id="technicals" className="mb-10 scroll-mt-24">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-accent mb-4">Price & Technicals</h2>
        <PriceChart symbol={co.ticker} />
      </section>

      {/* PRICE RULER — 52w range + DMA positions */}
      {(co.raw.dma50 || co.raw.dma200 || high52w || low52w) && (
        <section className="mb-8">
          <PriceRuler
            cmp={co.cmp}
            dma50={co.raw.dma50}
            dma200={co.raw.dma200}
            high52w={high52w}
            low52w={low52w}
          />
        </section>
      )}

      {/* FINANCIAL CHARTS */}
      {chartData && (
        <section id="charts" className="mb-10 scroll-mt-24">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-accent mb-4">Financial Charts</h2>
          <FinancialCharts primaryData={chartData} primaryName={co.name} peers={peers} />
        </section>
      )}

      {/* FACTOR BREAKDOWN — v2 detail tab */}
      {co.factor_breakdown && co.factor_breakdown.length > 0 && (
        <section className="mb-10">
          <details className="group glass border-subtle rounded-2xl">
            <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer list-none select-none">
              <div>
                <span className="text-sm font-semibold text-chalk-100">Factor Breakdown (v2)</span>
                <span className="ml-2 text-xs text-chalk-300/60">{co.factor_breakdown.length} factors · raw score {co.raw_total.toFixed(1)}/100</span>
              </div>
              <ChevronDown className="h-4 w-4 text-chalk-300 transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-ink-700/40 overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-chalk-300/50 uppercase tracking-wider">
                  <tr className="border-b border-ink-700/40">
                    <th className="text-left px-4 py-2">Factor</th>
                    <th className="text-left px-4 py-2 hidden sm:table-cell">Category</th>
                    <th className="text-right px-4 py-2">Score 0–1</th>
                    <th className="text-right px-4 py-2">Wt</th>
                    <th className="text-right px-4 py-2">Pts</th>
                    <th className="text-left px-4 py-2 hidden md:table-cell">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-700/30">
                  {co.factor_breakdown.map((row, i) => (
                    <tr key={i} className="hover:bg-ink-800/20">
                      <td className="px-4 py-2">
                        <p className="text-chalk-100">{row.factor}</p>
                        {row.notes && (
                          <p className="text-chalk-300/50 mt-0.5 leading-tight max-w-xs hidden lg:block">{row.notes}</p>
                        )}
                      </td>
                      <td className="px-4 py-2 text-chalk-300/70 hidden sm:table-cell">{row.category}</td>
                      <td className="px-4 py-2 text-right num">
                        <span className={clsx(
                          row.score_01 >= 0.7 ? "text-accent" : row.score_01 >= 0.4 ? "text-warn" : "text-bad"
                        )}>
                          {row.score_01.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right num text-chalk-300">{row.weight}</td>
                      <td className={clsx(
                        "px-4 py-2 text-right num font-semibold",
                        row.points > row.weight * 0.7 ? "text-accent" : row.points > row.weight * 0.35 ? "text-warn" : "text-bad"
                      )}>
                        {row.points.toFixed(1)}
                      </td>
                      <td className="px-4 py-2 hidden md:table-cell">
                        <span className={clsx(
                          "rounded px-1.5 py-0.5 text-xs",
                          row.source === "absolute" && "bg-ink-800 text-chalk-300/70",
                          row.source === "relative" && "bg-accent/10 text-accent/70",
                          row.source === "trend"    && "bg-warn/10 text-warn/70",
                        )}>
                          {row.source}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {co.assumptions && co.assumptions.length > 0 && (
              <div className="border-t border-ink-700/40 px-5 py-3">
                <p className="text-xs font-semibold text-chalk-300/50 mb-2 uppercase tracking-wider">Assumptions &amp; fallbacks</p>
                <ul className="space-y-1">
                  {co.assumptions.map((a, i) => (
                    <li key={i} className="text-xs text-chalk-300/60">· {a}</li>
                  ))}
                </ul>
              </div>
            )}
          </details>
        </section>
      )}

      {/* FINANCIAL TABLES */}
      {detail && (
        <section id="tables" className="mb-10 scroll-mt-24">
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
              <details key={title} className="group glass border-subtle rounded-2xl">
                <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer list-none select-none">
                  <span className="text-sm font-medium text-chalk-100">{title}</span>
                  <ChevronDown className="h-4 w-4 text-chalk-300 transition-transform group-open:rotate-180" />
                </summary>
                <div className="border-t border-ink-700/40">
                  <FinancialTable csv={csv} title={title} />
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* ANNOUNCEMENTS — compressed to 1 each with "View all" */}
      {detail && (detail.announcements.important.length > 0 || detail.announcements.recent.length > 0) && (
        <section id="announcements" className="mb-10 scroll-mt-24">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-accent mb-3">Announcements</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {detail.announcements.important.length > 0 && (
              <AnnouncementList
                announcements={detail.announcements.important}
                heading="Important"
              />
            )}
            {detail.announcements.recent.length > 0 && (
              <AnnouncementList
                announcements={detail.announcements.recent}
                heading="Recent"
              />
            )}
          </div>
        </section>
      )}
    </div>
  );
}
