"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ThumbsUp, ThumbsDown, Star, AlertTriangle, ChevronDown } from "lucide-react";
import { Tooltip } from "@/components/Tooltip";
import type { Company } from "@/lib/types";
import { pointsColor } from "@/lib/format";

const ITEM_LEARN_MAP: Record<string, string> = {
  "Current Ratio":          "/learn#current-ratio",
  "Promoter Holding Level": "/learn#promoter-holding",
  "Promoter Trend (8Q)":    "/learn#promoter-holding",
  "P/E vs Industry":        "/learn#pe",
  "Debt / Equity":          "/learn#de",
  "Return on Equity":       "/learn#roe",
  "ROCE Consistency":       "/learn#roce",
  "OPM vs Sector":          "/learn#opm",
  "Dividend Yield":         "/learn#dividend-yield",
  "CFO / PAT":              "/learn#cfo-pat",
  "Sales CAGR 5Y":          "/learn#sales-growth",
};

const ITEM_TOOLTIP_MAP: Record<string, string> = {
  "Current Ratio":          "Measures short-term liquidity - can the company pay its bills due within a year?",
  "Promoter Holding Level": "Higher promoter holding generally signals owner confidence in the company's future.",
  "Promoter Trend (8Q)":    "Whether promoters have been buying or selling over the last 8 quarters.",
  "P/E vs Industry":        "How much investors pay for ₹1 of earnings vs. sector peers - lower can mean cheaper.",
  "Debt / Equity":          "How much of the company is funded by debt vs. shareholder capital.",
  "Return on Equity":       "How much profit the company makes on every rupee of shareholders' money.",
  "ROCE Consistency":       "Return on Capital Employed across multiple years - consistency matters.",
  "OPM vs Sector":          "Operating margin vs. peers - tells you whether margins are structurally strong.",
  "Dividend Yield":         "Annual dividend as a percentage of the stock price - income for shareholders.",
  "CFO / PAT":              "Cash from operations vs. reported profit - high ratio means earnings are real cash.",
  "Sales CAGR 5Y":          "Revenue growth compounded over 5 years - is the top line growing meaningfully?",
};

interface StoryRowProps {
  label: string;
  category: string;
  points: number;
  isBonus?: boolean;
  isPenalty?: boolean;
  detail?: string;
}

function StoryRow({ label, category, points, detail }: StoryRowProps) {
  const learnHref = ITEM_LEARN_MAP[label];
  const tipText   = ITEM_TOOLTIP_MAP[label];
  return (
    <li className="flex items-start justify-between gap-3 py-2.5 border-b border-[rgb(var(--chalk-100)_/_0.05)] last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm text-chalk-100">{label}</p>
          {tipText && (
            <Tooltip content={{ body: tipText }} triggerLabel={`About ${label}`} />
          )}
          {learnHref && (
            <Link href={learnHref} className="text-[10px] text-chalk-300/30 hover:text-accent transition-colors">
              Learn →
            </Link>
          )}
        </div>
        <p className="text-xs text-chalk-300/55 mt-0.5">{detail ?? category}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="w-12 h-1 rounded-full bg-ink-700/40 overflow-hidden">
          <div
            className={clsx(
              "h-full rounded-full",
              points > 0 ? "bg-good/70" : "bg-bad/70",
            )}
            style={{ width: `${Math.min(100, Math.abs(points) * 10)}%` }}
          />
        </div>
        <span className={clsx("num text-sm font-semibold", pointsColor(points))}>
          {points > 0 ? `+${points}` : points}
        </span>
      </div>
    </li>
  );
}

interface Props {
  co: Pick<Company, "strengths" | "weaknesses" | "bonuses" | "penalties">;
}

const PREVIEW = 3;

