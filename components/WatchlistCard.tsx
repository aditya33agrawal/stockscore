"use client";

import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import { ArrowRight, ChevronDown, ChevronUp, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { classificationLabel, classificationStyle, formatDate } from "@/lib/format";
import type { ScoreDiff } from "@/lib/watchlist-diff";

interface Props {
  sectorSlug:  string;
  companySlug: string;
  companyName: string | null;
  ticker:      string | null;
  createdAt:   string;
  diff:        ScoreDiff | null;
  /** Score at time of snapshot (for subtitle) */
  snapshotScore:    number | null;
  snapshotTakenAt:  string | null;
}

// ─── Score delta badge ───────────────────────────────────────────────────────

function ScoreDeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  const abs = Math.abs(delta);

  if (abs < 1) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg border border-chalk-300/15 bg-chalk-300/5 px-2 py-0.5 text-[11px] font-semibold text-chalk-300/60">
        <Minus className="h-3 w-3" />
        ≈ no change
      </span>
    );
  }
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg border border-good/25 bg-good/10 px-2 py-0.5 text-[11px] font-semibold text-good">
        <TrendingUp className="h-3 w-3" />
        +{delta} pts
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-bad/25 bg-bad/10 px-2 py-0.5 text-[11px] font-semibold text-bad">
      <TrendingDown className="h-3 w-3" />
      {delta} pts
    </span>
  );
}

// ─── Classification change pill ──────────────────────────────────────────────

function ClassificationChange({
  before,
  after,
  changed,
}: {
  before: string | null;
  after: string | null;
  changed: boolean;
}) {
  if (!changed || !before || !after) {
    if (!after) return null;
    return (
      <span className={clsx("inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-semibold", classificationStyle(after))}>
        {classificationLabel(after)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold">
      <span className={clsx("rounded-lg border px-1.5 py-0.5", classificationStyle(before))}>
        {classificationLabel(before)}
      </span>
      <ArrowRight className="h-2.5 w-2.5 text-chalk-300/40" />
      <span className={clsx("rounded-lg border px-1.5 py-0.5", classificationStyle(after))}>
        {classificationLabel(after)}
      </span>
    </span>
  );
}

// ─── Metric row ──────────────────────────────────────────────────────────────

function MetricRow({
  label,
  unit,
  before,
  after,
  delta,
  higherIsBetter,
}: {
  label: string;
  unit: string;
  before: number | null;
  after: number | null;
  delta: number | null;
  higherIsBetter: boolean;
}) {
  const fmt = (v: number | null, u: string) => {
    if (v === null) return "-";
    if (u === "₹") return `₹${v.toLocaleString("en-IN")}`;
    if (u === "%") return `${v}%`;
    if (u === "x") return `${v}x`;
    return String(v);
  };

  // Determine if the change is improving, worsening, or neutral
  let sentiment: "good" | "bad" | "neutral" = "neutral";
  if (delta !== null && Math.abs(delta) >= 0.01) {
    const improving = higherIsBetter ? delta > 0 : delta < 0;
    sentiment = improving ? "good" : "bad";
  }

  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-[12px]">
      <span className="w-20 shrink-0 text-chalk-300/50">{label}</span>
      <span className="num text-chalk-300/70">{fmt(before, unit)}</span>
      <ArrowRight className="h-3 w-3 shrink-0 text-chalk-300/25" />
      <span className={clsx(
        "num font-semibold",
        sentiment === "good"    ? "text-good" :
        sentiment === "bad"     ? "text-bad"     :
                                  "text-chalk-50"
      )}>
        {fmt(after, unit)}
      </span>
      <span className={clsx(
        "ml-auto num text-[11px]",
        sentiment === "good" ? "text-good/70" :
        sentiment === "bad"  ? "text-bad/70"     :
                               "text-chalk-300/40"
      )}>
        {delta !== null && Math.abs(delta) >= 0.01
          ? `${delta > 0 ? "+" : ""}${delta}${unit === "₹" ? "" : unit}`
          : ""}
      </span>
    </div>
  );
}

// ─── CMP row (special because we show % change) ──────────────────────────────

function CmpRow({ before, after, delta, pctDelta }: {
  before: number | null;
  after: number | null;
  delta: number | null;
  pctDelta: number | null;
}) {
  const fmt = (v: number | null) =>
    v === null ? "-" : `₹${v.toLocaleString("en-IN")}`;

  const isPositive = pctDelta !== null && pctDelta > 0;
  const isNegative = pctDelta !== null && pctDelta < 0;

  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-[12px]">
      <span className="w-20 shrink-0 text-chalk-300/50">CMP</span>
      <span className="num text-chalk-300/70">{fmt(before)}</span>
      <ArrowRight className="h-3 w-3 shrink-0 text-chalk-300/25" />
      <span className="num font-semibold text-chalk-50">{fmt(after)}</span>
      {pctDelta !== null && (
        <span className={clsx(
          "ml-auto num text-[11px] font-semibold",
          isPositive ? "text-good/80" :
          isNegative ? "text-bad/80"     :
                       "text-chalk-300/40"
        )}>
          {pctDelta > 0 ? "+" : ""}{pctDelta}%
        </span>
      )}
      {delta !== null && pctDelta === null && (
        <span className="ml-auto num text-[11px] text-chalk-300/40">
          {delta > 0 ? "+" : ""}₹{delta}
        </span>
      )}
    </div>
  );
}

