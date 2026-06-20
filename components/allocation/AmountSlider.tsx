"use client";

import { useEffect, useState } from "react";

export function formatINR(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

interface Props {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function AmountSlider({ label, value, onChange, min = 0, max = 1_00_00_000, step = 50_000 }: Props) {
  const [text, setText] = useState(value.toString());

  useEffect(() => {
    setText(value.toString());
  }, [value]);

  function commitText(raw: string) {
    const digits = raw.replace(/[^\d]/g, "");
    const n = digits ? Number(digits) : 0;
    const clamped = Math.max(min, Math.min(max, n));
    onChange(clamped);
  }

  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs text-chalk-300">{label}</label>
          <span className="num text-xs text-chalk-50">{formatINR(value)}</span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs text-chalk-300/70">₹</span>
        <input
          type="text"
          inputMode="numeric"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => commitText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitText((e.target as HTMLInputElement).value);
          }}
          className="num w-full rounded-md border border-ink-700/60 bg-ink-800/60 px-2 py-1 text-xs text-chalk-50 outline-none focus:border-accent/60"
        />
      </div>
    </div>
  );
}
