"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area,
} from "recharts";

const chartBox =
  "rounded-xl border border-ink-700/60 bg-ink-900/40 p-4 md:p-5";

/* ---------- 1. Spike-and-Return ---------- */
export function SpikeRevertChart() {
  const [spike, setSpike] = useState(60);
  const data = useMemo(() => {
    const pts = [] as { t: number; v: number }[];
    for (let t = 0; t <= 100; t++) {
      const base = 100;
      const rise =
        t < 30
          ? 0
          : t < 50
            ? ((t - 30) / 20) * spike
            : spike * Math.exp(-(t - 50) / (30 - spike * 0.15));
      pts.push({ t, v: Math.max(80, base + rise) });
    }
    return pts;
  }, [spike]);

  return (
    <div className={chartBox}>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          Spike & Return
        </p>
        <label className="flex items-center gap-2 text-xs text-chalk-300">
          Shock size
          <input
            type="range"
            min={20}
            max={120}
            value={spike}
            onChange={(e) => setSpike(Number(e.target.value))}
            className="accent-accent"
          />
          <span className="num w-8 text-right">{spike}</span>
        </label>
      </div>
      <div className="h-56">
        <ResponsiveContainer>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="t" hide />
            <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
            <Tooltip
              contentStyle={{
                background: "#0b1117",
                border: "1px solid #1f2937",
                fontSize: 12,
              }}
              formatter={(v: number) => v.toFixed(1)}
              labelFormatter={() => ""}
            />
            <ReferenceLine y={100} stroke="#475569" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="v"
              stroke="#34d399"
              strokeWidth={2}
              fill="url(#g1)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-chalk-300/70">
        Drag the slider. The bigger the spike, the harder — and faster — the
        return to baseline.
      </p>
    </div>
  );
}

/* ---------- 2. Life as a Bell Curve ---------- */
export function LifeBellChart() {
  const data = useMemo(() => {
    const pts = [];
    for (let age = 0; age <= 90; age += 2) {
      const v = 100 * Math.exp(-((age - 45) ** 2) / (2 * 18 ** 2));
      pts.push({ age, v: Math.round(v * 10) / 10 });
    }
    return pts;
  }, []);
  const markers = [
    { age: 20, label: "Peak energy" },
    { age: 35, label: "Peak strength" },
    { age: 50, label: "Peak earnings" },
    { age: 70, label: "Decline" },
  ];

  return (
    <div className={chartBox}>
      <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-2">
        A Human Life
      </p>
      <div className="h-56">
        <ResponsiveContainer>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="age"
              stroke="#64748b"
              tick={{ fontSize: 10 }}
              label={{
                value: "Age",
                position: "insideBottom",
                offset: -2,
                fontSize: 10,
                fill: "#64748b",
              }}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "#0b1117",
                border: "1px solid #1f2937",
                fontSize: 12,
              }}
              formatter={(v: number) => `${v}`}
            />
            {markers.map((m) => (
              <ReferenceLine
                key={m.age}
                x={m.age}
                stroke="#475569"
                strokeDasharray="2 3"
                label={{
                  value: m.label,
                  fill: "#94a3b8",
                  fontSize: 9,
                  position: "top",
                }}
              />
            ))}
            <Area
              type="monotone"
              dataKey="v"
              stroke="#60a5fa"
              strokeWidth={2}
              fill="url(#gL)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ---------- 3. Profession Longevity ---------- */
const PROFESSIONS = [
  { name: "Carpentry", age: 7000, color: "#a78bfa" },
  { name: "Farming", age: 12000, color: "#34d399" },
  { name: "Healing / Medicine", age: 5000, color: "#f472b6" },
  { name: "Finance / Lending", age: 5000, color: "#facc15" },
  { name: "Forging / Metalwork", age: 6000, color: "#fb923c" },
  { name: "Software Engineering", age: 70, color: "#60a5fa" },
  { name: "Content Creation", age: 20, color: "#22d3ee" },
];

export function ProfessionLindyChart() {
  const max = Math.max(...PROFESSIONS.map((p) => p.age));
  return (
    <div className={chartBox}>
      <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">
        How Old Is Your Profession?
      </p>
      <div className="space-y-3">
        {PROFESSIONS.map((p) => {
          const w = Math.max(1.5, (Math.log10(p.age + 1) / Math.log10(max + 1)) * 100);
          return (
            <div key={p.name}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-chalk-100">{p.name}</span>
                <span className="num text-chalk-300/70">
                  {p.age >= 1000
                    ? `${(p.age / 1000).toFixed(0)}k years`
                    : `${p.age} years`}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-ink-800 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${w}%`, background: p.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-chalk-300/70">
        By the Lindy Effect, the longer something has already existed, the
        longer it likely will. Bars are log-scaled.
      </p>
    </div>
  );
}

/* ---------- 4. Spike vs Slope ---------- */
export function SpikeVsSlopeChart() {
  const data = useMemo(() => {
    const pts = [];
    for (let t = 0; t <= 100; t++) {
      const spike =
        t < 30
          ? 100
          : t < 45
            ? 100 + ((t - 30) / 15) * 80
            : 180 * Math.exp(-(t - 45) / 18) + 95;
      const slope = 100 + t * 0.9;
      pts.push({ t, spike, slope });
    }
    return pts;
  }, []);
  return (
    <div className={chartBox}>
      <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-2">
        Spike vs Slope
      </p>
      <div className="h-56">
        <ResponsiveContainer>
          <LineChart data={data}>
            <XAxis dataKey="t" hide />
            <YAxis hide domain={[80, 220]} />
            <Tooltip
              contentStyle={{
                background: "#0b1117",
                border: "1px solid #1f2937",
                fontSize: 12,
              }}
              formatter={(v: number) => v.toFixed(0)}
              labelFormatter={() => ""}
            />
            <Line
              type="monotone"
              dataKey="spike"
              stroke="#f87171"
              strokeWidth={2}
              dot={false}
              name="Sudden rise"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="slope"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
              name="Slow compound"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex gap-4 text-xs text-chalk-300/80">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#f87171]" />
          Sudden rise — gives it all back
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#34d399]" />
          Slow compound — quietly overtakes
        </span>
      </div>
    </div>
  );
}
