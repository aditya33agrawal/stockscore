"use client";

import { useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { Company } from "@/lib/types";

// Obsidian palette - cyan primary, violet secondary, then complementary tones
const PALETTE = [
  "#6D8196",  // cyan
  "#7C3AED",  // violet
  "#3F7A52",  // emerald
  "#B8862B",  // amber
  "#F472B6",  // pink
  "#8499AE",  // cyan-soft
  "#9B6BF5",  // violet-soft
  "#34D399",  // green-soft
];

export function RadarCompare({ companies: rawCompanies }: { companies: Company[] }) {
  // Order by final score (top scorer first) so the toggle list and color
  // assignment both reflect ranking within the sector.
  const companies = [...rawCompanies].sort((a, b) => b.final_score - a.final_score);

  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(companies.map((c) => [c.slug, true])),
  );

  const scoreByTicker = new Map(companies.map((c) => [c.ticker, c.final_score]));

  const categories = companies[0]?.categories.map((c) => c.name) ?? [];
  // Short labels avoid overlap with chart spokes on small containers
  const SHORT: Record<string, string> = {
    "Quality of Business": "Quality",
    "Operational Efficiency": "Op. Eff.",
    "Quarterly Momentum": "Qtr. Mom.",
    "Balance Sheet": "Balance",
    "Price & Technical": "Technical",
    "Peer Composite": "Peers",
    "Size & Liquidity": "Size",
    "Cash Flow": "Cash",
  };
  const data = categories.map((name) => {
    const row: Record<string, number | string> = { category: SHORT[name] ?? name };
    companies.forEach((co) => {
      const cat = co.categories.find((c) => c.name === name);
      const pct = cat ? (cat.earned / cat.max) * 100 : 0;
      row[co.ticker] = Math.max(0, Math.round(pct));
    });
    return row;
  });

  return (
    <div className="glass border-subtle rounded-2xl p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="font-semibold text-chalk-50">Category Profile <span className="text-chalk-300/40 font-normal text-sm">% of max</span></h3>
        <p className="text-xs text-chalk-300/50">Click any company name to deselect it &amp; re-sort the list</p>
      </div>

      {/* Company toggle pills - selected first, deselected sink to the end.
          Color stays keyed to each company's original index so it never shifts. */}
      <div className="flex flex-wrap gap-2 mb-5">
        {companies
          .map((co, i) => ({ co, color: PALETTE[i % PALETTE.length], isOn: enabled[co.slug] }))
          .sort((a, b) => Number(b.isOn) - Number(a.isOn))
          .map(({ co, color, isOn }) => {
          return (
            <button
              key={co.slug}
              onClick={() => setEnabled((e) => ({ ...e, [co.slug]: !e[co.slug] }))}
              className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                borderColor: isOn ? `${color}40` : "rgb(var(--chalk-100)/0.06)",
                background:  isOn ? `${color}12` : "rgb(var(--chalk-100)/0.02)",
                color:       isOn ? color          : "rgb(var(--chalk-100)/0.3)",
                opacity:     isOn ? 1               : 0.6,
              }}
            >
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: isOn ? color : "rgb(var(--chalk-100)/0.2)" }} />
              {co.ticker}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="h-[520px] sm:h-[580px] w-full overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="80%" margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
            <PolarGrid stroke="rgba(120,120,120,0.2)" />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fill: "#84909C", fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: "#2E4060", fontSize: 10 }}
              tickCount={5}
            />
            {companies.map((co, i) =>
              enabled[co.slug] ? (
                <Radar
                  key={co.slug}
                  name={co.ticker}
                  dataKey={co.ticker}
                  stroke={PALETTE[i % PALETTE.length]}
                  fill={PALETTE[i % PALETTE.length]}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              ) : null,
            )}
            <Tooltip
              contentStyle={{
                background: "rgba(74,74,74,0.96)",
                border: "1px solid rgb(var(--chalk-100)/0.08)",
                borderRadius: 12,
                fontSize: 12,
                backdropFilter: "blur(20px)",
              }}
              labelStyle={{ color: "#FFFFE3", fontWeight: 600, marginBottom: 4 }}
              itemStyle={{ color: "#B8D0EC" }}
              formatter={(value: number, name: string) => {
                const score = scoreByTicker.get(name);
                const label = score != null ? `${name} · Final score ${score.toFixed(1)}` : name;
                return [`${value}% of max`, label];
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
