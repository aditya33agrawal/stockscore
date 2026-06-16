"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowRight, Building2 } from "lucide-react";
import type { CompanyIndexEntry } from "@/lib/data";

type SectorRow = {
  slug: string;
  name: string;
  description: string;
  companies_count: number;
  top_company?: string;
  top_ticker?: string;
  top_score?: number;
  has_data: boolean;
};

type SortKey = "name" | "top_score" | "companies_count";
type Filter = "all" | "scored" | "unscored";

export function SectorsBrowser({
  sectors,
  companies,
}: {
  sectors: SectorRow[];
  companies: CompanyIndexEntry[];
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("top_score");
  const [filter, setFilter] = useState<Filter>("all");

  const matchedCompanies = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return companies
      .filter(
        (c) =>
          c.name.toLowerCase().includes(needle) ||
          c.ticker.toLowerCase().includes(needle),
      )
      .sort((a, b) => b.final_score - a.final_score)
      .slice(0, 12);
  }, [q, companies]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let rows = sectors;
    if (filter === "scored") rows = rows.filter((s) => s.has_data);
    if (filter === "unscored") rows = rows.filter((s) => !s.has_data);
    if (needle) {
      rows = rows.filter(
        (s) =>
          s.name.toLowerCase().includes(needle) ||
          s.description.toLowerCase().includes(needle),
      );
    }
    rows = [...rows].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "companies_count") return b.companies_count - a.companies_count;
      return (b.top_score ?? -1) - (a.top_score ?? -1);
    });
    return rows;
  }, [sectors, q, sort, filter]);

  return (
    <div>
      {/* Search + filters */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-chalk-300" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by sector or stock - e.g., Banks, HDFC, TCS…"
            className="w-full rounded-xl border border-ink-700/80 bg-ink-900/80 py-3 pl-14 pr-4 text-chalk-50 placeholder:text-chalk-300/60 outline-none focus:border-accent/50"
          />
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <FilterChips
            label="Show"
            value={filter}
            options={[
              ["all", "All"],
              ["scored", "Scored"],
              ["unscored", "No data"],
            ]}
            onChange={(v) => setFilter(v as Filter)}
          />
          <FilterChips
            label="Sort"
            value={sort}
            options={[
              ["top_score", "Top score"],
              ["companies_count", "Most companies"],
              ["name", "A–Z"],
            ]}
            onChange={(v) => setSort(v as SortKey)}
          />
        </div>
      </div>

      {/* Stock results when searching */}
      {q.trim() && matchedCompanies.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">
            Matching stocks
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {matchedCompanies.map((c) => (
              <Link
                key={`${c.sector_slug}-${c.slug}`}
                href={`/sector/${c.sector_slug}/${c.slug}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-ink-700/60 bg-ink-900/40 px-4 py-3 hover:border-accent/40 transition-colors"
              >
                <div className="min-w-0 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-chalk-300 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-chalk-50 truncate">{c.name}</p>
                    <p className="text-xs text-chalk-300/70 truncate">
                      {c.ticker} · {c.sector_name}
                    </p>
                  </div>
                </div>
                <span className="num text-sm text-accent shrink-0">
                  {c.final_score.toFixed(1)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Sectors grid */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">
          Sectors ({visible.length})
        </h2>
        {visible.length === 0 ? (
          <p className="text-sm text-chalk-300/70">No sectors match.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((s) => (
              <Link
                key={s.slug}
                href={`/sector/${s.slug}`}
                className="rounded-xl border border-ink-700/60 bg-ink-900/40 hover:border-accent/40 hover:bg-ink-900 transition-colors p-5 flex flex-col"
              >
                <div className="flex items-baseline justify-between">
                  <h3 className={`font-semibold ${s.has_data ? "text-chalk-50" : "text-chalk-300"}`}>
                    {s.name}
                  </h3>
                  <span className="num text-xs text-chalk-300/60">
                    {s.companies_count}
                  </span>
                </div>
                <p className={`mt-2 text-sm line-clamp-2 ${s.has_data ? "text-chalk-300" : "text-chalk-300/50"}`}>
                  {s.description}
                </p>
                <div className="mt-4 pt-4 border-t border-ink-700/40 flex items-center justify-between text-xs">
                  {s.top_company ? (
                    <>
                      <span className="text-chalk-300/70">Top pick</span>
                      <span className="num text-chalk-100">
                        {s.top_ticker ?? s.top_company}{" "}
                        <span className="text-accent">
                          {s.top_score?.toFixed(1)}
                        </span>
                      </span>
                    </>
                  ) : (
                    <span className="text-chalk-300/30">No data yet</span>
                  )}
                </div>
                <span className="mt-3 inline-flex items-center text-xs text-chalk-300 hover:text-accent">
                  View sector <ArrowRight className="h-3 w-3 ml-1" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChips<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-ink-700/60 bg-ink-900/40 p-1">
      <span className="px-2 text-chalk-300/70">{label}:</span>
      {options.map(([v, l]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`rounded-md px-2.5 py-1 transition-colors ${
            value === v
              ? "bg-accent/15 text-accent"
              : "text-chalk-300 hover:text-chalk-50"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
