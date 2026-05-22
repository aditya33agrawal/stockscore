"use client";

import { useState } from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import type { CategoryScore } from "@/lib/types";
import { pointsColor } from "@/lib/format";

const CATEGORY_RATIONALE: Record<string, string> = {
  Valuation:
    "How cheap or expensive the stock is versus its earnings, book value, intrinsic estimate, and growth.",
  Profitability:
    "Quality of earnings — margins, returns on equity and capital, and whether they're trending up.",
  Growth:
    "Top-line and bottom-line growth over 5 years, plus whether TTM is accelerating or stalling.",
  "Quarterly Momentum":
    "Most recent quarter strength versus prior quarter and year-ago period.",
  "Balance Sheet":
    "Leverage, debt trend, liquidity, and reserves growth — the safety net of the business.",
  "Cash Flow":
    "How much reported profit converts to cash, free-cash-flow consistency, and CFO trajectory.",
  Shareholding:
    "Promoter, FII, and DII confidence over the last 4 quarters; pledged-share risk.",
  Dividend:
    "Yield, payout consistency over 5 years, and payout ratio sustainability.",
  "Operational Efficiency":
    "Working capital discipline — debtor days, inventory, cash conversion cycle.",
  "Price & Technical":
    "Price action context — drawdown from highs, distance from lows, price vs. fundamentals.",
};

export function CategoryCard({ category }: { category: CategoryScore }) {
  const [open, setOpen] = useState(false);
  const pct = (category.earned / category.max) * 100;
  const tone =
    pct >= 70 ? "accent" : pct >= 40 ? "warn" : "bad";

  return (
    <div className="rounded-xl border border-ink-700/60 bg-ink-900/60 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-ink-800/40 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="font-semibold text-chalk-50 truncate">
              {category.name}
            </h3>
            <span className="num text-sm text-chalk-300 shrink-0">
              <span
                className={clsx(
                  "font-semibold",
                  tone === "accent"
                    ? "text-accent"
                    : tone === "warn"
                      ? "text-warn"
                      : "text-bad",
                )}
              >
                {category.earned}
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
                tone === "accent"
                  ? "bg-accent"
                  : tone === "warn"
                    ? "bg-warn"
                    : "bg-bad",
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
              <li
                key={i}
                className="flex items-center justify-between gap-4 py-2.5 text-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-chalk-100">{item.label}</p>
                  <p className="text-xs text-chalk-300/70 num mt-0.5">
                    {item.detail}
                  </p>
                </div>
                <span
                  className={clsx(
                    "num font-semibold shrink-0",
                    pointsColor(item.points),
                  )}
                >
                  {item.points > 0 ? "+" : ""}
                  {item.points}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
