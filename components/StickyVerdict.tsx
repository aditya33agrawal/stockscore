"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { scoreColor, classificationLabel, classificationStyle } from "@/lib/format";

interface Props {
  name: string;
  score: number;
  classification?: string;
  /** ID of the hero element - sticky bar hides when hero is visible */
  heroId?: string;
}

export function StickyVerdict({ name, score, classification, heroId = "overview" }: Props) {
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
    <div className="fixed top-16 right-1 sm:right-3 z-30 flex flex-col items-center gap-1.5 rounded-b-xl border border-t-0 border-[rgb(var(--chalk-100)_/_0.1)] bg-ink-950/90 backdrop-blur-xl shadow-lg px-4 py-2.5 max-w-[200px]">
      <span className={clsx("num text-base font-bold leading-none", scoreColor(score))}>
        {score.toFixed(1)}
      </span>
      {classification && (
        <span
          className={clsx(
            "shrink-0 rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
            classificationStyle(classification),
          )}
        >
          {classificationLabel(classification)}
        </span>
      )}
      <p className="font-semibold text-chalk-50 text-xs text-center leading-tight line-clamp-2">{name}</p>
      <a
        href="#overview"
        className="text-[11px] text-chalk-300/40 hover:text-accent transition-colors mt-0.5"
      >
        ↑ Top
      </a>
    </div>
  );
}
