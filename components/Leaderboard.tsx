"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { ArrowUpDown } from "lucide-react";
import type { Company } from "@/lib/types";
import { pointsColor, scoreColor } from "@/lib/format";

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
  Valuation: "Val",
  Profitability: "Prof",
  Growth: "Growth",
  "Quarterly Momentum": "Qtr",
  "Balance Sheet": "BS",
  "Cash Flow": "CF",
  Shareholding: "SH",
  Dividend: "Div",
  "Operational Efficiency": "OpEff",
  "Price & Technical": "Tech",
};

export function Leaderboard({
  sectorSlug,
  companies,
}: {
  sectorSlug: string;
  companies: Company[];
}) {
  const [sortKey, setSortKey] = useState<string>("rank");
  const [dir, setDir] = useState<1 | -1>(1);

  const sorted = useMemo(() => {
    const arr = [...companies];
    arr.sort((a, b) => {
      let av: number, bv: number;
      if (sortKey === "rank") {
        av = a.rank;
        bv = b.rank;
      } else if (sortKey === "score") {
        av = a.final_score;
        bv = b.final_score;
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
    else {
      setSortKey(key);
      setDir(key === "score" || key !== "rank" ? -1 : 1);
    }
  };

  return (
    <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead className="bg-ink-900 text-chalk-300">
            <tr className="text-xs uppercase tracking-wider">
              <th
                onClick={() => toggle("rank")}
                className="cursor-pointer px-4 py-3 text-left hover:text-chalk-50"
              >
                <span className="inline-flex items-center gap-1">
                  # <ArrowUpDown className="h-3 w-3" />
                </span>
              </th>
              <th className="px-4 py-3 text-left">Company</th>
              <th
                onClick={() => toggle("score")}
                className="cursor-pointer px-4 py-3 text-right hover:text-chalk-50"
              >
                <span className="inline-flex items-center gap-1">
                  Score <ArrowUpDown className="h-3 w-3" />
                </span>
              </th>
              {CATEGORY_ORDER.map((c) => (
                <th
                  key={c}
                  onClick={() => toggle(c)}
                  className="cursor-pointer px-2 py-3 text-right hover:text-chalk-50"
                  title={c}
                >
                  {ABBREV[c]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-700/40">
            {sorted.map((co) => (
              <tr
                key={co.slug}
                className="group hover:bg-ink-800/40 transition-colors"
              >
                <td className="px-4 py-3 num text-chalk-300">{co.rank}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/sector/${sectorSlug}/${co.slug}`}
                    className="flex flex-col group-hover:text-accent transition-colors"
                  >
                    <span className="font-medium text-chalk-50 group-hover:text-accent">
                      {co.name}
                    </span>
                    <span className="text-[11px] text-chalk-300/70 num">
                      {co.ticker} · ₹{co.cmp.toLocaleString("en-IN")}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="relative h-1.5 w-16 rounded-full bg-ink-800 overflow-hidden">
                      <div
                        className={clsx(
                          "h-full rounded-full",
                          co.final_score >= 70
                            ? "bg-accent"
                            : co.final_score >= 50
                              ? "bg-warn"
                              : "bg-bad",
                        )}
                        style={{ width: `${co.final_score}%` }}
                      />
                    </div>
                    <span
                      className={clsx(
                        "num font-semibold w-12 text-right",
                        scoreColor(co.final_score),
                      )}
                    >
                      {co.final_score.toFixed(1)}
                    </span>
                  </div>
                </td>
                {CATEGORY_ORDER.map((cname) => {
                  const cat = co.categories.find((c) => c.name === cname);
                  const earned = cat?.earned ?? 0;
                  const max = cat?.max ?? 1;
                  const pct = (earned / max) * 100;
                  return (
                    <td
                      key={cname}
                      className={clsx(
                        "px-2 py-3 num text-right",
                        pct >= 70
                          ? "text-accent"
                          : pct >= 40
                            ? "text-chalk-100"
                            : pct >= 0
                              ? "text-warn"
                              : "text-bad",
                      )}
                    >
                      {earned}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
