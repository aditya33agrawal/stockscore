"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, TrendingUp } from "lucide-react";
import type { SectorIndexEntry } from "@/lib/types";
import { formatDate } from "@/lib/format";

export function SectorSearch({ sectors }: { sectors: SectorIndexEntry[] }) {
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return sectors;
    return sectors.filter(
      (s) =>
        s.name.toLowerCase().includes(needle) ||
        s.description.toLowerCase().includes(needle),
    );
  }, [q, sectors]);

  return (
    <div ref={ref} className="relative mx-auto max-w-2xl">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-chalk-300" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Enter a sector — e.g., Oil & Refining, Private Banks…"
          className="w-full rounded-xl border border-ink-700/80 bg-ink-900/80 py-4 pl-12 pr-4 text-chalk-50 placeholder:text-chalk-300/60 outline-none ring-0 transition focus:border-accent/50 focus:bg-ink-900 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.08)]"
        />
      </div>

      {focused && (
        <div className="absolute left-0 right-0 top-full mt-2 z-30 max-h-[420px] overflow-auto scrollbar-thin rounded-xl border border-ink-700/80 bg-ink-900 shadow-2xl shadow-black/40">
          {matches.length === 0 ? (
            <div className="px-5 py-6 text-sm text-chalk-300">
              No sector matches <span className="text-chalk-50">"{q}"</span> yet.
              I'm adding new sectors regularly —{" "}
              <a
                href="mailto:aditya33agrawal@gmail.com"
                className="text-accent hover:underline"
              >
                email me
              </a>{" "}
              and I'll prioritise it.
            </div>
          ) : (
            <ul className="divide-y divide-ink-700/40">
              {matches.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/sector/${s.slug}`}
                    className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-ink-800/60 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-accent shrink-0" />
                        <span className="font-medium text-chalk-50">
                          {s.name}
                        </span>
                      </div>
                      <p className="text-xs text-chalk-300/80 mt-0.5 line-clamp-1">
                        {s.description}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs num text-chalk-300">
                        {s.companies_count} companies
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-chalk-300/60 mt-0.5">
                        {formatDate(s.refreshed_at)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
