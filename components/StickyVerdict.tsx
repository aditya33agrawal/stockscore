"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { scoreColor, classificationLabel, classificationStyle } from "@/lib/format";

interface Props {
  name: string;
  score: number;
  classification?: string;
  /** ID of the hero element — sticky bar hides when hero is visible */
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
    <div className="fixed top-0 left-0 right-0 z-40 border-b border-[rgb(var(--chalk-100)_/_0.1)] bg-ink-950/90 backdrop-blur-xl shadow-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 flex items-center justify-between h-11 gap-4">
        <p className="font-semibold text-chalk-50 text-sm truncate">{name}</p>
        <div className="flex items-center gap-2 shrink-0">
          <span className={clsx("num text-sm font-bold", scoreColor(score))}>
            {score.toFixed(1)}
          </span>
          {classification && (
            <span
              className={clsx(
                "hidden sm:inline-block rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                classificationStyle(classification),
              )}
            >
              {classificationLabel(classification)}
            </span>
          )}
          <a
            href="#overview"
            className="text-xs text-chalk-300/40 hover:text-accent transition-colors ml-2"
          >
            ↑ Top
          </a>
        </div>
      </div>
    </div>
  );
}
