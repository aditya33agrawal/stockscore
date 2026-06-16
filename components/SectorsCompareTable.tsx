"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { SectorRow } from "@/lib/sector-scraper/types";
import { HeaderHelp } from "./HeaderHelp";

interface Props {
  rows: SectorRow[];
  refreshedAt: string | null;
}

type SortKey = keyof Pick<
  SectorRow,
  | "name"
  | "companyCount"
  | "totalMarketCap"
  | "medianMarketCap"
  | "medianPE"
  | "wtdAvgSalesGrowth"
  | "wtdAvgOPM"
  | "wtdAvgROCE"
  | "median1YReturn"
>;

const COLUMNS: { key: SortKey; label: string; hint: string; anchor: string; numeric?: boolean }[] = [
  { key: "name", label: "Industry", hint: "Sector / industry name as classified by Screener.in", anchor: "" },
  { key: "companyCount", label: "Companies", hint: "Number of listed companies in this industry.", anchor: "company-count", numeric: true },
  { key: "totalMarketCap", label: "Total MCap", hint: "Sum of market caps of all companies in the industry (₹ Cr).", anchor: "market-cap", numeric: true },
  { key: "medianMarketCap", label: "Median MCap", hint: "Middle value of individual company market caps in the sector (₹ Cr). Less affected by outliers than average.", anchor: "market-cap", numeric: true },
  { key: "medianPE", label: "Median P/E", hint: "Middle P/E ratio across all companies. A high P/E means the market expects strong future growth.", anchor: "pe", numeric: true },
  { key: "wtdAvgSalesGrowth", label: "Wtd. Sales Growth", hint: "Weighted average sales growth across the industry. Weight = company's contribution to total sector revenue.", anchor: "sales-growth", numeric: true },
  { key: "wtdAvgOPM", label: "Wtd. OPM", hint: "Weighted average Operating Profit Margin. Shows how much of each rupee of revenue the industry keeps as operating profit.", anchor: "opm", numeric: true },
  { key: "wtdAvgROCE", label: "Wtd. ROCE", hint: "Weighted average Return on Capital Employed. Higher = industry earns more per rupee of capital deployed.", anchor: "roce", numeric: true },
  { key: "median1YReturn", label: "Median 1Y Return", hint: "Median 1-year stock price return across companies in the industry. Reflects recent market sentiment.", anchor: "returns", numeric: true },
];

type FilterKey = "pe_low" | "div_yield" | "roce_high";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "pe_low", label: "P/E below median" },
  { key: "roce_high", label: "ROCE > 15%" },
  { key: "div_yield", label: "OPM > 15%" },
];

function fmtNum(v: number | null, suffix = ""): string {
  if (v == null) return "-";
  if (suffix === "Cr") {
    return v >= 100000
      ? `${(v / 100000).toFixed(1)}L Cr`
      : v >= 1000
      ? `${(v / 1000).toFixed(0)}K Cr`
      : `${v} Cr`;
  }
  if (suffix === "%") return `${v.toFixed(1)}%`;
  if (suffix === "x") return `${v.toFixed(1)}x`;
  return `${v}`;
}

