"use client";

import { useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { Company } from "@/lib/types";

const PALETTE = [
  "#10B981",
  "#F59E0B",
  "#60A5FA",
  "#F472B6",
  "#A78BFA",
  "#34D399",
  "#FCD34D",
  "#FB7185",
];

export function RadarCompare({ companies }: { companies: Company[] }) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(companies.map((c) => [c.slug, true])),
  );

  const categories = companies[0]?.categories.map((c) => c.name) ?? [];
  const data = categories.map((name) => {
    const row: Record<string, number | string> = { category: name };
    companies.forEach((co) => {
      const cat = co.categories.find((c) => c.name === name);
      const pct = cat ? (cat.earned / cat.max) * 100 : 0;
      row[co.ticker] = Math.max(0, Math.round(pct));
    });
    return row;
  });

  return (
    <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-semibold text-chalk-50">Category Profile (% of max)</h3>
        <p className="text-xs text-chalk-300/70">click a name to toggle</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {companies.map((co, i) => (
          <button
            key={co.slug}
            onClick={() =>
              setEnabled((e) => ({ ...e, [co.slug]: !e[co.slug] }))
            }
            className="flex items-center gap-2 rounded-md border border-ink-700/60 bg-ink-900/60 px-2.5 py-1 text-xs hover:bg-ink-800/60 transition-colors"
            style={{
              opacity: enabled[co.slug] ? 1 : 0.4,
            }}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: PALETTE[i % PALETTE.length] }}
            />
            <span>{co.ticker}</span>
          </button>
        ))}
      </div>
      <div className="h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="78%">
            <PolarGrid stroke="#2A3447" />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fill: "#9FB0C8", fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: "#475569", fontSize: 10 }}
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
                  fillOpacity={0.12}
                  strokeWidth={2}
                />
              ) : null,
            )}
            <Tooltip
              contentStyle={{
                background: "#0B1220",
                border: "1px solid #2A3447",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#EEF2F7" }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "#9FB0C8" }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