export function StoryPanel({ co }: Props) {
  const [showAllStrengths, setShowAllStrengths] = useState(false);
  const [showAllRisks, setShowAllRisks] = useState(false);

  // Merge bonuses into strengths-like items, penalties into weakness-like items
  const allStrengths: StoryRowProps[] = [
    ...co.strengths.map((s) => ({ label: s.label, category: s.category, points: s.points })),
    ...(co.bonuses ?? []).map((b) => ({
      label: b.label,
      category: "Bonus",
      points: b.points,
      detail: b.detail,
      isBonus: true,
    })),
  ].sort((a, b) => b.points - a.points);

  const allRisks: StoryRowProps[] = [
    ...co.weaknesses.map((w) => ({ label: w.label, category: w.category, points: w.points })),
    ...co.penalties.map((p) => ({
      label: p.label,
      category: "Penalty",
      points: p.points,
      detail: p.detail,
      isPenalty: true,
    })),
  ].sort((a, b) => a.points - b.points);

  const shownStrengths = showAllStrengths ? allStrengths : allStrengths.slice(0, PREVIEW);
  const shownRisks = showAllRisks ? allRisks : allRisks.slice(0, PREVIEW);

  return (
    <section id="story" className="mb-10 grid gap-4 md:grid-cols-2 scroll-mt-24">
      {/* Strengths */}
      <div className="glass rounded-2xl border border-good/15 bg-good/[0.03] p-5">
        <div className="flex items-center gap-2 mb-4">
          <ThumbsUp className="h-4 w-4 text-good shrink-0" />
          <h3 className="font-semibold text-chalk-50">What&apos;s strong</h3>
          {co.bonuses && co.bonuses.length > 0 && (
            <span className="ml-auto flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] text-accent">
              <Star className="h-2.5 w-2.5" />
              {co.bonuses.length} bonus{co.bonuses.length > 1 ? "es" : ""}
            </span>
          )}
        </div>
        {allStrengths.length === 0 ? (
          <p className="text-xs text-chalk-300/50 italic">No notable strengths flagged.</p>
        ) : (
          <>
            <ul>
              {shownStrengths.map((s, i) => (
                <StoryRow key={i} {...s} />
              ))}
            </ul>
            {allStrengths.length > PREVIEW && (
              <button
                onClick={() => setShowAllStrengths((v) => !v)}
                className="mt-3 flex items-center gap-1 text-xs text-chalk-300/40 hover:text-accent transition-colors"
              >
                <ChevronDown
                  className={clsx("h-3.5 w-3.5 transition-transform", showAllStrengths && "rotate-180")}
                />
                {showAllStrengths
                  ? "Show less"
                  : `Show all ${allStrengths.length} strengths`}
              </button>
            )}
          </>
        )}
      </div>

      {/* Risks */}
      <div className="glass rounded-2xl border border-bad/15 bg-bad/[0.03] p-5">
        <div className="flex items-center gap-2 mb-4">
          <ThumbsDown className="h-4 w-4 text-bad shrink-0" />
          <h3 className="font-semibold text-chalk-50">What to watch</h3>
          {co.penalties.length > 0 && (
            <span className="ml-auto flex items-center gap-1 rounded-full bg-bad/10 px-2 py-0.5 text-[10px] text-bad">
              <AlertTriangle className="h-2.5 w-2.5" />
              {co.penalties.length} penalty{co.penalties.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        {allRisks.length === 0 ? (
          <p className="text-xs text-chalk-300/50 italic">No notable risks flagged.</p>
        ) : (
          <>
            <ul>
              {shownRisks.map((r, i) => (
                <StoryRow key={i} {...r} />
              ))}
            </ul>
            {allRisks.length > PREVIEW && (
              <button
                onClick={() => setShowAllRisks((v) => !v)}
                className="mt-3 flex items-center gap-1 text-xs text-chalk-300/40 hover:text-accent transition-colors"
              >
                <ChevronDown
                  className={clsx("h-3.5 w-3.5 transition-transform", showAllRisks && "rotate-180")}
                />
                {showAllRisks
                  ? "Show less"
                  : `Show all ${allRisks.length} risks`}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
