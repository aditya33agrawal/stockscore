"use client";

import { useMemo, useState } from "react";
import type { MetricEntry, Category, CategoryMeta } from "@/lib/learn/types";
import MetricCard from "./MetricCard";

export default function LearnControls({
  metrics,
  categories,
}: {
  metrics: MetricEntry[];
  categories: CategoryMeta[];
}) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<Category | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return metrics.filter((m) => {
      if (activeCat !== "all" && m.category !== activeCat) return false;
      if (!q) return true;
      const hay = [
        m.term,
        m.tagline,
        m.inOneSentence,
        ...(m.alsoCalled ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [metrics, query, activeCat]);

  // Available categories (filtered to ones that have entries)
  const availableCats = useMemo(() => {
    const ids = new Set(metrics.map((m) => m.category));
    return categories.filter((c) => ids.has(c.id));
  }, [metrics, categories]);

  const grouped = useMemo(() => {
    const map = new Map<Category, MetricEntry[]>();
    for (const m of filtered) {
      if (!map.has(m.category)) map.set(m.category, []);
      map.get(m.category)!.push(m);
    }
    return map;
  }, [filtered]);

  return (
    <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
      {/* Sidebar */}
      <aside className="lg:sticky lg:top-20 lg:self-start mb-6 lg:mb-0">
        <div className="mb-4">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search metrics…"
            className="w-full rounded-md border border-ink-700/60 bg-ink-900 px-3 py-2 text-sm text-chalk-100 placeholder:text-chalk-300/40 focus:border-accent/60 focus:outline-none"
          />
        </div>
        <nav className="space-y-1">
          <button
            onClick={() => setActiveCat("all")}
            className={
              "block w-full text-left rounded-md px-3 py-1.5 text-xs transition-colors " +
              (activeCat === "all"
                ? "bg-accent/10 text-accent"
                : "text-chalk-300 hover:bg-ink-800")
            }
          >
            All ({metrics.length})
          </button>
          {availableCats.map((c) => {
            const count = metrics.filter((m) => m.category === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={
                  "block w-full text-left rounded-md px-3 py-1.5 text-xs transition-colors " +
                  (activeCat === c.id
                    ? "bg-accent/10 text-accent"
                    : "text-chalk-300 hover:bg-ink-800")
                }
              >
                {c.label} ({count})
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Cards */}
      <div className="space-y-10">
        {filtered.length === 0 && (
          <p className="text-sm text-chalk-300/60 py-10 text-center">
            No metrics match your search.
          </p>
        )}
        {Array.from(grouped.entries()).map(([catId, items]) => {
          const cat = categories.find((c) => c.id === catId);
          return (
            <div key={catId} id={catId} className="scroll-mt-20">
              {cat && (
                <div className="mb-4 border-b border-ink-700/60 pb-2">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-accent">
                    {cat.label}
                  </h2>
                  <p className="text-sm text-chalk-300/70 mt-0.5">{cat.blurb}</p>
                </div>
              )}
              <div className="space-y-6">
                {items.map((m) => (
                  <MetricCard key={m.id} m={m} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
