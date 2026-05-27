"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, TrendingUp, Building2 } from "lucide-react";
import type { SectorIndexEntry } from "@/lib/types";
import type { CompanyIndexEntry } from "@/lib/data";

type Result =
  | { kind: "sector"; sector: SectorIndexEntry }
  | { kind: "company"; company: CompanyIndexEntry };

export function SectorSearch({
  sectors,
  companies = [],
}: {
  sectors: SectorIndexEntry[];
  companies?: CompanyIndexEntry[];
}) {
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFocused(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const needle = q.trim().toLowerCase();

  const results = useMemo<Result[]>(() => {
    if (!needle) return [];
    const sMatches: Result[] = sectors
      .filter(
        (s) =>
          s.name.toLowerCase().includes(needle) ||
          s.description.toLowerCase().includes(needle),
      )
      .map((s) => ({ kind: "sector", sector: s }));
    const cMatches: Result[] = companies
      .filter(
        (c) =>
          c.name.toLowerCase().includes(needle) ||
          c.ticker.toLowerCase().includes(needle),
      )
      .map((c) => ({ kind: "company", company: c }));
    return [...sMatches, ...cMatches].slice(0, 8);
  }, [needle, sectors, companies]);

  const showDropdown = focused && needle.length > 0;

  return (
    <div ref={ref} className="relative mx-auto max-w-2xl">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-chalk-300" />
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Search a sector or stock — e.g., Private Banks, HDFC…"
          className="w-full rounded-xl border border-ink-700/80 bg-ink-900/80 py-4 pl-12 pr-4 text-chalk-50 placeholder:text-chalk-300/60 outline-none ring-0 transition focus:border-accent/50 focus:bg-ink-900 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.08)]"
        />
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 max-h-[420px] overflow-auto scrollbar-thin rounded-xl border border-ink-700/80 bg-ink-900 shadow-2xl shadow-black/60">
          {results.length === 0 ? (
            <div className="px-5 py-6 text-sm text-chalk-300">
              No match for <span className="text-chalk-50">&quot;{q}&quot;</span>.
            </div>
          ) : (
            <ul className="divide-y divide-ink-700/40">
              {results.map((r, i) =>
                r.kind === "sector" ? (
                  <li key={`s-${r.sector.slug}-${i}`}>
                    <Link
                      href={`/sector/${r.sector.slug}`}
                      onClick={() => { setFocused(false); setQ(""); }}
                      className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-ink-800/60 transition-colors"
                    >
                      <div className="min-w-0 flex items-center gap-3">
                        <TrendingUp className="h-4 w-4 text-accent shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium text-chalk-50">
                            {r.sector.name}
                          </div>
                          <p className="text-xs text-chalk-300/80 line-clamp-1">
                            Sector · {r.sector.companies_count} companies
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                ) : (
                  <li key={`c-${r.company.ticker}-${i}`}>
                    <Link
                      href={`/sector/${r.company.sector_slug}/${r.company.slug}`}
                      onClick={() => { setFocused(false); setQ(""); }}
                      className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-ink-800/60 transition-colors"
                    >
                      <div className="min-w-0 flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-chalk-300 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium text-chalk-50 truncate">
                            {r.company.name}
                          </div>
                          <p className="text-xs text-chalk-300/80">
                            {r.company.ticker} · {r.company.sector_name}
                          </p>
                        </div>
                      </div>
                      <span className="num text-xs text-accent shrink-0">
                        {r.company.final_score.toFixed(1)}
                      </span>
                    </Link>
                  </li>
                ),
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
