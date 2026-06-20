"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import clsx from "clsx";
import { scoreColor, classificationStyle, classificationLabel } from "@/lib/format";

interface Row {
  name: string;
  ticker: string;
  slug: string;
  sector_slug: string;
  sector_name: string;
  final_score: number;
  tier: string;
}

type SortKey = "final_score" | "name" | "sector_name";

const TIERS = ["Exceptional", "Invest-grade", "Accumulate", "Watchlist", "Avoid"];

export function CompaniesExplorer({ rows }: { rows: Row[] }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "final_score",
    dir: "desc",
  });
  const [activeTiers, setActiveTiers] = useState<Set<string>>(new Set());

  function toggleTier(t: string) {
    setActiveTiers((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  function handleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "final_score" ? "desc" : "asc" },
    );
  }

  const filtered = useMemo(() => {
    let data = rows;
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.ticker.toLowerCase().includes(q) ||
          r.sector_name.toLowerCase().includes(q),
      );
    }
    if (activeTiers.size > 0) {
      data = data.filter((r) => activeTiers.has(r.tier));
    }
    return [...data].sort((a, b) => {
      if (sort.key === "final_score") {
        return sort.dir === "asc" ? a.final_score - b.final_score : b.final_score - a.final_score;
      }
      const av = a[sort.key];
      const bv = b[sort.key];
      return sort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [rows, search, activeTiers, sort]);

  function SortIcon({ col }: { col: SortKey }) {
    if (sort.key !== col) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sort.dir === "asc" ? (
      <ArrowUp className="h-3 w-3 text-accent" />
    ) : (
      <ArrowDown className="h-3 w-3 text-accent" />
    );
  }

  return (
    <div>
      {/* Search + tier filters */}
      <div className="mb-5 flex flex-wrap gap-3 items-center">
        <input
          type="search"
          placeholder="Search company, ticker, or sector…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-ink-700/60 bg-ink-900/40 px-3 py-2 text-sm text-chalk-100 placeholder:text-chalk-300/40 focus:outline-none focus:border-accent/40 w-64"
        />
        <div className="flex flex-wrap gap-2">
          {TIERS.map((t) => (
            <button
              key={t}
              onClick={() => toggleTier(t)}
              className={clsx(
                "rounded-md border px-3 py-1.5 text-xs transition-colors",
                activeTiers.has(t)
                  ? classificationStyle(t)
                  : "border-ink-700/60 text-chalk-300 hover:border-accent/30",
              )}
            >
              {t}
            </button>
          ))}
          {activeTiers.size > 0 && (
            <button
              onClick={() => setActiveTiers(new Set())}
              className="rounded-md border border-ink-700/30 px-3 py-1.5 text-xs text-chalk-300/50 hover:text-chalk-300 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-ink-700/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-700/60 bg-ink-900/60">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-chalk-300/60 w-10">
                #
              </th>
              <th
                onClick={() => handleSort("name")}
                className={clsx(
                  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:text-chalk-100 transition-colors select-none",
                  sort.key === "name" ? "text-chalk-100" : "text-chalk-300/60",
                )}
              >
                <span className="inline-flex items-center gap-1.5">Company <SortIcon col="name" /></span>
              </th>
              <th
                onClick={() => handleSort("sector_name")}
                className={clsx(
                  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:text-chalk-100 transition-colors select-none whitespace-nowrap",
                  sort.key === "sector_name" ? "text-chalk-100" : "text-chalk-300/60",
                )}
              >
                <span className="inline-flex items-center gap-1.5">Sector <SortIcon col="sector_name" /></span>
              </th>
              <th
                onClick={() => handleSort("final_score")}
                className={clsx(
                  "px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider cursor-pointer hover:text-chalk-100 transition-colors select-none whitespace-nowrap",
                  sort.key === "final_score" ? "text-chalk-100" : "text-chalk-300/60",
                )}
              >
                <span className="inline-flex items-center gap-1.5 justify-end">Score <SortIcon col="final_score" /></span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-chalk-300/60">
                Tier
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-chalk-300/50">
                  No companies match your filters.
                </td>
              </tr>
            )}
            {filtered.map((row, i) => (
              <tr
                key={`${row.sector_slug}:${row.slug}`}
                className={clsx(
                  "border-b border-ink-700/30 transition-colors hover:bg-ink-800/30",
                  i % 2 === 0 ? "bg-transparent" : "bg-ink-900/20",
                )}
              >
                <td className="px-4 py-3 num text-chalk-300/40 text-xs">{i + 1}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/sector/${row.sector_slug}/${row.slug}`}
                    className="text-chalk-100 hover:text-accent transition-colors font-medium"
                  >
                    {row.name}
                  </Link>
                  <span className="num text-chalk-300/40 text-xs ml-2">{row.ticker}</span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/sector/${row.sector_slug}`}
                    className="text-chalk-300/70 hover:text-accent transition-colors text-xs"
                  >
                    {row.sector_name}
                  </Link>
                </td>
                <td className={clsx("px-4 py-3 num text-right font-semibold", scoreColor(row.final_score))}>
                  {row.final_score.toFixed(1)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={clsx(
                      "rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
                      classificationStyle(row.tier),
                    )}
                  >
                    {classificationLabel(row.tier)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-chalk-300/40">{filtered.length} of {rows.length} companies shown</p>
    </div>
  );
}
