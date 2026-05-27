"use client";

import { useState } from "react";
import clsx from "clsx";
import { Info, Plus, Minus } from "lucide-react";
import type { CategoryScore } from "@/lib/types";
import { pointsColor } from "@/lib/format";

// Category bars use classic green / amber / red — easier to read at a glance
function categoryBarColor(pct: number): string {
  if (pct >= 70) return "#10B981";   // green
  if (pct >= 40) return "#F59E0B";   // amber
  return "#F87171";                  // red
}

function categoryTextColor(pct: number): string {
  if (pct >= 70) return "text-emerald-400";
  if (pct >= 40) return "text-warn";
  return "text-bad";
}

const CATEGORY_RATIONALE: Record<string, string> = {
  "Quality of Business":
    "ROCE, ROE, operating margins and capital efficiency — are the economics structurally good?",
  Valuation:
    "How cheap or expensive the stock is on multiple lenses: P/E, P/B, PEG, intrinsic value gap and dividend yield.",
  Growth:
    "Revenue and profit CAGR over 10/5/3 years plus whether recent momentum is accelerating.",
  "Quarterly Momentum":
    "Most recent quarter versus year-ago and prior quarter — is the trend fresh and strengthening?",
  "Balance Sheet":
    "Leverage, debt trajectory over 5–10 years, pledge risk and short-term liquidity.",
  "Cash Flow":
    "How much reported profit converts to cash; FCF consistency and working capital discipline.",
  Shareholding:
    "Promoter, FII and DII confidence over 8 quarters; pledge risk and institutional conviction.",
  Dividend:
    "Yield, payout consistency and payout ratio sustainability.",
  "Operational Efficiency":
    "Working capital discipline — debtor days, inventory turnover, cash conversion cycle.",
  "Price & Technical":
    "Two-signal price regime: DMA stack (CMP vs 50/200 DMA) + 52-week position.",
  "Peer Composite":
    "Company's percentile rank among sector peers across P/E, ROCE, OPM, growth and leverage.",
  "Size & Liquidity":
    "Market-cap tier investability adjustment — large caps get a small premium for liquidity.",
};

function Tooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <span
      className="relative inline-flex items-center ml-1.5 align-middle"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onClick={(e) => {
        e.stopPropagation();
        setVisible((v) => !v);
      }}
    >
      <span
        role="img"
        aria-label="Factor methodology"
        tabIndex={0}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="text-chalk-300/25 hover:text-accent/60 transition-colors focus:outline-none cursor-help"
      >
        <Info className="h-3 w-3" />
      </span>
      {visible && (
        <span
          role="tooltip"
          className="
            absolute left-5 top-0 z-50 w-64 rounded-xl
            glass border-subtle shadow-[0_20px_60px_rgba(0,0,0,0.5)]
            px-3.5 py-2.5 text-xs text-chalk-200 leading-relaxed
            pointer-events-none
          "
        >
          {text}
        </span>
      )}
    </span>
  );
}

export function CategoryCard({ category }: { category: CategoryScore }) {
  const [open, setOpen] = useState(false);
  const pct       = (category.earned / category.max) * 100;
  const barColor  = categoryBarColor(pct);
  const earnedColor = categoryTextColor(pct);

  return (
    <div
      className={clsx(
        "glass border-subtle rounded-2xl overflow-hidden transition-all duration-200",
        open && "border-[rgba(0,210,255,0.15)]",
      )}
    >
      {/* ── Collapsed header ─────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 hover:bg-[rgba(0,210,255,0.03)] transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          {/* Name + score */}
          <div className="flex items-baseline justify-between gap-4 mb-1.5">
            <h3 className="font-semibold text-[15px] text-chalk-50 truncate flex items-center gap-1.5">
              <span className="truncate">{category.name}</span>
              {CATEGORY_RATIONALE[category.name] && (
                <Tooltip text={CATEGORY_RATIONALE[category.name]} />
              )}
            </h3>
            <span className="num text-sm text-chalk-300/40 shrink-0">
              <span className={clsx("font-bold", earnedColor)}>
                {typeof category.earned === "number" ? category.earned.toFixed(1) : category.earned}
              </span>
              {" "}<span className="text-chalk-300/25">/ {category.max}</span>
            </span>
          </div>

          {/* Rationale */}
          <p className="text-[12px] text-chalk-300/40 truncate leading-snug mb-3">
            {CATEGORY_RATIONALE[category.name] ?? ""}
          </p>

          {/* Progress bar — green / amber / red */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-700/50">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: barColor }}
            />
          </div>
        </div>

        {/* Toggle icon */}
        <span className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-ink-700/40 text-chalk-300/40 hover:bg-ink-700/60 hover:text-chalk-50 transition-all">
          {open ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        </span>
      </button>

      {/* ── Expanded items ────────────────────────────── */}
      {open && (
        <div className="border-t border-[rgba(255,255,255,0.05)] bg-[rgba(0,210,255,0.02)] px-6 py-2">
          <ul>
            {category.items.map((item, i) => (
              <li
                key={i}
                className="flex items-start justify-between gap-4 py-3 border-b border-[rgba(255,255,255,0.04)] last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <p className="text-[13px] font-medium text-chalk-100">{item.label}</p>
                    {item.tooltip && <Tooltip text={item.tooltip} />}
                  </div>
                  <p className="num text-[11px] text-chalk-300/40 mt-0.5 leading-snug">{item.detail}</p>
                </div>
                <span
                  className={clsx(
                    "num text-sm font-bold shrink-0 mt-0.5",
                    pointsColor(item.points),
                  )}
                >
                  {item.points > 0 ? "+" : ""}
                  {typeof item.points === "number" ? item.points.toFixed(1) : item.points}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
