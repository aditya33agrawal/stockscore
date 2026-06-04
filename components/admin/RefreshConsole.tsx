"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from "lucide-react";
import clsx from "clsx";
import type { RefreshSummary, Phase } from "@/lib/refresh/run";

interface SectorConfig {
  slug: string;
  name: string;
}

interface Props {
  sectors: SectorConfig[];
}

type RunState = "idle" | "running" | "done" | "error";

const ALL_PHASES: { id: Phase; label: string }[] = [
  { id: "sectors", label: "Sectors / Companies" },
  { id: "market", label: "Market Overview" },
  { id: "charts", label: "Price Charts" },
];

export function RefreshConsole({ sectors }: Props) {
  const [runState, setRunState] = useState<RunState>("idle");
  const [selectedPhases, setSelectedPhases] = useState<Phase[]>(["sectors"]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [force, setForce] = useState(false);
  const [rawLines, setRawLines] = useState<string[]>([]);
  const [summary, setSummary] = useState<RefreshSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [errorsExpanded, setErrorsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sectorFilter, setSectorFilter] = useState("");

  const logRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [rawLines]);

  const togglePhase = (phase: Phase) => {
    setSelectedPhases((prev) =>
      prev.includes(phase) ? prev.filter((p) => p !== phase) : [...prev, phase]
    );
  };

  const toggleSector = (slug: string) => {
    setSelectedSectors((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const selectAllSectors = () => setSelectedSectors(sectors.map((s) => s.slug));
  const clearSectors = () => setSelectedSectors([]);

  const needsSectorPicker = selectedPhases.includes("sectors") || selectedPhases.includes("charts");
  const filteredSectors = sectors.filter((s) =>
    s.name.toLowerCase().includes(sectorFilter.toLowerCase())
  );

  const copyLog = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(rawLines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }, [rawLines]);

  async function startRun() {
    setRunState("running");
    setRawLines([]);
    setSummary(null);
    setErrorMsg("");
    setErrorsExpanded(false);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/admin/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        signal: ctrl.signal,
        body: JSON.stringify({
          phases: selectedPhases,
          sectors: selectedSectors.length ? selectedSectors : undefined,
          force,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
      }

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const msg = chunk.replace(/^data:\s*/m, "").trim();
          if (!msg) continue;

          if (msg === "DONE") {
            setRunState("done");
            return;
          }

          if (msg.startsWith("ERROR:")) {
            setErrorMsg(msg.replace(/^ERROR:\s*/, ""));
            setRunState("error");
            return;
          }

          if (msg.startsWith("SUMMARY:")) {
            try {
              setSummary(JSON.parse(msg.slice("SUMMARY:".length)));
            } catch {
              // ignore parse error
            }
            continue;
          }

          setRawLines((prev) => [...prev, msg]);
        }
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      setErrorMsg(String(err));
      setRunState("error");
    }
  }

  function reset() {
    abortRef.current?.abort();
    setRunState("idle");
    setRawLines([]);
    setSummary(null);
    setErrorMsg("");
    setErrorsExpanded(false);
  }

  const isRunning = runState === "running";
  const hasLog = rawLines.length > 0;

  return (
    <div className="space-y-6">
      {/* Config panel */}
      <div className="glass border-subtle rounded-2xl p-6 space-y-5">

        {/* Phase picker */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-chalk-300/60 mb-3">Pipelines</p>
          <div className="flex flex-wrap gap-2">
            {ALL_PHASES.map(({ id, label }) => (
              <button
                key={id}
                disabled={isRunning}
                onClick={() => togglePhase(id)}
                className={clsx(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                  selectedPhases.includes(id)
                    ? "border-accent/50 bg-accent/15 text-accent"
                    : "border-ink-600 bg-ink-800/60 text-chalk-300 hover:border-accent/30 hover:text-accent/80"
                )}
              >
                <span
                  className={clsx(
                    "h-2 w-2 rounded-full",
                    selectedPhases.includes(id) ? "bg-accent" : "bg-ink-600"
                  )}
                />
                {label}
              </button>
            ))}
            <button
              disabled={isRunning}
              onClick={() => setSelectedPhases(ALL_PHASES.map((p) => p.id))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-600 bg-ink-800/60 px-3 py-1.5 text-xs font-medium text-chalk-300/60 hover:text-chalk-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              All three
            </button>
          </div>
        </div>

        {/* Sector multi-select */}
        {needsSectorPicker && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-chalk-300/60">
                Sectors{" "}
                <span className="normal-case font-normal text-chalk-300/40">
                  {selectedSectors.length === 0
                    ? "(all)"
                    : `(${selectedSectors.length} selected)`}
                </span>
              </p>
              <div className="flex gap-2">
                <button
                  disabled={isRunning}
                  onClick={selectAllSectors}
                  className="text-xs text-accent/70 hover:text-accent transition-colors disabled:opacity-50"
                >
                  Select all
                </button>
                <span className="text-chalk-300/30">·</span>
                <button
                  disabled={isRunning}
                  onClick={clearSectors}
                  className="text-xs text-chalk-300/50 hover:text-chalk-300 transition-colors disabled:opacity-50"
                >
                  Clear
                </button>
              </div>
            </div>

            <input
              type="text"
              placeholder="Filter sectors…"
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              disabled={isRunning}
              className="w-full mb-2 rounded-lg border border-ink-700/60 bg-ink-800 px-3 py-2 text-xs text-chalk-100 placeholder-chalk-300/30 focus:outline-none focus:border-accent/50 transition-colors disabled:opacity-50"
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 max-h-48 overflow-y-auto pr-1">
              {filteredSectors.map((s) => (
                <button
                  key={s.slug}
                  disabled={isRunning}
                  onClick={() => toggleSector(s.slug)}
                  className={clsx(
                    "text-left rounded-lg border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                    selectedSectors.includes(s.slug)
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-ink-700/50 bg-ink-900/40 text-chalk-300 hover:border-accent/20 hover:text-chalk-100"
                  )}
                >
                  {s.name}
                </button>
              ))}
            </div>

            {/* Selected chips */}
            {selectedSectors.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedSectors.map((slug) => {
                  const s = sectors.find((x) => x.slug === slug);
                  return (
                    <span
                      key={slug}
                      className="inline-flex items-center gap-1 rounded-md border border-accent/20 bg-accent/10 px-2 py-0.5 text-[10px] text-accent"
                    >
                      {s?.name ?? slug}
                      {!isRunning && (
                        <button
                          onClick={() => toggleSector(slug)}
                          className="hover:text-accent/70"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Force toggle + run button */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              onClick={() => !isRunning && setForce((v) => !v)}
              className={clsx(
                "relative h-4 w-7 rounded-full transition-colors",
                force ? "bg-accent" : "bg-ink-600",
                isRunning && "opacity-50 cursor-not-allowed"
              )}
            >
              <span
                className={clsx(
                  "absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform",
                  force ? "translate-x-3.5" : "translate-x-0.5"
                )}
              />
            </div>
            <span className="text-xs text-chalk-300">Bypass 7-day freshness check</span>
          </label>

          <div className="flex gap-2">
            {runState !== "idle" && (
              <button
                onClick={reset}
                disabled={isRunning}
                className="rounded-lg border border-ink-700/60 px-4 py-2 text-xs text-chalk-300/60 hover:text-chalk-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isRunning ? "Running…" : "Reset"}
              </button>
            )}
            <button
              onClick={startRun}
              disabled={isRunning || selectedPhases.length === 0}
              className={clsx(
                "inline-flex items-center gap-2 rounded-lg border px-5 py-2 text-xs font-semibold transition-colors",
                isRunning
                  ? "border-ink-600 bg-ink-800/60 text-chalk-300/40 cursor-not-allowed"
                  : "border-accent/50 bg-accent/15 text-accent hover:bg-accent/25"
              )}
            >
              {isRunning ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Running…</>
              ) : (
                <><RefreshCw className="h-3.5 w-3.5" /> Run</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Live log panel */}
      {hasLog && (
        <div className="rounded-2xl border border-ink-700/60 bg-ink-950 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink-700/40 bg-ink-900/60">
            <div className="flex items-center gap-2">
              {isRunning && <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />}
              {runState === "done" && <CheckCircle className="h-3.5 w-3.5 text-accent" />}
              {runState === "error" && <XCircle className="h-3.5 w-3.5 text-bad" />}
              <span className="text-xs font-semibold text-chalk-100">Live log</span>
              <span className="num text-xs text-chalk-300/40 ml-1">{rawLines.length} lines</span>
            </div>
            <button
              onClick={copyLog}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-700/60 px-2.5 py-1.5 text-xs text-chalk-300/50 hover:text-chalk-300 transition-colors"
            >
              {copied ? <Check className="h-3 w-3 text-good" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div
            ref={logRef}
            className="max-h-96 overflow-y-auto p-4 font-mono text-[11px] text-chalk-300/70 leading-relaxed whitespace-pre-wrap break-all"
          >
            {rawLines.map((line, i) => (
              <div key={i} className="hover:bg-ink-900/30">{line}</div>
            ))}
            {isRunning && (
              <div className="mt-1 flex items-center gap-1.5 text-accent/50">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Streaming…</span>
              </div>
            )}
            {runState === "error" && errorMsg && (
              <div className="mt-2 text-bad">{errorMsg}</div>
            )}
          </div>
        </div>
      )}

      {/* Run summary */}
      {summary && (
        <div className="glass border-subtle rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            {summary.ok
              ? <CheckCircle className="h-5 w-5 text-good shrink-0" />
              : <XCircle className="h-5 w-5 text-bad shrink-0" />
            }
            <div>
              <p className="text-sm font-semibold text-chalk-50">
                {summary.ok ? "All phases completed successfully" : "Run completed with errors"}
              </p>
              <p className="num text-xs text-chalk-300/50 mt-0.5">
                {(summary.duration_ms / 1000).toFixed(1)}s total
              </p>
            </div>
          </div>

          {/* Per-phase breakdown */}
          <div className="grid gap-2">
            {Object.entries(summary.phases).map(([phase, result]) => (
              <div
                key={phase}
                className="flex items-center justify-between rounded-xl border border-ink-700/40 bg-ink-900/40 px-4 py-2.5"
              >
                <div className="flex items-center gap-2">
                  {result.ok
                    ? <CheckCircle className="h-3.5 w-3.5 text-good" />
                    : <XCircle className="h-3.5 w-3.5 text-bad" />
                  }
                  <span className="text-xs font-medium text-chalk-200 capitalize">{phase}</span>
                  {result.error && (
                    <span className="text-xs text-bad/80 truncate max-w-xs">{result.error}</span>
                  )}
                </div>
                <span className="num text-xs text-chalk-300/40">
                  {(result.duration_ms / 1000).toFixed(1)}s
                </span>
              </div>
            ))}
          </div>

          {/* Error list */}
          {summary.errors.length > 0 && (
            <div>
              <button
                onClick={() => setErrorsExpanded((v) => !v)}
                className="flex items-center gap-2 text-xs font-semibold text-bad/80 hover:text-bad transition-colors"
              >
                {errorsExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                Errors ({summary.errors.length})
              </button>

              {errorsExpanded && (
                <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
                  {summary.errors.map((e, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-bad/15 bg-bad/5 px-4 py-3 text-xs"
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="rounded border border-bad/20 bg-bad/10 px-1.5 py-0.5 font-mono text-bad/80">
                          {e.phase}
                        </span>
                        {e.scope && (
                          <span className="text-chalk-300/60">{e.scope}</span>
                        )}
                        {e.item && (
                          <span className="font-medium text-chalk-200">{e.item}</span>
                        )}
                        <span className="ml-auto num text-chalk-300/30 text-[10px]">
                          {new Date(e.ts).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-chalk-300/80 break-all">{e.message}</p>
                      {e.stack && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-chalk-300/40 hover:text-chalk-300/60">
                            Stack trace
                          </summary>
                          <pre className="mt-1 text-[10px] text-chalk-300/40 whitespace-pre-wrap break-all overflow-auto max-h-32">
                            {e.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Charts serverless note */}
      {selectedPhases.includes("charts") && runState === "idle" && (
        <p className="text-xs text-chalk-300/40 text-center">
          Note: a full charts refresh across many symbols may approach Vercel&apos;s function time limit.
          For large runs consider the GitHub Action.
        </p>
      )}
    </div>
  );
}
