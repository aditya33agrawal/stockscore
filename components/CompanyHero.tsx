import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import clsx from "clsx";
import { ScoreBadge } from "@/components/ScoreBadge";
import { BookmarkButton } from "@/components/BookmarkButton";
import { Tooltip } from "@/components/Tooltip";
import type { Company, SectorData } from "@/lib/types";
import type { TrendResult } from "@/lib/evaluators";

interface Props {
  co: Company;
  sector: SectorData;
  trendInfo: TrendResult;
  refreshedAt?: string;
}

function trendChipStyle(trend: string, strength: string): string {
  if (trend === "up" && strength === "strong")
    return "border-accent bg-accent/20 text-accent";
  if (trend === "up")
    return "border-accent/40 bg-accent/10 text-accent";
  if (trend === "down" && strength === "strong")
    return "border-bad bg-bad/20 text-bad";
  if (trend === "down")
    return "border-bad/40 bg-bad/10 text-bad";
  return "border-warn/40 bg-warn/10 text-warn";
}

function buildTldr(co: Company): string {
  const top = co.strengths[0];
  const risk = co.weaknesses[0];
  if (top && risk)
    return `${top.label} is a key strength; watch ${risk.label.toLowerCase()}.`;
  if (top) return `Key strength: ${top.label}.`;
  if (risk) return `Key risk to watch: ${risk.label}.`;
  return "";
}

function formatRefreshed(at: string): string {
  const diff = Math.floor((Date.now() - new Date(at).getTime()) / 86400000);
  if (diff === 0) return "today";
  if (diff === 1) return "1 day ago";
  return `${diff} days ago`;
}

export function CompanyHero({ co, sector, trendInfo, refreshedAt }: Props) {
  const tldr = buildTldr(co);

  return (
    <header id="overview" className="glass border-subtle rounded-2xl p-6 sm:p-8 mb-8 scroll-mt-24">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-chalk-300/40 mb-5 flex-wrap">
        <Link href="/" className="hover:text-accent transition-colors">Home</Link>
        <span>/</span>
        <Link href={`/sector/${sector.slug}`} className="hover:text-accent transition-colors">{sector.name}</Link>
        <span>/</span>
        <span className="text-chalk-300/70 truncate max-w-[160px] sm:max-w-none">{co.name}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-6">
        {/* Left: name + chips */}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent mb-1.5">
            Rank {co.rank} of {sector.companies.length} in {sector.name}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-chalk-50 mb-2">
            {co.name}
          </h1>

          {/* Secondary line */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-chalk-300/50 num mb-4">
            <span className="font-semibold text-chalk-100">{co.ticker}</span>
            <span>CMP ₹{co.cmp.toLocaleString("en-IN")}</span>
            {co.raw.pe && <span>P/E {co.raw.pe.toFixed(1)}</span>}
            {co.raw.industry_pe && <span>Ind P/E {co.raw.industry_pe.toFixed(1)}</span>}
          </div>

          {/* Contextual chips */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {/* Trend chip */}
            <Tooltip
              content={{
                title: trendInfo.label,
                body: trendInfo.sentence,
              }}
            >
              <span
                className={clsx(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider cursor-default",
                  trendChipStyle(trendInfo.trend, trendInfo.strength),
                )}
              >
                {trendInfo.label}
              </span>
            </Tooltip>

            {/* Peer percentile chip */}
            {co.peer_percentile != null && (
              <Tooltip
                content={{
                  body: `Scores at the ${Math.round(co.peer_percentile * 100)}th percentile among ${sector.name} peers on P/E, ROCE, OPM, growth, and leverage.`,
                }}
              >
                <span className="inline-flex items-center gap-1 rounded-md border border-ink-600/60 bg-ink-800/60 px-2 py-0.5 text-xs text-chalk-300 cursor-default">
                  Peer rank {Math.round(co.peer_percentile * 100)}th %ile
                </span>
              </Tooltip>
            )}
          </div>

          {/* TL;DR verdict sentence */}
          {tldr && (
            <p className="text-sm text-chalk-200 leading-relaxed italic mb-4 border-l-2 border-accent/30 pl-3">
              {tldr}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <a
              href={`https://www.screener.in/company/${co.ticker}/consolidated/`}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[rgb(var(--chalk-100)_/_0.08)] px-3 py-1.5 text-xs font-medium text-chalk-300/50 hover:border-[rgb(var(--chalk-100)_/_0.15)] hover:text-chalk-50 transition-all"
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
        </div>

        {/* Right: score badge */}
        <div className="shrink-0">
          <ScoreBadge score={co.final_score} classification={co.classification} raw={co.raw_total} size="lg" />
        </div>
      </div>

      {/* Last refreshed */}
      {refreshedAt && (
        <p className="mt-5 pt-4 border-t border-[rgb(var(--chalk-100)_/_0.06)] text-[11px] text-chalk-300/35">
          Data refreshed {formatRefreshed(refreshedAt)} · Source: Screener.in
        </p>
      )}
    </header>
  );
}