export function SectorsCompareTable({ rows, refreshedAt }: Props) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "totalMarketCap",
    dir: "desc",
  });
  const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set());

  const medianPE = useMemo(() => {
    const vals = rows.map((r) => r.medianPE).filter((v): v is number => v !== null).sort((a, b) => a - b);
    if (!vals.length) return null;
    return vals[Math.floor(vals.length / 2)];
  }, [rows]);

  function toggleFilter(k: FilterKey) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  const filtered = useMemo(() => {
    let data = rows;
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((r) => r.name.toLowerCase().includes(q));
    }
    if (activeFilters.has("pe_low") && medianPE !== null) {
      data = data.filter((r) => r.medianPE !== null && r.medianPE < medianPE);
    }
    if (activeFilters.has("roce_high")) {
      data = data.filter((r) => r.wtdAvgROCE !== null && r.wtdAvgROCE > 15);
    }
    if (activeFilters.has("div_yield")) {
      data = data.filter((r) => r.wtdAvgOPM !== null && r.wtdAvgOPM > 15);
    }
    return [...data].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "string" && typeof bv === "string") {
        return sort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sort.dir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [rows, search, activeFilters, sort, medianPE]);

  function handleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }
    );
  }

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
      {/* Search + filters */}
      <div className="mb-5 flex flex-wrap gap-3 items-center">
        <input
          type="search"
          placeholder="Search industry…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-ink-700/60 bg-ink-900/40 px-3 py-2 text-sm text-chalk-100 placeholder:text-chalk-300/40 focus:outline-none focus:border-accent/40 w-56"
        />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => toggleFilter(f.key)}
              className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                activeFilters.has(f.key)
                  ? "border-accent/60 bg-accent/10 text-accent"
                  : "border-ink-700/60 text-chalk-300 hover:border-accent/30"
              }`}
            >
              {f.label}
            </button>
          ))}
          {activeFilters.size > 0 && (
            <button
              onClick={() => setActiveFilters(new Set())}
              className="rounded-md border border-ink-700/30 px-3 py-1.5 text-xs text-chalk-300/50 hover:text-chalk-300 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
        {refreshedAt && (
          <span className="ml-auto text-xs text-chalk-300/40">
            Data from {new Date(refreshedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-ink-700/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-700/60 bg-ink-900/60">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:text-chalk-100 transition-colors select-none whitespace-nowrap ${
                    sort.key === col.key ? "text-chalk-100" : "text-chalk-300/60"
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.hint ? (
                      <HeaderHelp label={col.label} hint={col.hint} learnAnchor={col.anchor || undefined} />
                    ) : (
                      col.label
                    )}
                    <SortIcon col={col.key} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-8 text-center text-sm text-chalk-300/50">
                  No industries match your filters.
                </td>
              </tr>
            )}
            {filtered.map((row, i) => (
              <tr
                key={row.slug}
                className={`border-b border-ink-700/30 transition-colors hover:bg-ink-800/30 ${
                  i % 2 === 0 ? "bg-transparent" : "bg-ink-900/20"
                }`}
              >
                <td className="px-4 py-3">
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-chalk-100 hover:text-accent transition-colors font-medium"
                  >
                    {row.name}
                  </a>
                </td>
                <td className="px-4 py-3 num text-chalk-300 text-right">{row.companyCount ?? "-"}</td>
                <td className="px-4 py-3 num text-chalk-300 text-right">{fmtNum(row.totalMarketCap, "Cr")}</td>
                <td className="px-4 py-3 num text-chalk-300 text-right">{fmtNum(row.medianMarketCap, "Cr")}</td>
                <td className="px-4 py-3 num text-right">
                  <span className={row.medianPE !== null && medianPE !== null && row.medianPE < medianPE ? "text-accent" : "text-chalk-300"}>
                    {fmtNum(row.medianPE, "x")}
                  </span>
                </td>
                <td className="px-4 py-3 num text-right">
                  <span className={row.wtdAvgSalesGrowth !== null && row.wtdAvgSalesGrowth >= 10 ? "text-accent" : "text-chalk-300"}>
                    {fmtNum(row.wtdAvgSalesGrowth, "%")}
                  </span>
                </td>
                <td className="px-4 py-3 num text-right">
                  <span className={row.wtdAvgOPM !== null && row.wtdAvgOPM >= 15 ? "text-accent" : "text-chalk-300"}>
                    {fmtNum(row.wtdAvgOPM, "%")}
                  </span>
                </td>
                <td className="px-4 py-3 num text-right">
                  <span className={row.wtdAvgROCE !== null && row.wtdAvgROCE >= 15 ? "text-accent" : "text-chalk-300"}>
                    {fmtNum(row.wtdAvgROCE, "%")}
                  </span>
                </td>
                <td className="px-4 py-3 num text-right">
                  <span
                    className={
                      row.median1YReturn === null
                        ? "text-chalk-300/40"
                        : row.median1YReturn >= 0
                        ? "text-accent"
                        : "text-bad"
                    }
                  >
                    {fmtNum(row.median1YReturn, "%")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-chalk-300/40">{filtered.length} of {rows.length} industries shown</p>
    </div>
  );
}
