"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Tooltip } from "@/components/Tooltip";
import { pointsColor } from "@/lib/format";
import type { CategoryScore } from "@/lib/types";

interface Props {
  categories: CategoryScore[];
}

function barColor(pct: number): string {
  if (pct >= 70) return "#3F7A52";
  if (pct >= 40) return "#B8862B";
  return "#B0524E";
}

function scoreTextColor(pct: number): string {
  if (pct >= 70) return "text-good";
  if (pct >= 40) return "text-warn";
  return "text-bad";
}

const CATEGORY_RATIONALE: Record<string, string> = {
  "Quality of Business": "ROCE, ROE, operating margins and capital efficiency - are the economics structurally good?",
  Valuation:             "How cheap or expensive the stock is on P/E, P/B, PEG, intrinsic value gap and dividend yield.",
  Growth:                "Revenue and profit CAGR over 10/5/3 years plus whether recent momentum is accelerating.",
  "Quarterly Momentum":  "Most recent quarter versus year-ago and prior quarter - is the trend fresh and strengthening?",
  "Balance Sheet":       "Leverage, debt trajectory over 5–10 years, pledge risk and short-term liquidity.",
  "Cash Flow":           "How much reported profit converts to cash; FCF consistency and working capital discipline.",
  Shareholding:          "Promoter, FII and DII confidence over 8 quarters; pledge risk and institutional conviction.",
  Dividend:              "Yield, payout consistency and payout ratio sustainability.",
  "Operational Efficiency": "Working capital discipline - debtor days, inventory turnover, cash conversion cycle.",
  "Price & Technical":   "Two-signal price regime: DMA stack (CMP vs 50/200 DMA) + 52-week position.",
  "Peer Composite":      "Company's percentile rank among sector peers across P/E, ROCE, OPM, growth and leverage.",
  "Size & Liquidity":    "Market-cap tier investability adjustment - large caps get a small premium for liquidity.",
};

const CATEGORY_LEARN_MAP: Record<string, string> = {
  "Quality of Business": "/learn?category=profitability",
  Valuation:             "/learn?category=valuation",
  Growth:                "/learn?category=growth",
  "Balance Sheet":       "/learn?category=balance-sheet",
  "Cash Flow":           "/learn?category=cash-flow",
  Shareholding:          "/learn?category=shareholding",
  "Quarterly Momentum":  "/learn?category=quarterly",
};

