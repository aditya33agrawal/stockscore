"use client";

import { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import type { RefreshSummary, Phase } from "@/lib/refresh/run";

export type RunState = "idle" | "running" | "done" | "error" | "interrupted";

interface RefreshRunBody {
  phases: Phase[];
  sectors?: string[];
  force: boolean;
}

interface RefreshRunState {
  runState: RunState;
  rawLines: string[];
  summary: RefreshSummary | null;
  errorMsg: string;
  startRun: (body: RefreshRunBody) => void;
  reset: () => void;
}

const STORAGE_KEY = "ss_admin_refresh_run_v1";

const RefreshRunCtx = createContext<RefreshRunState | null>(null);

// Mounted once in app/admin/layout.tsx (which persists across client-side
// navigation between /admin tabs) so the live SSE log and its eventual
// summary survive switching tabs mid-run instead of resetting to blank.
export function RefreshRunProvider({ children }: { children: React.ReactNode }) {
  const [runState, setRunState] = useState<RunState>("idle");
  const [rawLines, setRawLines] = useState<string[]>([]);
  const [summary, setSummary] = useState<RefreshSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const hydrated = useRef(false);

  // A full page reload kills the provider too - hydrate the last snapshot
  // from sessionStorage so the console doesn't just go blank after one.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const snap = JSON.parse(raw) as {
        runState: RunState;
        rawLines: string[];
        summary: RefreshSummary | null;
        errorMsg: string;
      };
      setRawLines(snap.rawLines ?? []);
      setSummary(snap.summary ?? null);
      setErrorMsg(snap.errorMsg ?? "");
      // A "running" snapshot from before the reload means the SSE connection
      // died with the old page - the run may still finish server-side, but
      // there is no live stream to it anymore, so don't claim it's running.
      setRunState(snap.runState === "running" ? "interrupted" : (snap.runState ?? "idle"));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ runState, rawLines, summary, errorMsg }));
    } catch {
      // ignore (e.g. storage disabled)
    }
  }, [runState, rawLines, summary, errorMsg]);

  const startRun = useCallback((body: RefreshRunBody) => {
    setRunState("running");
    setRawLines([]);
    setSummary(null);
    setErrorMsg("");

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    (async () => {
      try {
        const res = await fetch("/api/admin/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          signal: ctrl.signal,
          body: JSON.stringify(body),
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
    })();
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setRunState("idle");
    setRawLines([]);
    setSummary(null);
    setErrorMsg("");
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return (
    <RefreshRunCtx.Provider value={{ runState, rawLines, summary, errorMsg, startRun, reset }}>
      {children}
    </RefreshRunCtx.Provider>
  );
}

export function useRefreshRun() {
  const ctx = useContext(RefreshRunCtx);
  if (!ctx) throw new Error("useRefreshRun must be used within RefreshRunProvider");
  return ctx;
}
