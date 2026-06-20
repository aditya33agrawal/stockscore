"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { computeWealthAllocation, type WealthInput } from "@/lib/allocation";
import { AmountSlider, formatINR } from "./AmountSlider";
import { AggressionSlider } from "./AggressionSlider";
import { HorizonSlider } from "./HorizonSlider";

interface Props {
  input: WealthInput;
  onChange: (next: WealthInput) => void;
  onCompute: () => void;
  computing: boolean;
}

export function WealthCreationForm({ input, onChange, onCompute, computing }: Props) {
  const aggressionPreview = useMemo(() => {
    const r = computeWealthAllocation(input);
    return `At ${input.aggression}/100, roughly ${formatINR((r.equityPct / 100) * input.amount)} (${r.equityPct}%) goes to equity` +
      (r.equityPct >= 55 ? ", with mid & small caps in play." : ", anchored by index and large-cap funds.");
  }, [input]);

  const horizonPreview = useMemo(() => {
    const r = computeWealthAllocation(input);
    return `Over this horizon, the model leans ${r.riskLabel.toLowerCase()} risk with an estimated ${r.modelReturn}% blended CAGR.`;
  }, [input]);

  function set<K extends keyof WealthInput>(key: K, value: WealthInput[K]) {
    onChange({ ...input, [key]: value });
  }

  return (
    <div className="rounded-2xl border border-ink-700/60 bg-ink-900/40 p-5 lg:sticky lg:top-20 h-fit">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">
        Build your portfolio mix
      </h2>
      <div className="space-y-5">
        <AmountSlider
          label="Total amount to invest"
          value={input.amount}
          onChange={(v) => set("amount", v)}
        />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs text-chalk-300">Age</label>
            <span className="num text-xs text-chalk-50">{input.age}</span>
          </div>
          <input
            type="range"
            min={18}
            max={80}
            value={input.age}
            onChange={(e) => set("age", Number(e.target.value))}
            className="w-full accent-accent"
          />
        </div>

        <AggressionSlider
          value={input.aggression}
          onChange={(v) => set("aggression", v)}
          preview={aggressionPreview}
        />

        <HorizonSlider
          value={input.horizon}
          onChange={(v) => set("horizon", v)}
          preview={horizonPreview}
        />

        <label className="flex items-center justify-between gap-3 rounded-lg border border-ink-700/40 px-3 py-2.5">
          <span className="text-xs text-chalk-200">Include real estate</span>
          <input
            type="checkbox"
            checked={input.includeRealEstate}
            onChange={(e) => set("includeRealEstate", e.target.checked)}
            className="h-4 w-4 accent-accent"
          />
        </label>

        <button
          onClick={onCompute}
          disabled={computing}
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-ink-950 transition-opacity disabled:opacity-60"
        >
          {computing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Computing…
            </span>
          ) : (
            "Compute my allocation"
          )}
        </button>
      </div>
    </div>
  );
}
