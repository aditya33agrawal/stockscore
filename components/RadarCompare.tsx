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

// Obsidian palette — cyan primary, violet secondary, then complementary tones
const PALETTE = [
  "#00D2FF",  // cyan
  "#7C3AED",  // violet
  "#10B981",  // emerald
  "#F59E0B",  // amber
  "#F472B6",  // pink
  "#38E8FF",  // cyan-soft
  "#9B6BF5",  // violet-soft
  "#34D399",  // green-soft
];

export function RadarCompare({ companies }: { companies: Company[] }) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(companies.map((c) => [c.slug, true])),
  );

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
        <p className="text-xs text-chalk-300/30">click name to toggle</p>
      </div>

      {/* Company toggle pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {companies.map((co, i) => {
          const color = PALETTE[i % PALETTE.length];
          const isOn  = enabled[co.slug];
          return (
            <button
              key={co.slug}
              onClick={() => setEnabled((e) => ({ ...e, [co.slug]: !e[co.slug] }))}
              className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                borderColor: isOn ? `${color}40` : "rgba(255,255,255,0.06)",
                background:  isOn ? `${color}12` : "rgba(255,255,255,0.02)",
                color:       isOn ? color          : "rgba(255,255,255,0.3)",
                opacity:     isOn ? 1               : 0.6,
              }}
            >
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: isOn ? color : "rgba(255,255,255,0.2)" }} />
              {co.ticker}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="h-[420px] w-full overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="68%" margin={{ top: 16, right: 32, bottom: 16, left: 32 }}>
            <PolarGrid stroke="rgba(255,255,255,0.06)" />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fill: "#7090B0", fontSize: 10 }}
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
                background: "rgba(7,12,26,0.95)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                fontSize: 12,
                backdropFilter: "blur(20px)",
              }}
              labelStyle={{ color: "#E8F4FF", fontWeight: 600, marginBottom: 4 }}
              itemStyle={{ color: "#B8D0EC" }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
