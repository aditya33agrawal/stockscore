"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { Company } from "@/lib/types";
import { pointsColor, scoreColor, classificationStyle, classificationLabel } from "@/lib/format";

const CATEGORY_ORDER = [
  "Valuation",
  "Profitability",
  "Growth",
  "Quarterly Momentum",
  "Balance Sheet",
  "Cash Flow",
  "Shareholding",
  "Dividend",
  "Operational Efficiency",
  "Price & Technical",
];

const ABBREV: Record<string, string> = {
  Valuation:               "Val",
  Profitability:           "Prof",
  Growth:                  "Grw",
  "Quarterly Momentum":    "Qtr",
  "Balance Sheet":         "BS",
  "Cash Flow":             "CF",
  Shareholding:            "SH",
  Dividend:                "Div",
  "Operational Efficiency":"OpEff",
  "Price & Technical":     "Tech",
};

const COL_HINT: Record<string, string> = {
  rank:                    "Position in this sector by final score (1 = highest).",
  score:                   "Final score out of 100, after bonuses and penalties.",
  Valuation:               "P/E, P/B, PEG, intrinsic value gap and dividend yield.",
  Profitability:           "ROCE, ROE, operating margins and capital efficiency.",
  Growth:                  "Sales & profit CAGR (10/5/3yr) plus recent acceleration.",
  "Quarterly Momentum":    "Latest quarter vs year-ago and prior quarter.",
  "Balance Sheet":         "Leverage, debt trajectory, pledge risk, liquidity.",
  "Cash Flow":             "CFO/PAT conversion, FCF consistency, WC discipline.",
  Shareholding:            "Promoter, FII, DII conviction over 8 quarters.",
  Dividend:                "Yield, payout ratio sustainability and consistency.",
  "Operational Efficiency":"Debtor days, inventory turnover, cash conversion cycle.",
  "Price & Technical":     "DMA stack (50/200) + 52-week price position.",
};

function SortIcon({ active, dir }: { active: boolean; dir: 1 | -1 }) {
  if (!active) return <ChevronDown className="h-3 w-3 opacity-25" />;
  return dir === 1
    ? <ChevronUp   className="h-3 w-3 text-accent" />
    : <ChevronDown className="h-3 w-3 text-accent" />;
}

export function Leaderboard({
  sectorSlug,
  companies,
}: {
  sectorSlug: string;
  companies: Company[];
}) {
  const [sortKey, setSortKey] = useState<string>("rank");
  const [dir, setDir]         = useState<1 | -1>(1);

  const sorted = useMemo(() => {
    const arr = [...companies];
    arr.sort((a, b) => {
      let av: number, bv: number;
      if (sortKey === "rank") {
        av = a.rank; bv = b.rank;
      } else if (sortKey === "score") {
        av = a.final_score; bv = b.final_score;
      } else {
        av = a.categories.find((c) => c.name === sortKey)?.earned ?? 0;
        bv = b.categories.find((c) => c.name === sortKey)?.earned ?? 0;
      }
      return (av - bv) * dir;
    });
    return arr;
  }, [companies, sortKey, dir]);

  const toggle = (key: string) => {
    if (sortKey === key) setDir(dir === 1 ? -1 : 1);
    else { setSortKey(key); setDir(key === "score" || key !== "rank" ? -1 : 1); }
  };

  const Th = ({
    k, children, right = false, title,
  }: {
    k: string; children: React.ReactNode; right?: boolean; title?: string;
  }) => (
    <th
      onClick={() => toggle(k)}
      title={title}
      className={clsx(
        "cursor-pointer select-none px-4 py-3 transition-colors",
        "text-[10px] font-semibold uppercase tracking-[0.1em]",
        right ? "text-right" : "text-left",
        sortKey === k ? "text-accent" : "text-chalk-300/35 hover:text-chalk-300/70",
      )}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <SortIcon active={sortKey === k} dir={dir} />
      </span>
    </th>
  );

  return (
    <div className="glass border-subtle rounded-2xl overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">

          {/* Header */}
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.05)] bg-[rgba(0,210,255,0.03)]">
              <Th k="rank" title={COL_HINT.rank}>#</Th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-chalk-300/35" title="Company name and ticker. Click a row to see the full +/− breakdown.">
                Company
              </th>
              <Th k="score" right title={COL_HINT.score}>Score</Th>
              {CATEGORY_ORDER.map((c) => (
                <Th key={c} k={c} right title={`${c} — ${COL_HINT[c] ?? ""}`}>{ABBREV[c]}</Th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-[rgba(255,255,255,0.03)]">
            {sorted.map((co) => {
              const gradient =
                co.final_score >= 70
                  ? "linear-gradient(90deg, #00D2FF, #7C3AED)"
                  : co.final_score >= 50
                  ? "linear-gradient(90deg, #F59E0B, #FBBF24)"
                  : "#F87171";

              return (
                <tr key={co.slug} className="group hover:bg-[rgba(0,210,255,0.03)] transition-colors">
                  {/* Rank */}
                  <td className="px-4 py-3.5 num text-[13px] font-medium text-chalk-300/25 w-10">
                    {co.rank}
                  </td>

                  {/* Company */}
                  <td className="px-4 py-3.5">
                    <Link href={`/sector/${sectorSlug}/${co.slug}`} className="block">
                      <p className="font-semibold text-chalk-50 group-hover:text-accent transition-colors text-[14px]">
                        {co.name}
                      </p>
                      <p className="num text-[11px] text-chalk-300/35 mt-0.5">
                        {co.ticker} · ₹{co.cmp.toLocaleString("en-IN")}
                      </p>
                    </Link>
                  </td>

                  {/* Score */}
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <div className="h-1 w-14 rounded-full overflow-hidden bg-ink-700/40">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${co.final_score}%`, background: gradient }}
                        />
                      </div>
                      <span className={clsx("num text-[13px] font-bold w-11 text-right", scoreColor(co.final_score))}>
                        {co.final_score.toFixed(1)}
                      </span>
                    </div>
                    {co.classification && (
                      <p className={clsx(
                        "text-[9px] font-semibold uppercase tracking-wider mt-1 text-right",
                        classificationStyle(co.classification).split(" ").find(c => c.startsWith("text-")) ?? "text-chalk-300/40",
                      )}>
                        {classificationLabel(co.classification)}
                      </p>
                    )}
                  </td>

                  {/* Category columns */}
                  {CATEGORY_ORDER.map((cname) => {
                    const cat     = co.categories.find((c) => c.name === cname);
                    const earned  = cat?.earned ?? 0;
                    const max     = cat?.max ?? 1;
                    const pct     = (earned / max) * 100;
                    return (
                      <td
                        key={cname}
                        className={clsx(
                          "px-2 py-3.5 num text-right text-[12px]",
                          pct >= 70 ? "text-accent" : pct >= 40 ? "text-chalk-200/70" : pct >= 0 ? "text-warn/70" : "text-bad/70",
                        )}
                      >
                        {typeof earned === "number" ? earned.toFixed(1) : earned}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
