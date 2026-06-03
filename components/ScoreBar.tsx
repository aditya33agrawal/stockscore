"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import type { Company } from "@/lib/types";

export function ScoreBarChart({ companies }: { companies: Company[] }) {
  const data = [...companies]
    .sort((a, b) => b.final_score - a.final_score)
    .map((c) => ({
      ticker: c.ticker,
      score: c.final_score,
      name: c.name,
    }));

  return (
    <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-5">
      <h3 className="font-semibold text-chalk-50 mb-3">Final Scores</h3>
      <div className="h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 12, right: 12, bottom: 16, left: -16 }}
          >
            <CartesianGrid stroke="#1A2233" vertical={false} />
            <XAxis
              dataKey="ticker"
              tick={{ fill: "#9FB0C8", fontSize: 12 }}
              axisLine={{ stroke: "#2A3447" }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#9FB0C8", fontSize: 11 }}
              axisLine={{ stroke: "#2A3447" }}
            />
            <Tooltip
              contentStyle={{
                background: "#0B1220",
                border: "1px solid #2A3447",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#EEF2F7" }}
              formatter={(v: number) => [v.toFixed(1), "Score"]}
            />
            <Bar dataKey="score" radius={[6, 6, 0, 0]}>
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={
                    d.score >= 70
                      ? "#3F7A52"
                      : d.score >= 50
                        ? "#B8862B"
                        : "#B0524E"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
