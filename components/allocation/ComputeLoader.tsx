"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import type { ProfileTag } from "@/lib/allocation";

interface Step {
  label: string;
  ms: number;
}

const SCRIPTS: Record<ProfileTag, Step[]> = {
  "young-aggressive": [
    { label: "Scanning high-growth sectors…", ms: 1400 },
    { label: "Stress-testing decades of compounding…", ms: 1800 },
    { label: "Sizing small & mid caps…", ms: 1600 },
    { label: "Checking your safety net…", ms: 1400 },
  ],
  "young-conservative": [
    { label: "Locking in a youth equity floor…", ms: 1800 },
    { label: "Balancing growth against caution…", ms: 2000 },
    { label: "Sizing your liquidity buffer…", ms: 1700 },
  ],
  "mid-balanced": [
    { label: "Mapping your glide path…", ms: 1800 },
    { label: "Diversifying across asset sleeves…", ms: 2000 },
    { label: "Tuning bonds vs equity mix…", ms: 1700 },
  ],
  "old-aggressive": [
    { label: "Preserving growth within a shorter runway…", ms: 1800 },
    { label: "Sizing guardrails around equity…", ms: 1900 },
    { label: "Building an income ladder…", ms: 1700 },
  ],
  "old-conservative": [
    { label: "Prioritising capital preservation…", ms: 1900 },
    { label: "Building an income ladder…", ms: 2000 },
    { label: "Sizing gold as crisis insurance…", ms: 1900 },
  ],
};

interface Props {
  profileTag: ProfileTag;
  short?: boolean;
  onDone: () => void;
}

export function ComputeLoader({ profileTag, short, onDone }: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const steps = SCRIPTS[profileTag] ?? SCRIPTS["mid-balanced"];
  const activeSteps = short ? steps.slice(0, 2) : steps;

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      onDone();
      return;
    }

    let i = 0;
    let cancelled = false;
    const advance = () => {
      if (cancelled) return;
      if (i >= activeSteps.length) {
        onDone();
        return;
      }
      const step = activeSteps[i];
      i += 1;
      setStepIdx(i - 1);
      setTimeout(advance, step.ms);
    };
    advance();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-2xl border border-ink-700/60 bg-ink-900/40 p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">
        {short ? "Rebalancing…" : "Analysing your profile…"}
      </p>
      <ul className="space-y-2.5">
        {activeSteps.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2.5 text-sm">
            {i < stepIdx ? (
              <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
            ) : i === stepIdx ? (
              <Loader2 className="h-4 w-4 text-accent shrink-0 animate-spin" />
            ) : (
              <span className="h-4 w-4 shrink-0 rounded-full border border-ink-700/60" />
            )}
            <span className={i <= stepIdx ? "text-chalk-100" : "text-chalk-300/50"}>{s.label}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 h-1.5 rounded-full bg-ink-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-700"
          style={{ width: `${((stepIdx + 1) / activeSteps.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
