"use client";

import { useEffect, useState, useCallback } from "react";
import clsx from "clsx";
import {
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { formatDuration, formatRelative } from "@/lib/format";
import type { RefreshSummary } from "@/lib/refresh/run";

interface RunRow {
  id: number;
  started_at: string;
  finished_at: string | null;
  requested_by: string | null;
  ok: boolean | null;
  request: { phases?: string[]; sectors?: string[]; force?: boolean } | null;
  summary: RefreshSummary | null;
  error_count: number;
}

interface ErrorRow {
  id: number;
  ts: string;
  phase: string;
  scope: string | null;
  item: string | null;
  reason: string | null;
  message: string;
  stack: string | null;
}

export function RunHistory() {
  const [runs, setRuns] = useState<RunRow[] | null>(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<number, ErrorRow[]>>({});
  const [loadingErrors, setLoadingErrors] = useState(false);

  const load = useCallback(() => {
    setRuns(null);
    setError("");
    fetch("/api/admin/runs", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setRuns(d?.runs ?? []))
      .catch(() => setError("Failed to load run history"));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggle(run: RunRow) {
    if (expanded === run.id) {
      setExpanded(null);
      return;
    }
    setExpanded(run.id);
    if (run.error_count > 0 && !errors[run.id]) {
      setLoadingErrors(true);
      try {
        const d = await fetch(`/api/admin/runs?id=${run.id}`, { cache: "no-store" }).then((r) => r.json());
        setErrors((prev) => ({ ...prev, [run.id]: d?.errors ?? [] }));
      } catch {
        /* ignore */
      } finally {
        setLoadingErrors(false);
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink-700 px-3 py-1.5 text-sm text-chalk-300 hover:text-accent hover:border-accent/30 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refetch
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>
      )}

      {runs === null && !error && (
        <p className="flex items-center gap-2 text-sm text-chalk-300/60">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </p>
      )}

      {runs?.length === 0 && (
        <p className="text-sm text-chalk-300/50">No refresh runs recorded yet.</p>
      )}

      {runs?.map((run) => {
        const isOpen = expanded === run.id;
        const phases = run.summary?.phases ?? {};
        const totalMs = run.summary?.duration_ms ?? null;
        const ok = run.ok;
        return (
          <div key={run.id} className="glass border-subtle rounded-2xl overflow-hidden">
            <button
              onClick={() => toggle(run)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-ink-800/40 transition-colors"
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-chalk-300/60" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-chalk-300/60" />
              )}
              {ok == null ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-chalk-300/60" />
              ) : ok ? (
                <CheckCircle className="h-4 w-4 shrink-0 text-good" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0 text-bad" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-chalk-100 truncate">
                  {(run.request?.phases ?? []).join(" · ") || "-"}
                  {run.request?.force && <span className="ml-1.5 text-warn text-xs">force</span>}
                </p>
                <p className="text-xs text-chalk-300/50 num">
                  {formatRelative(run.started_at)}
                  {run.requested_by ? ` · ${run.requested_by}` : ""}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm num text-chalk-200">{formatDuration(totalMs)}</p>
                {run.error_count > 0 && (
                  <p className="text-xs num text-bad">{run.error_count} err</p>
                )}
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-[rgb(var(--accent)_/_0.08)] px-4 py-3 space-y-3">
                {/* Per-phase durations */}
                <div className="flex flex-wrap gap-2">
                  {Object.entries(phases).map(([name, p]) => (
                    <span
                      key={name}
                      className={clsx(
                        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs num",
                        p.ok
                          ? "border-good/25 bg-good/10 text-good"
                          : "border-bad/25 bg-bad/10 text-bad",
                      )}
                    >
                      {name}: {formatDuration(p.duration_ms)}
                    </span>
                  ))}
                  {Object.keys(phases).length === 0 && (
                    <span className="text-xs text-chalk-300/50">No phase summary.</span>
                  )}
                </div>

                {/* Errors */}
                {run.error_count > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-chalk-300/60 mb-1.5">
                      Errors ({run.error_count})
                    </p>
                    {loadingErrors && !errors[run.id] ? (
                      <p className="flex items-center gap-2 text-xs text-chalk-300/50">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading errors…
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {(errors[run.id] ?? []).map((e) => (
                          <details key={e.id} className="rounded-lg border border-bad/20 bg-bad/5 px-3 py-2">
                            <summary className="cursor-pointer text-xs text-bad">
                              <span className="font-semibold">{e.phase}</span>
                              {e.scope ? ` · ${e.scope}` : ""}
                              {e.item ? ` · ${e.item}` : ""}
                              {e.reason ? ` · ${e.reason}` : ""} - {e.message}
                            </summary>
                            {e.stack && (
                              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-[11px] text-chalk-300/70">
                                {e.stack}
                              </pre>
                            )}
                          </details>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
