"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Check, Loader2, Building2 } from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import type { CompanyIndexEntry } from "@/lib/data";

interface Props {
  count: number;
  max: number;
  /** Set of `${sector_slug}/${company_slug}` keys already on the watchlist. */
  watchedKeys: string[];
}

export function WatchlistAddBox({ count, max, watchedKeys }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [companies, setCompanies] = useState<CompanyIndexEntry[]>([]);
  const [fetched, setFetched] = useState(false);
  // Track keys added during this session so rows flip to "Added" instantly.
  const [addedKeys, setAddedKeys] = useState<Set<string>>(new Set(watchedKeys));
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isFull = count + addedKeys.size - watchedKeys.length >= max;

  // Fetch the company index once on first focus / keystroke
  useEffect(() => {
    if (fetched) return;
    fetch("/api/search")
      .then((r) => r.json())
      .then((d) => {
        setCompanies(d.companies ?? []);
        setFetched(true);
      })
      .catch(() => setFetched(true));
  }, [fetched]);

  const needle = q.trim().toLowerCase();
  const results = useMemo<CompanyIndexEntry[]>(() => {
    if (!needle) return [];
    return companies
      .filter(
        (c) =>
          c.name.toLowerCase().includes(needle) ||
          c.ticker.toLowerCase().includes(needle),
      )
      .slice(0, 8);
  }, [needle, companies]);

  async function add(c: CompanyIndexEntry) {
    const key = `${c.sector_slug}/${c.slug}`;
    if (addedKeys.has(key) || pendingKey) return;
    if (isFull) {
      toast.error(`Watchlist full (${max}/${max}) — remove a stock to add another.`);
      return;
    }
    setPendingKey(key);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sector_slug: c.sector_slug,
          company_slug: c.slug,
          company_ticker: c.ticker,
          company_name: c.name,
        }),
      });
      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error?.message ?? `Watchlist full (${max}/${max}).`);
        return;
      }
      if (res.ok) {
        setAddedKeys((prev) => new Set(prev).add(key));
        toast.success(`Added ${c.ticker} to watchlist`);
        router.refresh();
      } else {
        toast.error("Couldn't add - try again");
      }
    } catch {
      toast.error("Network error - check your connection");
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <div className="mb-8">
      <div
        className="flex items-center gap-3 rounded-2xl border px-4 py-1 border-subtle glass"
      >
        <Search className="h-4 w-4 shrink-0 text-accent/60" />
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Add a stock — search by company or ticker…"
          className="flex-1 bg-transparent py-3 text-sm text-chalk-100 placeholder:text-chalk-300/50 outline-none focus-visible:outline-none"
        />
        <span className="num shrink-0 text-[11px] text-chalk-300/45">
          {count} / {max}
        </span>
      </div>

      {isFull && (
        <p className="mt-2 px-1 text-[11px] text-warn">
          Watchlist full — remove a stock to add another.
        </p>
      )}

      {results.length > 0 && (
        <ul className="mt-2 rounded-2xl border border-subtle glass overflow-hidden">
          {results.map((c) => {
            const key = `${c.sector_slug}/${c.slug}`;
            const already = addedKeys.has(key);
            const pending = pendingKey === key;
            return (
              <li
                key={key}
                className="flex items-center justify-between gap-4 px-4 py-3 border-b last:border-0 border-[rgb(var(--chalk-100)_/_0.05)]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
                    style={{ background: "rgb(var(--ink-800))", color: "rgb(var(--chalk-300)/0.7)" }}
                  >
                    <Building2 className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-chalk-50 text-sm truncate">{c.name}</p>
                    <p className="text-[11px] text-chalk-300/60 mt-0.5 num">
                      {c.ticker} · {c.sector_name} · {c.final_score.toFixed(1)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => add(c)}
                  disabled={already || pending || (isFull && !already)}
                  className={clsx(
                    "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all shrink-0",
                    already
                      ? "border-good/30 bg-good/10 text-good cursor-default"
                      : "border-accent/25 bg-accent/10 text-accent hover:bg-accent/15",
                    (pending || (isFull && !already)) && "opacity-60 cursor-not-allowed",
                  )}
                >
                  {pending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : already ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  {already ? "Added" : "Add"}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {needle && fetched && results.length === 0 && (
        <p className="mt-2 px-1 text-[11px] text-chalk-300/40">
          No companies match “{q}”.
        </p>
      )}
    </div>
  );
}
