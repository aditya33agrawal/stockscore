import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { metrics } from "@/lib/learn/data";
import { CATEGORIES } from "@/lib/learn/types";
import LearnControls from "./LearnControls";

export const metadata = {
  title: "Learn the Metrics",
  description:
    "Plain-English first, methodology second. Every financial metric used in Stockscore - what it means, how it's computed, why this construction, and what traps to avoid.",
};

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          Stockscore
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-chalk-50">
          Learn the Metrics
        </h1>
        <p className="mt-4 text-chalk-300 max-w-2xl text-base leading-relaxed">
          Plain-English first. Methodology second. Every number you see on this site -
          explained from first principles, with worked examples, computation details,
          and the traps to avoid.
        </p>
      </header>

      <LearnControls metrics={metrics} categories={CATEGORIES} />

      <div className="mt-12 rounded-xl border border-ink-700/60 bg-ink-900/40 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-chalk-50">Ready to apply this?</p>
          <p className="text-xs text-chalk-300 mt-1">
            Compare sectors or dig into a specific company.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/sectors/compare"
            className="inline-flex items-center gap-1.5 rounded-md border border-ink-700/60 bg-ink-900 px-3 py-1.5 text-xs text-chalk-100 hover:bg-ink-800 transition-colors"
          >
            Compare Sectors <ArrowRight className="h-3 w-3" />
          </Link>
          <Link
            href="/sectors"
            className="inline-flex items-center gap-1.5 rounded-md border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs text-accent hover:bg-accent/20 transition-colors"
          >
            Browse Companies <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
