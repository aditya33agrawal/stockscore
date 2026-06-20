"use client";

import { HORIZON_TICKS, horizonLabel } from "@/lib/allocation";

interface Props {
  value: number;
  onChange: (v: number) => void;
  preview: string;
  label?: string;
}

export function HorizonSlider({ value, onChange, preview, label = "Time horizon" }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs text-chalk-300">{label}</label>
        <span className="num text-xs text-chalk-50">{horizonLabel(value)}</span>
      </div>
      <input
        type="range"
        min={1}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
      <div className="relative mt-1.5 h-3 text-[9px] text-chalk-300/50">
        {HORIZON_TICKS.map((t, i) => (
          <span
            key={t.label}
            className="absolute -translate-x-1/2 whitespace-nowrap"
            style={{ left: `${t.at}%` }}
          >
            {i % 2 === 0 ? t.label : ""}
          </span>
        ))}
      </div>
      <p className="mt-3 rounded-md border border-accent/15 bg-accent/5 px-2.5 py-1.5 text-xs text-chalk-200 transition-all">
        {preview}
      </p>
    </div>
  );
}
