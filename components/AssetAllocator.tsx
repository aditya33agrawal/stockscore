"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  recommendAllocation,
  type Goal,
  type RiskPref,
} from "@/lib/allocation";

const GOALS: { value: Goal; label: string }[] = [
  { value: "wealth_creation", label: "Wealth creation" },
  { value: "retirement", label: "Retirement" },
  { value: "house", label: "Buy a house" },
  { value: "child_education", label: "Child education" },
  { value: "short_term_parking", label: "Short-term parking" },
];

const PREFS: { value: RiskPref; label: string }[] = [
  { value: "conservative", label: "Conservative" },
  { value: "balanced", label: "Balanced" },
  { value: "aggressive", label: "Aggressive" },
];

export function AssetAllocator() {
  const [age, setAge] = useState(28);
  const [horizon, setHorizon] = useState(10);
  const [goal, setGoal] = useState<Goal>("wealth_creation");
  const [expectedReturn, setExpectedReturn] = useState(12);
  const [riskPref, setRiskPref] = useState<RiskPref>("balanced");
  const [monthly, setMonthly] = useState(25000);

  const result = useMemo(
    () =>
      recommendAllocation({
        age,
        horizon,
        goal,
        expectedReturn,
        riskPref,
        monthly,
      }),
    [age, horizon, goal, expectedReturn, riskPref, monthly],
  );

  const visibleSlices = result.slices.filter((s) => s.pct > 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* FORM */}
      <div className="rounded-2xl border border-ink-700/60 bg-ink-900/40 p-5 lg:sticky lg:top-20 h-fit">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">
          Your inputs
        </h2>
        <div className="space-y-4">
          <Field label="Goal">
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value as Goal)}
              className="select"
            >
              {GOALS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label={`Age — ${age}`}>
            <input
              type="range"
              min={18}
              max={75}
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </Field>

          <Field label={`Time horizon — ${horizon} years`}>
            <input
              type="range"
              min={1}
              max={40}
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </Field>

          <Field label="Risk preference">
            <div className="grid grid-cols-3 gap-2">
              {PREFS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setRiskPref(p.value)}
                  className={`rounded-md border px-2 py-2 text-xs transition-colors ${
                    riskPref === p.value
                      ? "border-accent/50 bg-accent/10 text-accent"
                      : "border-ink-700/60 text-chalk-300 hover:bg-ink-800"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label={`Expected annual return — ${expectedReturn}%`}>
            <input
              type="range"
              min={5}
              max={25}
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </Field>

          <Field label={`Monthly investment — ₹${monthly.toLocaleString("en-IN")}`}>
            <input
              type="range"
              min={1000}
              max={500000}
              step={1000}
              value={monthly}
              onChange={(e) => setMonthly(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </Field>
        </div>
      </div>

      {/* RESULT */}
      <div className="space-y-6">
        {/* Risk gauge */}
        <div className="rounded-2xl border border-ink-700/60 bg-ink-900/40 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-accent">
                Risk profile
              </p>
              <p className="mt-1 text-3xl font-bold text-chalk-50">
                {result.riskLabel}
              </p>
              <p className="text-xs text-chalk-300/70 num">
                Score {result.riskScore}/100
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-chalk-300/70">Model return</p>
              <p className="num text-2xl font-semibold text-accent">
                {result.modelReturn}%
              </p>
              <p className="text-xs text-chalk-300/70">CAGR estimate</p>
            </div>
          </div>
          <div className="mt-4 h-2 rounded-full bg-ink-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-400 via-emerald-400 to-rose-400"
              style={{ width: `${result.riskScore}%` }}
            />
          </div>
          <div
            className={`mt-4 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
              result.realistic
                ? "border-accent/20 bg-accent/5 text-chalk-300"
                : "border-warn/20 bg-warn/5 text-chalk-200"
            }`}
          >
            {result.realistic ? (
              <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-warn shrink-0 mt-0.5" />
            )}
            <p>
              {result.realistic
                ? `Your ${expectedReturn}% expectation is in line with this mix (~${result.modelReturn}% blended).`
                : `Your ${expectedReturn}% expectation is ambitious for this mix (~${result.modelReturn}% blended). Either accept more risk or lower the target.`}
            </p>
          </div>
        </div>

        {/* Donut + table */}
        <div className="rounded-2xl border border-ink-700/60 bg-ink-900/40 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">
            Recommended allocation
          </h3>
          <div className="grid gap-6 md:grid-cols-[260px_1fr]">
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={visibleSlices}
                    dataKey="pct"
                    nameKey="label"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={2}
                    isAnimationActive={false}
                  >
                    {visibleSlices.map((s) => (
                      <Cell key={s.key} fill={s.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#0b1117",
                      border: "1px solid #1f2937",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => `${v}%`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {visibleSlices.map((s) => (
                <div
                  key={s.key}
                  className="flex items-center justify-between gap-3 rounded-lg border border-ink-700/40 px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ background: s.color }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-chalk-50">{s.label}</p>
                      <p className="text-xs text-chalk-300/70 truncate">
                        {s.instrument}
                      </p>
                    </div>
                  </div>
                  <span className="num text-sm font-semibold text-chalk-100 shrink-0">
                    {s.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rationale */}
        <div className="rounded-2xl border border-ink-700/60 bg-ink-900/40 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">
            Why this mix
          </h3>
          <ul className="space-y-2 text-sm text-chalk-300">
            {visibleSlices.map((s) => (
              <li key={s.key} className="flex gap-3">
                <span className="num text-chalk-100 w-12 shrink-0">
                  {s.pct}%
                </span>
                <span>
                  <strong className="text-chalk-100">{s.label}</strong> —{" "}
                  {s.rationale}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-chalk-300/60">
            This is an educational starting point, not investment advice.
            Re-check yearly or when your goal / horizon changes.
          </p>
        </div>
      </div>

      <style jsx>{`
        :global(.select) {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgba(71, 85, 105, 0.4);
          background: rgba(11, 17, 23, 0.6);
          padding: 0.5rem 0.75rem;
          color: #f1f5f9;
          font-size: 0.875rem;
          outline: none;
        }
        :global(.select:focus) {
          border-color: rgba(16, 185, 129, 0.5);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs text-chalk-300 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
