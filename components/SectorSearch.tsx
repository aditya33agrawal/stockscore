"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, TrendingUp, Building2 } from "lucide-react";
import type { SectorIndexEntry } from "@/lib/types";
import type { CompanyIndexEntry } from "@/lib/data";

type Result =
  | { kind: "sector";  sector:  SectorIndexEntry }
  | { kind: "company"; company: CompanyIndexEntry };

export function SectorSearch({
  sectors,
  companies = [],
}: {
  sectors: SectorIndexEntry[];
  companies?: CompanyIndexEntry[];
}) {
  const [q, setQ]           = useState("");
  const [focused, setFocused] = useState(false);
  const ref      = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setFocused(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setFocused(false); inputRef.current?.blur(); }
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
      .filter((s) => s.name.toLowerCase().includes(needle) || s.description.toLowerCase().includes(needle))
      .map((s) => ({ kind: "sector", sector: s }));
    const cMatches: Result[] = companies
      .filter((c) => c.name.toLowerCase().includes(needle) || c.ticker.toLowerCase().includes(needle))
      .map((c) => ({ kind: "company", company: c }));
    return [...sMatches, ...cMatches].slice(0, 8);
  }, [needle, sectors, companies]);

  const showDropdown = focused && needle.length > 0;

  return (
    <div ref={ref} className="relative mx-auto max-w-xl">
      {/* Input */}
      <div
        className="flex items-center gap-3 rounded-2xl border px-5 py-1 transition-all duration-200"
        style={{
          background: "#fff",
          borderColor: focused ? "rgb(var(--accent)/0.4)" : "rgb(var(--ink-700))",
        }}
      >
        <Search className="h-4 w-4 shrink-0 text-accent/50" />
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Search sector or company…"
          className="flex-1 bg-transparent py-3 text-[15px] text-chalk-100 placeholder:text-chalk-300/50 outline-none focus-visible:outline-none"
        />
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          className="absolute left-0 right-0 top-full mt-2 z-50 max-h-[420px] overflow-auto scrollbar-thin rounded-2xl border"
          style={{
            background: "#fff",
            borderColor: "rgb(var(--ink-700))",
            boxShadow: "0 20px 60px rgba(74,74,74,0.15)",
          }}
        >
          {results.length === 0 ? (
            <div className="px-5 py-6 text-sm text-chalk-300/60">
              No match for <span className="text-chalk-100 font-medium">&ldquo;{q}&rdquo;</span>
            </div>
          ) : (
            <ul>
              {results.map((r, i) =>
                r.kind === "sector" ? (
                  <li key={`s-${r.sector.slug}-${i}`}>
                    <Link
                      href={`/sector/${r.sector.slug}`}
                      onClick={() => { setFocused(false); setQ(""); }}
                      className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-accent/[0.05] transition-colors border-b last:border-0"
                      style={{ borderColor: "rgb(var(--ink-700)/0.5)" }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent shrink-0">
                          <TrendingUp className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-chalk-50 text-sm truncate">{r.sector.name}</p>
                          <p className="text-[11px] text-chalk-300/60 mt-0.5">Sector · {r.sector.companies_count} companies</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-accent/60 shrink-0">Sector →</span>
                    </Link>
                  </li>
                ) : (
                  <li key={`c-${r.company.ticker}-${i}`}>
                    <Link
                      href={`/sector/${r.company.sector_slug}/${r.company.slug}`}
                      onClick={() => { setFocused(false); setQ(""); }}
                      className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-accent/[0.05] transition-colors border-b last:border-0"
                      style={{ borderColor: "rgb(var(--ink-700)/0.5)" }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
                          style={{ background: "rgb(var(--ink-800))", color: "rgb(var(--chalk-300)/0.7)" }}
                        >
                          <Building2 className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-chalk-50 text-sm truncate">{r.company.name}</p>
                          <p className="text-[11px] text-chalk-300/60 mt-0.5 num">{r.company.ticker} · {r.company.sector_name}</p>
                        </div>
                      </div>
                      <span className="num text-sm font-bold text-accent shrink-0">
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
