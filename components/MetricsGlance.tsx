"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import type { MetricCardProps } from "@/components/MetricCard";

const HERO_COUNT = 4;

interface Props {
  cards: MetricCardProps[];
}

export function MetricsGlance({ cards }: Props) {
  const [showAll, setShowAll] = useState(false);

  if (cards.length === 0) return null;

  const shown = showAll ? cards : cards.slice(0, HERO_COUNT);
  const hiddenCount = cards.length - HERO_COUNT;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
          Financials at a Glance
        </h2>
        <Link href="/learn" className="text-xs text-chalk-300/40 hover:text-accent transition-colors">
          What do these mean? →
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {shown.map((card) => (
          <MetricCard key={card.title} {...card} />
        ))}
      </div>

      {cards.length > HERO_COUNT && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="mt-4 flex items-center gap-1.5 text-xs text-chalk-300/40 hover:text-accent transition-colors"
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${showAll ? "rotate-180" : ""}`}
          />
          {showAll
            ? "Show fewer metrics"
            : `Show all ${hiddenCount} more metrics`}
        </button>
      )}
    </div>
  );
}
