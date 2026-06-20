"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Info, TrendingUp, TrendingDown, CheckCircle2 } from "lucide-react";
import type { AllocationResult as AllocationResultType } from "@/lib/allocation";
import { AllocationTree } from "./AllocationTree";
import { formatINR } from "./AmountSlider";

export function AllocationResult({ result }: { result: AllocationResultType }) {
  const f = result.goalFeasibility;
  return (
    <div className="space-y-6">
      {f && (
        <div
          className={`rounded-2xl border p-5 ${
            f.status === "short"
              ? "border-bad/30 bg-bad/5"
              : f.status === "surplus"
                ? "border-good/30 bg-good/5"
                : "border-warn/30 bg-warn/5"
          }`}
        >
          <div className="flex items-center gap-2">
            {f.status === "short" ? (
              <TrendingDown className="h-4 w-4 text-bad shrink-0" />
            ) : f.status === "surplus" ? (
              <CheckCircle2 className="h-4 w-4 text-good shrink-0" />
            ) : (
              <TrendingUp className="h-4 w-4 text-warn shrink-0" />
            )}
            <p
              className={`text-sm font-semibold ${
                f.status === "short"
                  ? "text-bad"
                  : f.status === "surplus"
                    ? "text-good"
                    : "text-warn"
              }`}
            >
              {f.status === "short"
                ? `Short by ${formatINR(Math.abs(f.gap))}`
                : f.status === "surplus"
                  ? `Surplus of ${formatINR(Math.abs(f.gap))}`
                  : "On track"}
            </p>
          </div>
          <p className="mt-2 text-sm text-chalk-200">
            {formatINR(f.targetToday)} today inflates to{" "}
            <span className="num font-medium text-chalk-50">{formatINR(f.targetFutureValue)}</span>{" "}
            in {f.horizonYears} {f.horizonYears === 1 ? "year" : "years"} at {f.inflationRate}%
            assumed inflation. This plan is projected to reach{" "}
            <span className="num font-medium text-chalk-50">{formatINR(f.projectedCorpus)}</span>{" "}
            by then.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-ink-700/60 bg-ink-900/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              Risk profile
            </p>
            <p className="mt-1 text-3xl font-bold text-chalk-50">{result.riskLabel}</p>
            <p className="text-xs text-chalk-300/70 num">Score {result.riskScore}/100</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-chalk-300/70">Model return</p>
            <p className="num text-2xl font-semibold text-accent">{result.modelReturn}%</p>
            <p className="text-xs text-chalk-300/70">CAGR estimate</p>
          </div>
        </div>
        <div className="mt-4 h-2 rounded-full bg-ink-800 overflow-hidden">
          <div className="h-full rounded-full bg-accent" style={{ width: `${result.riskScore}%` }} />
        </div>
        <p className="mt-4 text-sm text-chalk-200">{result.summary}</p>
        {result.realEstateNote && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-warn/20 bg-warn/5 px-3 py-2 text-xs text-chalk-200">
            <Info className="h-4 w-4 text-warn shrink-0 mt-0.5" />
            <p>{result.realEstateNote}</p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-ink-700/60 bg-ink-900/40 p-5">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">
          Recommended allocation
        </h3>
        <div className="grid gap-6 md:grid-cols-[240px_1fr]">
          <div className="h-60">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={result.flat}
                  dataKey="pct"
                  nameKey="label"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  isAnimationActive={false}
                >
                  {result.flat.map((s) => (
                    <Cell key={s.key} fill={s.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "rgb(var(--ink-800))",
                    border: "1px solid rgb(var(--ink-700))",
                    color: "rgb(var(--chalk-100))",
                    fontSize: 12,
                  }}
                  formatter={(v: number) => `${v}%`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <AllocationTree tree={result.tree} />
        </div>
      </div>

      <p className="text-xs text-chalk-300/60">
        This is an educational starting point, not investment advice. Re-check when your
        amount, age, or horizon changes meaningfully.
      </p>
    </div>
  );
}
