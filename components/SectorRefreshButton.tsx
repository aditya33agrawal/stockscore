"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import clsx from "clsx";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UIState = "idle" | "password" | "running" | "done" | "error";

interface CompanyEntry {
  name: string;
  number: number;
  total: number;
  step: string;
  done: boolean;
  failed: boolean;
  score?: string;
  classification?: string;
}

interface LogState {
  authenticated: boolean;
  sectorName: string;
  totalCompanies: number;
  companies: CompanyEntry[];
}

// ---------------------------------------------------------------------------
// Log parser
// ---------------------------------------------------------------------------

function initLog(): LogState {
  return { authenticated: false, sectorName: "", totalCompanies: 0, companies: [] };
}

function parseLogMessage(msg: string, state: LogState): LogState {
  // Auth
  if (msg.includes("Authenticated ✓")) {
    return { ...state, authenticated: true };
  }

  // [sector] Oil & Gas (6 companies)
  const sectorM = msg.match(/\[sector\] (.+?) \((\d+) compan/);
  if (sectorM) {
    return { ...state, sectorName: sectorM[1], totalCompanies: parseInt(sectorM[2]) };
  }

  // [company] NAME — searching …
  const searchM = msg.match(/\[company\] (.+?) — searching/);
  if (searchM) {
    const name = searchM[1].trim();
    const number = state.companies.length + 1;
    return {
      ...state,
      companies: [
        ...state.companies,
        { name, number, total: state.totalCompanies, step: "Looking up on Screener…", done: false, failed: false },
      ],
    };
  }

  // [company] NAME → https://...  (found, loading page)
  const foundM = msg.match(/\[company\] (.+?) → https/);
  if (foundM) return patchStep(state, foundM[1].trim(), "Loading company page…");

  // [company] NAME — parsed HTML
  const parsedM = msg.match(/\[company\] (.+?) — parsed HTML/);
  if (parsedM) return patchStep(state, parsedM[1].trim(), "Parsing financials…");

  // [company] NAME — fetched quick ratios + peers
  const ratiosM = msg.match(/\[company\] (.+?) — fetched quick ratios/);
  if (ratiosM) return patchStep(state, ratiosM[1].trim(), "Fetching ratios & peer data…");

  // [company] NAME — fetched announcements
  const annM = msg.match(/\[company\] (.+?) — fetched announcements/);
  if (annM) return patchStep(state, annM[1].trim(), "Fetching announcements…");

  // [company] NAME — wrote companies/...json
  const wroteM = msg.match(/\[company\] (.+?) — wrote companies/);
  if (wroteM) return patchStep(state, wroteM[1].trim(), "Saving data…");

  // [company] NAME — score: 52.3/100 (Accumulate)
  const scoreM = msg.match(/\[company\] (.+?) — score: ([\d.]+)\/100 \((.+?)\)/);
  if (scoreM) {
    return patchCompany(state, scoreM[1].trim(), (c) => ({
      ...c,
      done: true,
      step: "Done",
      score: scoreM[2],
      classification: scoreM[3],
    }));
  }

  // [company] NAME — not found, skipping
  const skipM = msg.match(/\[company\] (.+?) — not found/);
  if (skipM) {
    return patchCompany(state, skipM[1].trim(), (c) => ({
      ...c,
      failed: true,
      step: "Not found on Screener",
    }));
  }

  // [company] NAME — ERROR: ...
  const errM = msg.match(/\[company\] (.+?) — ERROR: (.+)/);
  if (errM) {
    return patchCompany(state, errM[1].trim(), (c) => ({
      ...c,
      failed: true,
      step: errM[2].slice(0, 80),
    }));
  }

  return state;
}

function patchStep(state: LogState, name: string, step: string): LogState {
  return patchCompany(state, name, (c) => ({ ...c, step }));
}

function patchCompany(
  state: LogState,
  name: string,
  fn: (c: CompanyEntry) => CompanyEntry
): LogState {
  return {
    ...state,
    companies: state.companies.map((c) => (c.name === name ? fn(c) : c)),
  };
}

// ---------------------------------------------------------------------------
// Classification colour
// ---------------------------------------------------------------------------

function classColor(c: string): string {
  switch (c.toLowerCase()) {
    case "exceptional":   return "text-accent font-semibold";
    case "invest-grade":  return "text-accent";
    case "accumulate":    return "text-warn";
    case "watchlist":     return "text-chalk-300/70";
    default:              return "text-bad";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SectorRefreshButton({ sectorSlug }: { sectorSlug: string }) {
  const [uiState, setUiState] = useState<UIState>("idle");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [logState, setLogState] = useState<LogState>(initLog());
  const [errorMsg, setErrorMsg] = useState("");

  const logRef   = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router   = useRouter();

  // Auto-focus password field when dialog opens
  useEffect(() => {
    if (uiState === "password") inputRef.current?.focus();
  }, [uiState]);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logState]);

  async function startRefresh() {
    setUiState("running");
    setLogState(initLog());
    setErrorMsg("");

    try {
      const res = await fetch(
        `/api/refresh?sector=${encodeURIComponent(sectorSlug)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        }
      );
      if (!res.body) throw new Error("No response body");

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const chunk of lines) {
          const msg = chunk.replace(/^data:\s*/m, "").trim();
          if (!msg) continue;

          if (msg === "DONE") {
            setUiState("done");
            setTimeout(() => router.refresh(), 1000);
            return;
          }

          if (msg.startsWith("ERROR:")) {
            setErrorMsg(msg.replace(/^ERROR:\s*/, ""));
            setUiState("error");
            return;
          }

          setLogState((prev) => parseLogMessage(msg, prev));
        }
      }
    } catch (err) {
      setErrorMsg(String(err));
      setUiState("error");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password) startRefresh();
  }

  function reset() {
    setUiState("idle");
    setPassword("");
    setShowPw(false);
    setLogState(initLog());
    setErrorMsg("");
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const doneCompanies = logState.companies.filter((c) => c.done).length;
  const totalKnown    = logState.totalCompanies || logState.companies.length;

  return (
    <div className="flex flex-col items-end gap-0 w-full">

      {/* ── Trigger button ── */}
      {(uiState === "idle" || uiState === "password") && (
        <button
          onClick={() => uiState === "idle" && setUiState("password")}
          className={clsx(
            "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
            uiState === "idle"
              ? "border-ink-600 bg-ink-800/60 text-chalk-300 hover:border-accent/40 hover:text-accent"
              : "border-accent/40 bg-accent/10 text-accent cursor-default"
          )}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh sector
        </button>
      )}

      {/* Running / done / error button */}
      {(uiState === "running" || uiState === "done" || uiState === "error") && (
        <button
          disabled={uiState === "running"}
          onClick={uiState !== "running" ? reset : undefined}
          className={clsx(
            "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
            uiState === "running" && "border-ink-600 bg-ink-800/60 text-chalk-300/60 cursor-not-allowed",
            uiState === "done"    && "border-accent/40 bg-accent/10 text-accent",
            uiState === "error"   && "border-bad/40 bg-bad/10 text-bad"
          )}
        >
          {uiState === "running" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {uiState === "done"    && <CheckCircle className="h-3.5 w-3.5" />}
          {uiState === "error"   && <XCircle className="h-3.5 w-3.5" />}
          {uiState === "running" ? "Fetching…" : uiState === "done" ? "Done — dismiss" : "Failed — dismiss"}
        </button>
      )}

      {/* ── Password dialog ── */}
      {uiState === "password" && (
        <div className="mt-2 w-full rounded-xl border border-ink-700/60 bg-ink-900/90 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="h-3.5 w-3.5 text-chalk-300/50" />
            <span className="text-xs font-semibold text-chalk-300">
              Password required to refresh
            </span>
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                className="w-full rounded-lg border border-ink-700/60 bg-ink-800 px-3 py-2 pr-8 text-xs text-chalk-100 placeholder-chalk-300/30 focus:outline-none focus:border-accent/50 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-chalk-300/40 hover:text-chalk-300"
                tabIndex={-1}
              >
                {showPw ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
            </div>
            <button
              type="submit"
              disabled={!password}
              className="rounded-lg border border-accent/30 bg-accent/15 px-3 py-2 text-xs font-medium text-accent hover:bg-accent/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Go
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-ink-700/60 px-3 py-2 text-xs text-chalk-300/50 hover:text-chalk-300 transition-colors"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* ── Live log panel ── */}
      {(uiState === "running" || uiState === "done" || uiState === "error") && (
        <div className="mt-2 w-full rounded-xl border border-ink-700/60 bg-ink-950 overflow-hidden">

          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink-700/40 bg-ink-900/60">
            <div className="flex items-center gap-2.5 min-w-0">
              {uiState === "running" && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-accent shrink-0" />
              )}
              {uiState === "done" && (
                <CheckCircle className="h-3.5 w-3.5 text-accent shrink-0" />
              )}
              {uiState === "error" && (
                <XCircle className="h-3.5 w-3.5 text-bad shrink-0" />
              )}
              <span className="text-xs font-semibold text-chalk-100 truncate">
                {logState.sectorName || sectorSlug}
              </span>
            </div>
            {totalKnown > 0 && (
              <span className="num text-xs text-chalk-300/50 shrink-0 ml-2">
                {doneCompanies}/{totalKnown}
              </span>
            )}
          </div>

          {/* Scrollable log body */}
          <div
            ref={logRef}
            className="max-h-72 overflow-y-auto scrollbar-thin divide-y divide-ink-700/20"
          >
            {/* Auth row */}
            <div className="flex items-center gap-3 px-4 py-2.5">
              {logState.authenticated ? (
                <CheckCircle className="h-3.5 w-3.5 text-accent shrink-0" />
              ) : (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-chalk-300/30 shrink-0" />
              )}
              <span
                className={clsx(
                  "text-xs",
                  logState.authenticated ? "text-chalk-300" : "text-chalk-300/40"
                )}
              >
                {logState.authenticated ? "Authenticated" : "Authenticating…"}
              </span>
            </div>

            {/* Company rows */}
            {logState.companies.map((co, i) => (
              <div key={i} className="px-4 py-2.5 flex items-start gap-3">
                {/* Status icon */}
                <div className="mt-0.5 shrink-0">
                  {co.done ? (
                    <CheckCircle className="h-3.5 w-3.5 text-accent" />
                  ) : co.failed ? (
                    <XCircle className="h-3.5 w-3.5 text-bad" />
                  ) : (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                  )}
                </div>

                {/* Company details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-chalk-100 truncate">
                      {co.name}
                    </span>
                    <span className="num text-xs text-chalk-300/40 shrink-0">
                      {co.number}/{co.total || "?"}
                    </span>
                  </div>

                  {co.done ? (
                    <div className="mt-0.5 flex items-baseline gap-1.5 text-xs">
                      <span className="num font-semibold text-chalk-50">{co.score}</span>
                      <span className="text-chalk-300/40">/100</span>
                      <span className={clsx("ml-1", classColor(co.classification ?? ""))}>
                        {co.classification}
                      </span>
                    </div>
                  ) : (
                    <p className="mt-0.5 text-xs text-chalk-300/50 truncate">
                      {co.step}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Final status */}
            {uiState === "done" && (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-accent/5">
                <CheckCircle className="h-3.5 w-3.5 text-accent shrink-0" />
                <span className="text-xs text-accent">
                  Sector updated — reloading page…
                </span>
              </div>
            )}
            {uiState === "error" && (
              <div className="flex items-start gap-3 px-4 py-2.5 bg-bad/5">
                <XCircle className="h-3.5 w-3.5 text-bad shrink-0 mt-0.5" />
                <span className="text-xs text-bad break-all">{errorMsg}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
