"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { computeGoalAllocation, GOALS, getGoal, type GoalInput } from "@/lib/allocation";
import { AmountSlider, formatINR } from "./AmountSlider";
import { HorizonSlider } from "./HorizonSlider";

interface Props {
  input: GoalInput;
  onChange: (next: GoalInput) => void;
  onCompute: () => void;
  computing: boolean;
}

export function GoalBasedForm({ input, onChange, onCompute, computing }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const goal = getGoal(input.goal);

  const preview = useMemo(() => {
    const r = computeGoalAllocation(input);
    const base = goal.definitive
      ? `With a fixed date, the mix stays in debt, bonds & cash — ${r.riskScore}/100 risk score.`
      : `Open-ended goal — equity leads at ${r.equityPct}% with an estimated ${r.modelReturn}% blended CAGR.`;
    if (!r.goalFeasibility) return base;
    const f = r.goalFeasibility;
    const tail =
      f.status === "short"
        ? ` At this rate you'd land at ${formatINR(f.projectedCorpus)}, short of the ${formatINR(f.targetFutureValue)} this goal needs by then.`
        : f.status === "surplus"
          ? ` You're on pace for ${formatINR(f.projectedCorpus)} against a ${formatINR(f.targetFutureValue)} target — comfortable surplus.`
          : ` You're on pace for ${formatINR(f.projectedCorpus)}, right around the ${formatINR(f.targetFutureValue)} target.`;
    return base + tail;
  }, [input, goal]);

  function set<K extends keyof GoalInput>(key: K, value: GoalInput[K]) {
    onChange({ ...input, [key]: value });
  }

  return (
    <div className="rounded-2xl border border-ink-700/60 bg-ink-900/40 p-5 lg:sticky lg:top-20 h-fit">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-accent">
          Plan for a specific goal
        </h2>
        <span className="text-xs text-chalk-300/60">Step {step} of 2</span>
      </div>

      {step === 1 ? (
        <div className="space-y-5">
          <div>
            <label className="block text-xs text-chalk-300 mb-1.5">Goal</label>
            <select
              value={input.goal}
              onChange={(e) => {
                const g = getGoal(e.target.value as GoalInput["goal"]);
                onChange({ ...input, goal: g.key, horizon: g.typicalHorizon });
              }}
              className="select"
            >
              {GOALS.map((g) => (
                <option key={g.key} value={g.key}>
                  {g.label} · term {g.termRating}/100
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-chalk-300/70">{goal.note}</p>
          </div>

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

          <HorizonSlider
            value={input.horizon}
            onChange={(v) => set("horizon", v)}
            preview={preview}
            label="Time horizon for this goal"
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs text-chalk-300">
                What will this cost, in today&apos;s rupees?
              </label>
              <div className="flex items-center gap-2">
                <span className="num text-xs text-chalk-50">{formatINR(input.targetCorpus)}</span>
                {input.targetCorpus > 0 && (
                  <button
                    onClick={() => set("targetCorpus", 0)}
                    className="text-xs text-chalk-300/60 hover:text-chalk-100"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <AmountSlider
              label=""
              value={input.targetCorpus}
              onChange={(v) => set("targetCorpus", v)}
              max={5_00_00_000}
              step={50_000}
            />
            <p className="mt-1.5 text-xs text-chalk-300/70">
              Optional — tells us if your plan will actually reach the goal. We&apos;ll inflate
              this at {6}%/yr to the goal date and compare it against your projected corpus.
              Leave at ₹0 to skip and just see a split.
            </p>
          </div>

          <button
            onClick={() => setStep(2)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-ink-950"
          >
            Next: amount &amp; style <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <label className="block text-xs text-chalk-300 mb-1.5">Investment style</label>
            <div className="grid grid-cols-2 gap-2">
              {(["lumpsum", "sip"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => set("mode", m)}
                  className={`rounded-md border px-2 py-2 text-xs transition-colors ${
                    input.mode === m
                      ? "border-accent/50 bg-accent/10 text-accent"
                      : "border-ink-700/60 text-chalk-300 hover:bg-ink-800"
                  }`}
                >
                  {m === "lumpsum" ? "Lump sum" : "SIP (monthly)"}
                </button>
              ))}
            </div>
          </div>

          <AmountSlider
            label={input.mode === "lumpsum" ? "Lump sum amount" : "Monthly SIP amount"}
            value={input.amount}
            onChange={(v) => set("amount", v)}
            max={input.mode === "lumpsum" ? 1_00_00_000 : 5_00_000}
            step={input.mode === "lumpsum" ? 50_000 : 1_000}
          />

          <p className="rounded-md border border-accent/15 bg-accent/5 px-2.5 py-1.5 text-xs text-chalk-200">
            {preview}
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setStep(1)}
              className="flex items-center justify-center gap-2 rounded-lg border border-ink-700/60 px-4 py-2.5 text-sm font-medium text-chalk-200 hover:bg-ink-800"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              onClick={onCompute}
              disabled={computing}
              className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-ink-950 transition-opacity disabled:opacity-60"
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
      )}

      <style jsx>{`
        :global(.select) {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(var(--ink-700) / 0.6);
          background: rgb(var(--ink-800) / 0.6);
          padding: 0.5rem 0.75rem;
          color: rgb(var(--chalk-50));
          font-size: 0.875rem;
          outline: none;
        }
        :global(.select:focus) {
          border-color: rgb(var(--accent) / 0.6);
        }
      `}</style>
    </div>
  );
}
