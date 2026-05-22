"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, CheckCircle, XCircle, Loader2 } from "lucide-react";
import clsx from "clsx";

type State = "idle" | "running" | "done" | "error";

export function RefreshButton() {
  const [state, setState] = useState<State>("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  async function handleRefresh() {
    setState("running");
    setLogs([]);
    setOpen(true);

    try {
      const res = await fetch("/api/refresh", { method: "POST" });
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

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
            setState("done");
            setLogs((l) => [...l, "✓ Pipeline complete — refreshing page …"]);
            setTimeout(() => router.refresh(), 800);
            return;
          }

          if (msg.startsWith("ERROR:")) {
            setState("error");
            setLogs((l) => [...l, msg]);
            return;
          }

          setLogs((l) => {
            const next = [...l, msg].slice(-60);
            setTimeout(() => {
              if (logRef.current)
                logRef.current.scrollTop = logRef.current.scrollHeight;
            }, 10);
            return next;
          });
        }
      }
    } catch (err) {
      setState("error");
      setLogs((l) => [...l, `ERROR: ${String(err)}`]);
    }
  }

  const icon =
    state === "idle" ? <RefreshCw className="h-4 w-4" />
    : state === "running" ? <Loader2 className="h-4 w-4 animate-spin" />
    : state === "done" ? <CheckCircle className="h-4 w-4 text-accent" />
    : <XCircle className="h-4 w-4 text-bad" />;

  const label =
    state === "idle" ? "Refresh Data"
    : state === "running" ? "Scraping …"
    : state === "done" ? "Done"
    : "Failed";

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleRefresh}
        disabled={state === "running"}
        className={clsx(
          "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
          state === "idle"
            ? "border-accent/40 bg-accent/10 text-accent hover:bg-accent/20"
            : state === "running"
            ? "border-ink-600 bg-ink-800 text-chalk-300 cursor-not-allowed"
            : state === "done"
            ? "border-accent/40 bg-accent/10 text-accent"
            : "border-bad/40 bg-bad/10 text-bad"
        )}
      >
        {icon}
        {label}
      </button>

      {open && logs.length > 0 && (
        <div className="w-full max-w-lg">
          <div
            ref={logRef}
            className="h-48 overflow-y-auto rounded-lg border border-ink-700/60 bg-ink-950 p-3 font-mono text-xs text-chalk-300 space-y-0.5"
          >
            {logs.map((line, i) => (
              <div
                key={i}
                className={clsx(
                  line.startsWith("ERROR") ? "text-bad"
                  : line.startsWith("✓") ? "text-accent"
                  : "text-chalk-300"
                )}
              >
                {line}
              </div>
            ))}
          </div>
          <button
            onClick={() => { setState("idle"); setOpen(false); setLogs([]); }}
            className="mt-1 text-xs text-chalk-300/50 hover:text-chalk-300"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
