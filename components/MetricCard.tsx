"use client";

import Link from "next/link";
import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { Tone } from "@/lib/evaluators";

export interface SparkRow {
  label: string;
  value: number | null;
  value2?: number | null;
}

export interface MetricCardProps {
  title: string;
  headline: string;
  learnHref?: string;
  badge?: { label: string; tone: Tone };
  sentence: string;
  sentenceTone: Tone;
  spark?: {
    rows: SparkRow[];
    type: "line" | "bar" | "dualBar" | "comparison";
    label?: string;
    label2?: string;
    formatter?: string;
  };
}

const GRID   = { strokeDasharray: "3 3", stroke: "rgba(120,120,120,0.18)" };
const AXIS_STYLE = { fill: "#84909C", fontSize: 10 };
const TOOLTIP_STYLE = {
  contentStyle: {
    background: "rgba(74,74,74,0.96)",
    border: "1px solid rgb(var(--chalk-100)/0.08)",
    borderRadius: 12,
    color: "#FFFFE3",
    fontSize: 11,
    backdropFilter: "blur(20px)",
  },
  labelStyle: { color: "#84909C" },
};

function fmt(v: number, f?: string): string {
  if (f === "pct")   return `${v.toFixed(1)}%`;
  if (f === "cr")    return v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`;
  if (f === "x")     return `${v.toFixed(1)}x`;
  if (f === "ratio") return v.toFixed(2);
  return `${v}`;
}

const toneClass: Record<Tone, string> = {
  excellent: "text-good",
  good:      "text-good",
  neutral:   "text-chalk-300/70",
  warn:      "text-warn",
  bad:       "text-bad",
};

const badgeBg: Record<Tone, string> = {
  excellent: "border-good/30 bg-good/10 text-good",
  good:      "border-good/20 bg-good/10 text-good",
  neutral:   "border-ink-700/60 bg-ink-800/40 text-chalk-300",
  warn:      "border-warn/20 bg-warn/10 text-warn",
  bad:       "border-bad/30 bg-bad/10 text-bad",
};

const shortLabel = (l: string) => {
  const m = l.match(/\d{4}/);
  return m ? `'${m[0].slice(2)}` : l.slice(0, 5);
};

export function MetricCard({ title, headline, learnHref, badge, sentence, sentenceTone, spark }: MetricCardProps) {
  const hasData = spark && spark.rows.some((r) => r.value !== null);

  return (
    <div className="glass border-subtle rounded-2xl p-5 flex flex-col gap-3 transition-all hover:border-[rgb(var(--accent)_/_0.15)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-chalk-300/40">{title}</p>
            {learnHref && (
              <Link
                href={learnHref}
                className="text-[10px] text-chalk-300/30 hover:text-accent transition-colors shrink-0"
              >
                What is this?
              </Link>
            )}
          </div>
          <p className="num mt-1.5 text-2xl font-bold text-chalk-50 leading-none">{headline}</p>
        </div>
        {badge && (
          <span className={`shrink-0 mt-0.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${badgeBg[badge.tone]}`}>
            {badge.label}
          </span>
        )}
      </div>

      <p className={`text-xs leading-relaxed ${toneClass[sentenceTone]}`}>{sentence}</p>

      {hasData && spark && (
        <div className="mt-1 -mx-1">
          {spark.type === "comparison" && (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={spark.rows} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                <CartesianGrid {...GRID} horizontal={false} />
                <XAxis type="number" tick={AXIS_STYLE} tickLine={false} axisLine={false}
                  tickFormatter={(v) => fmt(v, spark.formatter)} />
                <YAxis type="category" dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false} width={60} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => fmt(v, spark.formatter)} />
                <Bar dataKey="value" name={spark.label ?? title} fill="#6D8196" radius={[0, 3, 3, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}

          {spark.type === "line" && (
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={spark.rows.map((r) => ({ label: shortLabel(r.label), value: r.value }))}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
                <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} width={38}
                  tickFormatter={(v) => fmt(v, spark.formatter)} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => fmt(v, spark.formatter)} />
                <Line type="monotone" dataKey="value" name={spark.label ?? title}
                  stroke="#6D8196" strokeWidth={2} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          )}

          {spark.type === "bar" && (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={spark.rows.map((r) => ({ label: shortLabel(r.label), value: r.value }))}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
                <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} width={38}
                  tickFormatter={(v) => fmt(v, spark.formatter)} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => fmt(v, spark.formatter)} />
                <Bar dataKey="value" name={spark.label ?? title}
                  fill="#6D8196" radius={[2, 2, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}

          {spark.type === "dualBar" && (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={spark.rows.map((r) => ({ label: shortLabel(r.label), v1: r.value, v2: r.value2 }))}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
                <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} width={42}
                  tickFormatter={(v) => fmt(v, spark.formatter)} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => fmt(v, spark.formatter)} />
                <Bar dataKey="v1" name={spark.label ?? "Sales"}      fill="#6D8196" radius={[2, 2, 0, 0]} maxBarSize={14} />
                <Bar dataKey="v2" name={spark.label2 ?? "Net Profit"} fill="#9A8C7C" radius={[2, 2, 0, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}