// ─── Main card ───────────────────────────────────────────────────────────────

export function WatchlistCard({
  sectorSlug,
  companySlug,
  companyName,
  ticker,
  createdAt,
  diff,
  snapshotScore,
  snapshotTakenAt,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const hasDiff = diff !== null;
  const hasDetails =
    hasDiff &&
    (diff.metricDeltas.length > 0 ||
      diff.categoryDeltas.length > 0 ||
      diff.cmpDelta !== null);

  return (
    <li>
      <div className="glass border-subtle rounded-2xl overflow-hidden transition-all hover:border-[rgb(var(--accent)_/_0.15)]">
        {/* ── Top row: name + badges ─────────────────────────────────────── */}
        <Link
          href={`/sector/${sectorSlug}/${companySlug}`}
          className="flex items-start justify-between gap-3 px-5 pt-4 pb-3"
        >
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-chalk-50 truncate">
              {companyName ?? companySlug}
            </p>
            {ticker && (
              <p className="text-xs text-chalk-300/50 num mt-0.5">{ticker}</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {/* Score delta */}
            {hasDiff && <ScoreDeltaBadge delta={diff.scoreDelta} />}

            {/* Classification (shows change if changed, current tier otherwise) */}
            {hasDiff && (
              <ClassificationChange
                before={diff.classificationBefore}
                after={diff.classificationAfter}
                changed={diff.classificationChanged}
              />
            )}

            {/* "New Data" chip */}
            {hasDiff && diff.hasNewData && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-accent/20 bg-accent/8 px-2 py-0.5 text-[10px] font-semibold text-accent/80">
                <Sparkles className="h-2.5 w-2.5" />
                New data
              </span>
            )}

            {/* Arrow */}
            <ArrowRight className="h-4 w-4 text-chalk-300/30 mt-0.5" />
          </div>
        </Link>

        {/* ── Snapshot subtitle ────────────────────────────────────────────── */}
        <div className="px-5 pb-3 flex items-center justify-between">
          <p className="text-[11px] text-chalk-300/40">
            {hasDiff && snapshotScore !== null
              ? <>
                  {diff.isBackfilled ? "Baseline set" : "Added"}{" "}
                  {snapshotTakenAt ? formatDate(snapshotTakenAt) : formatDate(createdAt)}
                  {" · "}score was{" "}
                  <span className="num text-chalk-300/60 font-semibold">{snapshotScore}</span>
                </>
              : <>Added {formatDate(createdAt)}</>
            }
          </p>

          {/* Expand / collapse details toggle */}
          {hasDetails && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-1 text-[11px] text-chalk-300/50 hover:text-accent transition-colors"
            >
              {expanded ? (
                <>Hide details <ChevronUp className="h-3 w-3" /></>
              ) : (
                <>Show details <ChevronDown className="h-3 w-3" /></>
              )}
            </button>
          )}
        </div>

        {/* ── Expandable details section ───────────────────────────────────── */}
        {hasDetails && expanded && (
          <div className="px-5 pb-4 border-t border-[rgb(var(--chalk-100)_/_0.05)]">
            <div className="pt-3 space-y-0">
              {/* CMP */}
              {(diff!.cmpBefore !== null || diff!.cmpAfter !== null) && (
                <CmpRow
                  before={diff!.cmpBefore}
                  after={diff!.cmpAfter}
                  delta={diff!.cmpDelta}
                  pctDelta={diff!.cmpPctDelta}
                />
              )}

              {/* Key metrics */}
              {diff!.metricDeltas.map((m) => (
                <MetricRow
                  key={m.label}
                  label={m.label}
                  unit={m.unit}
                  before={m.before}
                  after={m.after}
                  delta={m.delta}
                  higherIsBetter={m.higherIsBetter}
                />
              ))}

              {/* Category deltas - only show changed ones */}
              {diff!.categoryDeltas.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[rgb(var(--chalk-100)_/_0.05)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-chalk-300/35 mb-2">
                    Score breakdown changes
                  </p>
                  <div className="grid grid-cols-2 gap-x-6">
                    {diff!.categoryDeltas.map((c) => (
                      <div key={c.name} className="flex items-center justify-between py-1 text-[11px]">
                        <span className="text-chalk-300/50 truncate">{c.name}</span>
                        <span className={clsx(
                          "num font-semibold ml-2",
                          c.delta > 0 ? "text-good" :
                          c.delta < 0 ? "text-bad"     :
                                        "text-chalk-300/50"
                        )}>
                          {c.delta > 0 ? "+" : ""}{c.delta}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </li>
  );
}
