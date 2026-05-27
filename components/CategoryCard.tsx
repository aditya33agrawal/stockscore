"use client";

import { useState } from "react";
import clsx from "clsx";
import { ChevronDown, Info } from "lucide-react";
import type { CategoryScore } from "@/lib/types";
import { pointsColor } from "@/lib/format";

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
    <span className="relative inline-flex items-center ml-1 align-middle">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        aria-label="Factor methodology"
        className="text-chalk-300/40 hover:text-chalk-300 transition-colors focus:outline-none"
      >
        <Info className="h-3 w-3" />
      </button>
      {visible && (
        <span
          role="tooltip"
          className="
            absolute left-5 top-0 z-50 w-64 rounded-lg
            border border-ink-600/80 bg-ink-900 shadow-xl
            px-3 py-2 text-xs text-chalk-200 leading-relaxed
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
  const pct = (category.earned / category.max) * 100;
  const tone = pct >= 70 ? "accent" : pct >= 40 ? "warn" : "bad";

  return (
    <div className="rounded-xl border border-ink-700/60 bg-ink-900/60 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-ink-800/40 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="font-semibold text-chalk-50 truncate">{category.name}</h3>
            <span className="num text-sm text-chalk-300 shrink-0">
              <span
                className={clsx(
                  "font-semibold",
                  tone === "accent" ? "text-accent" : tone === "warn" ? "text-warn" : "text-bad",
                )}
              >
                {category.earned.toFixed !== undefined ? category.earned.toFixed(1) : category.earned}
              </span>{" "}
              / {category.max}
            </span>
          </div>
          <p className="text-xs text-chalk-300/80 mt-1 truncate">
            {CATEGORY_RATIONALE[category.name] ?? ""}
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-800">
            <div
              className={clsx(
                "h-full rounded-full transition-all",
                tone === "accent" ? "bg-accent" : tone === "warn" ? "bg-warn" : "bg-bad",
              )}
              style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
            />
          </div>
        </div>
        <ChevronDown
          className={clsx(
            "h-4 w-4 text-chalk-300 transition-transform shrink-0",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="border-t border-ink-700/60 bg-ink-950/40 px-5 py-3">
          <ul className="divide-y divide-ink-700/40">
            {category.items.map((item, i) => (
              <li key={i} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <p className="text-chalk-100">{item.label}</p>
                    {item.tooltip && <Tooltip text={item.tooltip} />}
                  </div>
                  <p className="text-xs text-chalk-300/70 num mt-0.5">{item.detail}</p>
                </div>
                <span
                  className={clsx("num font-semibold shrink-0", pointsColor(item.points))}
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