export function ScoreBars({ categories }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (name: string) =>
    setExpanded((prev) => (prev === name ? null : name));

  return (
    <div className="space-y-1">
      {categories.map((cat) => {
        const pct = (cat.earned / cat.max) * 100;
        const isOpen = expanded === cat.name;
        const rationale = CATEGORY_RATIONALE[cat.name];
        const learnHref = CATEGORY_LEARN_MAP[cat.name];

        // Split items into positives and negatives for the expanded narrative
        const positives = cat.items.filter((i) => i.points > 0).sort((a, b) => b.points - a.points);
        const negatives = cat.items.filter((i) => i.points < 0).sort((a, b) => a.points - b.points);
        const neutral   = cat.items.filter((i) => i.points === 0);

        return (
          // overflow-visible so the tooltip pop-up is not clipped by this container
          <div key={cat.name} className="glass border-subtle rounded-2xl overflow-visible">
            {/* ── ONE-LINE ROW ──────────────────────────────────── */}
            <button
              onClick={() => toggle(cat.name)}
              className="w-full flex items-center gap-2 px-4 py-3 hover:bg-[rgb(var(--accent)_/_0.03)] transition-colors text-left rounded-2xl"
              aria-expanded={isOpen}
            >
              {/* Tooltip info button - stop propagation so click doesn't toggle the row */}
              <span onClick={(e) => e.stopPropagation()} className="shrink-0 relative z-10">
                <Tooltip
                  align="start"
                  content={{
                    title: cat.name,
                    body: (
                      <span>
                        {rationale ?? "Scoring criteria for this category."}
                        {learnHref && (
                          <>
                            {" "}
                            <a
                              href={learnHref}
                              className="underline text-accent"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Learn →
                            </a>
                          </>
                        )}
                      </span>
                    ),
                  }}
                  triggerLabel={`About ${cat.name}`}
                />
              </span>

              {/* Name - whitespace-nowrap + overflow hidden so it never wraps */}
              <span className="shrink-0 w-[130px] sm:w-[180px] text-sm font-medium text-chalk-100 whitespace-nowrap overflow-hidden text-ellipsis">
                {cat.name}
              </span>

              {/* Bar */}
              <div className="flex-1 min-w-0">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-700/40">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(0, Math.min(100, pct))}%`,
                      background: barColor(pct),
                    }}
                  />
                </div>
              </div>

              {/* Score */}
              <span className="num text-sm shrink-0 w-16 text-right">
                <span className={clsx("font-bold", scoreTextColor(pct))}>
                  {cat.earned.toFixed(1)}
                </span>
                <span className="text-chalk-300/30 text-xs"> / {cat.max}</span>
              </span>

              {/* Chevron */}
              <svg
                className={clsx(
                  "shrink-0 h-4 w-4 text-chalk-300/40 transition-transform",
                  isOpen && "rotate-180",
                )}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* ── EXPANDED: what went right / wrong ─────────────── */}
            {isOpen && (
              <div className="border-t border-[rgb(var(--chalk-100)_/_0.05)] bg-[rgb(var(--accent)_/_0.02)] px-5 py-3 rounded-b-2xl overflow-hidden">
                {positives.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-good/60 mb-1.5">
                      What helped
                    </p>
                    <ul className="space-y-2">
                      {positives.map((item, i) => (
                        <li key={i} className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <p className="text-[13px] font-medium text-chalk-100">{item.label}</p>
                              {item.tooltip && (
                                <Tooltip content={{ body: item.tooltip }} triggerLabel={`About ${item.label}`} />
                              )}
                            </div>
                            <p className="num text-[11px] text-chalk-300/45 mt-0.5 leading-snug">{item.detail}</p>
                          </div>
                          <span className={clsx("num text-sm font-bold shrink-0 mt-0.5", pointsColor(item.points))}>
                            +{item.points.toFixed(1)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {negatives.length > 0 && (
                  <div className={clsx(positives.length > 0 && "mt-3 pt-3 border-t border-[rgb(var(--chalk-100)_/_0.05)]")}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-bad/60 mb-1.5">
                      What held it back
                    </p>
                    <ul className="space-y-2">
                      {negatives.map((item, i) => (
                        <li key={i} className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <p className="text-[13px] font-medium text-chalk-100">{item.label}</p>
                              {item.tooltip && (
                                <Tooltip content={{ body: item.tooltip }} triggerLabel={`About ${item.label}`} />
                              )}
                            </div>
                            <p className="num text-[11px] text-chalk-300/45 mt-0.5 leading-snug">{item.detail}</p>
                          </div>
                          <span className={clsx("num text-sm font-bold shrink-0 mt-0.5", pointsColor(item.points))}>
                            {item.points.toFixed(1)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {neutral.length > 0 && (
                  <div className={clsx((positives.length > 0 || negatives.length > 0) && "mt-3 pt-3 border-t border-[rgb(var(--chalk-100)_/_0.05)]")}>
                    <ul className="space-y-2">
                      {neutral.map((item, i) => (
                        <li key={i} className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <p className="text-[13px] font-medium text-chalk-300/70">{item.label}</p>
                              {item.tooltip && (
                                <Tooltip content={{ body: item.tooltip }} triggerLabel={`About ${item.label}`} />
                              )}
                            </div>
                            <p className="num text-[11px] text-chalk-300/45 mt-0.5 leading-snug">{item.detail}</p>
                          </div>
                          <span className="num text-sm font-semibold shrink-0 mt-0.5 text-chalk-300/40">
                            0
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {cat.items.length === 0 && (
                  <p className="text-xs text-chalk-300/40 italic">No breakdown available for this category.</p>
                )}
              </div>
            )}
          </div>
        );
      })}

      <p className="mt-3 text-xs text-chalk-300/45">
        Click any row to see what helped or hurt the score.{" "}
        <Link href="/methodology" className="hover:text-accent transition-colors underline underline-offset-2">
          How scoring works →
        </Link>
      </p>
    </div>
  );
}
