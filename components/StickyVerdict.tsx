"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { scoreColor, classificationLabel, classificationStyle } from "@/lib/format";
import { trendChipStyle } from "@/components/CompanyHero";

interface Props {
  name: string;
  ticker: string;
  score: number;
  classification?: string;
  trend?: { label: string; trend: string; strength: string };
  /** ID of the hero element - sticky bar hides when hero is visible */
  heroId?: string;
}

export function StickyVerdict({ name, ticker, score, classification, trend, heroId = "overview" }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById(heroId);
    if (!hero) return;

    const obs = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 },
    );
    obs.observe(hero);
    return () => obs.disconnect();
  }, [heroId]);

  if (!visible) return null;

  return (
    // Lives only in the right gutter (mirrors CompanySideNav on the left) so it
    // never overlaps the centered max-w-5xl/6xl article column on any viewport
    // the gutter exists at.
    <div className="hidden xl:flex fixed top-24 right-4 z-30 flex-col items-center gap-1 rounded-xl border border-[rgb(var(--chalk-100)_/_0.1)] bg-ink-950/90 backdrop-blur-xl shadow-lg px-3 py-2.5 w-28">
      <p className="num text-lg font-bold leading-none tracking-tight text-chalk-50">{ticker}</p>
      <span className={clsx("num text-sm font-bold leading-none", scoreColor(score))}>
        {score.toFixed(1)}
      </span>
      <div className="flex flex-col items-stretch gap-1 mt-1 w-full">
        {classification && (
          <span
            className={clsx(
              "block w-full text-center rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
              classificationStyle(classification),
            )}
          >
            {classificationLabel(classification)}
          </span>
        )}
        {trend && (
          <span
            className={clsx(
              "block w-full text-center rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
              trendChipStyle(trend.trend, trend.strength),
            )}
          >
            {trend.label}
          </span>
        )}
      </div>
      <a
        href="#overview"
        className="text-[10px] text-chalk-300/40 hover:text-accent transition-colors mt-1"
      >
        ↑ Top
      </a>
    </div>
  );
}
