"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Plus, Minus } from "lucide-react";
import type { CategoryScore } from "@/lib/types";
import { pointsColor } from "@/lib/format";
import { Tooltip as InfoTooltip } from "@/components/Tooltip";
import { TOOLTIPS } from "@/lib/tooltips";

const CATEGORY_TOOLTIP_KEY: Record<string, keyof typeof TOOLTIPS> = {
  "Quality of Business": "category_profitability",
  Valuation: "category_valuation",
  Growth: "category_growth",
  "Quarterly Momentum": "category_quarterly",
  "Balance Sheet": "category_balance_sheet",
  "Cash Flow": "category_cash_flow",
  Shareholding: "category_shareholding",
  Dividend: "category_dividend",
  "Operational Efficiency": "category_operational",
  "Price & Technical": "category_technical",
};

// Category bars use Ink Wash green / amber / red - easier to read at a glance
function categoryBarColor(pct: number): string {
  if (pct >= 70) return "#3F7A52";   // good - green
  if (pct >= 40) return "#B8862B";   // warn - amber
  return "#B0524E";                  // bad - red
}

function categoryTextColor(pct: number): string {
  if (pct >= 70) return "text-good";
  if (pct >= 40) return "text-warn";
  return "text-bad";
}

const CATEGORY_LEARN_MAP: Record<string, string> = {
  "Quality of Business": "/learn?category=profitability",
  "Valuation":           "/learn?category=valuation",
  "Growth":              "/learn?category=growth",
  "Balance Sheet":       "/learn?category=balance-sheet",
  "Cash Flow":           "/learn?category=cash-flow",
  "Shareholding":        "/learn?category=shareholding",
  "Quarterly Momentum":  "/learn?category=quarterly",
};

const CATEGORY_RATIONALE: Record<string, string> = {
  "Quality of Business":
    "ROCE, ROE, operating margins and capital efficiency - are the economics structurally good?",
  Valuation:
    "How cheap or expensive the stock is on multiple lenses: P/E, P/B, PEG, intrinsic value gap and dividend yield.",
  Growth:
    "Revenue and profit CAGR over 10/5/3 years plus whether recent momentum is accelerating.",
  "Quarterly Momentum":
    "Most recent quarter versus year-ago and prior quarter - is the trend fresh and strengthening?",
  "Balance Sheet":
    "Leverage, debt trajectory over 5–10 years, pledge risk and short-term liquidity.",
  "Cash Flow":
    "How much reported profit converts to cash; FCF consistency and working capital discipline.",
  Shareholding:
    "Promoter, FII and DII confidence over 8 quarters; pledge risk and institutional conviction.",
  Dividend:
    "Yield, payout consistency and payout ratio sustainability.",
  "Operational Efficiency":
    "Working capital discipline - debtor days, inventory turnover, cash conversion cycle.",
  "Price & Technical":
    "Two-signal price regime: DMA stack (CMP vs 50/200 DMA) + 52-week position.",
  "Peer Composite":
    "Company's percentile rank among sector peers across P/E, ROCE, OPM, growth and leverage.",
  "Size & Liquidity":
    "Market-cap tier investability adjustment - large caps get a small premium for liquidity.",
};

function Tooltip({ text, title }: { text: string; title?: string }) {
  return (
    <span onClick={(e) => e.stopPropagation()} className="inline-flex">
      <InfoTooltip content={{ title, body: text }} triggerLabel="More info" />
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
        "glass border-subtle rounded-2xl transition-all duration-200",
        open && "border-[rgb(var(--accent)_/_0.15)]",
      )}
    >
      {/* ── Collapsed header ─────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 hover:bg-[rgb(var(--accent)_/_0.03)] transition-colors text-left rounded-2xl"
      >
        <div className="flex-1 min-w-0">
          {/* Name + score */}
          <div className="flex items-baseline justify-between gap-4 mb-1.5">
            <h3 className="font-semibold text-[15px] text-chalk-50 truncate flex items-center gap-1.5">
              {CATEGORY_LEARN_MAP[category.name] ? (
                <Link
                  href={CATEGORY_LEARN_MAP[category.name]}
                  className="truncate hover:text-accent transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {category.name}
                </Link>
              ) : (
                <span className="truncate">{category.name}</span>
              )}
              {(() => {
                const key = CATEGORY_TOOLTIP_KEY[category.name];
                const tip = key ? TOOLTIPS[key] : null;
                if (tip) return <Tooltip text={String(tip.body)} title={tip.title} />;
                if (CATEGORY_RATIONALE[category.name])
                  return <Tooltip text={CATEGORY_RATIONALE[category.name]} />;
                return null;
              })()}
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

          {/* Progress bar - green / amber / red */}
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
        <div className="border-t border-[rgb(var(--chalk-100)_/_0.05)] bg-[rgb(var(--accent)_/_0.02)] px-6 py-2 rounded-b-2xl">
          <ul>
            {category.items.map((item, i) => (
              <li
                key={i}
                className="flex items-start justify-between gap-4 py-3 border-b border-[rgb(var(--chalk-100)_/_0.04)] last:border-0"
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
