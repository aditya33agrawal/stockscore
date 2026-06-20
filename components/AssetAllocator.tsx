"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LogIn, History, ChevronDown, ChevronRight } from "lucide-react";
import clsx from "clsx";
import {
  computeWealthAllocation,
  computeGoalAllocation,
  type WealthInput,
  type GoalInput,
  type AllocationResult as AllocationResultType,
} from "@/lib/allocation";
import { WealthCreationForm } from "./allocation/WealthCreationForm";
import { GoalBasedForm } from "./allocation/GoalBasedForm";
import { ComputeLoader } from "./allocation/ComputeLoader";
import { AllocationResult } from "./allocation/AllocationResult";
import { AllocationTree } from "./allocation/AllocationTree";

const DEFAULT_WEALTH: WealthInput = {
  amount: 10_00_000,
  age: 28,
  aggression: 50,
  horizon: 100,
  includeRealEstate: true,
};

const DEFAULT_GOAL: GoalInput = {
  mode: "lumpsum",
  amount: 5_00_000,
  goal: "retirement",
  age: 30,
  horizon: 88,
  targetCorpus: 0,
};

interface HistoryEntry {
  id: number;
  mode: "wealth" | "goal";
  input: Record<string, unknown>;
  result: AllocationResultType;
  created_at: string;
}

export function AssetAllocator() {
  const router = useRouter();
  const pathname = usePathname();

  const [mode, setMode] = useState<"wealth" | "goal">("wealth");
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  const [wealthInput, setWealthInput] = useState<WealthInput>(DEFAULT_WEALTH);
  const [wealthResult, setWealthResult] = useState<AllocationResultType | null>(null);
  const [wealthPending, setWealthPending] = useState<AllocationResultType | null>(null);
  const [wealthComputing, setWealthComputing] = useState(false);

  const [goalInput, setGoalInput] = useState<GoalInput>(DEFAULT_GOAL);
  const [goalResult, setGoalResult] = useState<AllocationResultType | null>(null);
  const [goalPending, setGoalPending] = useState<AllocationResultType | null>(null);
  const [goalComputing, setGoalComputing] = useState(false);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json().catch(() => ({}));
        if (!cancelled) setSignedIn(!!data?.user);
      } catch {
        if (!cancelled) setSignedIn(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (signedIn !== true) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/allocation-history");
        if (!res.ok) return;
        const data = await res.json().catch(() => ({ history: [] }));
        if (!cancelled) setHistory(data.history ?? []);
      } catch {
        // best-effort
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  async function saveHistory(m: "wealth" | "goal", input: unknown, result: AllocationResultType) {
    if (signedIn !== true) return;
    try {
      const res = await fetch("/api/allocation-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: m, input, result }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.entry) setHistory((h) => [data.entry, ...h].slice(0, 20));
      }
    } catch {
      // best-effort
    }
  }

  function computeWealth() {
    const r = computeWealthAllocation(wealthInput);
    setWealthPending(r);
    setWealthComputing(true);
  }

  function computeGoal() {
    const r = computeGoalAllocation(goalInput);
    setGoalPending(r);
    setGoalComputing(true);
  }

  function signInPrompt() {
    const next = encodeURIComponent(pathname || "/asset-allocation");
    router.push(`/login?next=${next}`);
  }

  return (
    <div className="space-y-8">
      <div className="inline-flex rounded-xl border border-ink-700/60 bg-ink-900/40 p-1">
        {(["wealth", "goal"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={clsx(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              mode === m ? "bg-accent text-ink-950" : "text-chalk-300 hover:text-chalk-50",
            )}
          >
            {m === "wealth" ? "Wealth Creation" : "Goal-Based"}
          </button>
        ))}
      </div>

      {signedIn === false && (
        <button
          onClick={signInPrompt}
          className="flex w-full items-center gap-2 rounded-lg border border-accent/20 bg-accent/5 px-4 py-2.5 text-left text-xs text-chalk-200 hover:bg-accent/10"
        >
          <LogIn className="h-4 w-4 text-accent shrink-0" />
          Sign in to save this computation and see it as personalised history later.
        </button>
      )}

      {mode === "wealth" ? (
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <WealthCreationForm
            input={wealthInput}
            onChange={setWealthInput}
            onCompute={computeWealth}
            computing={wealthComputing}
          />
          {wealthComputing && wealthPending ? (
            <ComputeLoader
              profileTag={wealthPending.profileTag}
              short={!!wealthResult}
              onDone={() => {
                setWealthResult(wealthPending);
                setWealthComputing(false);
                saveHistory("wealth", wealthInput, wealthPending);
              }}
            />
          ) : wealthResult ? (
            <AllocationResult result={wealthResult} />
          ) : (
            <EmptyState />
          )}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <GoalBasedForm
            input={goalInput}
            onChange={setGoalInput}
            onCompute={computeGoal}
            computing={goalComputing}
          />
          {goalComputing && goalPending ? (
            <ComputeLoader
              profileTag={goalPending.profileTag}
              short={!!goalResult}
              onDone={() => {
                setGoalResult(goalPending);
                setGoalComputing(false);
                saveHistory("goal", goalInput, goalPending);
              }}
            />
          ) : goalResult ? (
            <AllocationResult result={goalResult} />
          ) : (
            <EmptyState />
          )}
        </div>
      )}

      {signedIn === true && history.length > 0 && (
        <div className="rounded-2xl border border-ink-700/60 bg-ink-900/40 p-5">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent mb-4">
            <History className="h-3.5 w-3.5" /> Your history
          </h3>
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="rounded-lg border border-ink-700/40">
                <button
                  onClick={() => setHistoryOpen((o) => (o === h.id ? null : h.id))}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {historyOpen === h.id ? (
                      <ChevronDown className="h-3.5 w-3.5 text-chalk-300/60 shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-chalk-300/60 shrink-0" />
                    )}
                    <span className="text-xs font-medium uppercase tracking-wide text-accent">
                      {h.mode === "wealth" ? "Wealth" : "Goal"}
                    </span>
                    <span className="text-sm text-chalk-100 truncate">
                      {h.result.riskLabel} · {h.result.modelReturn}% est.
                    </span>
                  </div>
                  <span className="text-xs text-chalk-300/60 shrink-0">
                    {new Date(h.created_at).toLocaleDateString("en-IN")}
                  </span>
                </button>
                {historyOpen === h.id && (
                  <div className="border-t border-ink-700/40 px-3 py-3">
                    <AllocationTree tree={h.result.tree} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-ink-700/60 p-8 text-center text-sm text-chalk-300/70">
      Set your inputs and hit compute to see your recommended allocation.
    </div>
  );
}
