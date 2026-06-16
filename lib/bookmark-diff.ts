/**
 * bookmark-diff.ts
 *
 * Pure utility for computing the score / metric diff between a bookmark snapshot
 * (captured when the user saved the company) and the current live company data.
 *
 * No DB access - purely functional so it is easy to test and reuse.
 */

// ─── Snapshot shape (stored as JSONB in bookmarks.score_snapshot) ────────────

export interface BookmarkSnapshot {
  final_score: number;
  classification: string; // e.g. "Accumulate"
  cmp: number;
  score_version?: string;
  raw: {
    pe?: number | null;
    roe?: number | null;
    roce?: number | null;
    opm?: number | null;
    debt_to_equity?: number | null;
    pledged_pct?: number | null;
    sales_5y_cagr?: number | null;
    profit_5y_cagr?: number | null;
  };
  /** Per-category earned points for granular diff */
  categories: Array<{ name: string; earned: number; max: number }>;
}

// ─── Diff result ─────────────────────────────────────────────────────────────

export interface MetricDelta {
  label: string;
  unit: "%" | "x" | "₹" | "";
  /** Higher is better: true means ▲ = green, false means ▲ = red */
  higherIsBetter: boolean;
  before: number | null;
  after: number | null;
  delta: number | null;
}

export interface CategoryDelta {
  name: string;
  before: number;
  after: number;
  delta: number;
}

export interface ScoreDiff {
  /** current.final_score − snapshot.final_score  (null if either missing) */
  scoreDelta: number | null;
  classificationChanged: boolean;
  classificationBefore: string | null;
  classificationAfter: string | null;
  /** CMP at time of snapshot */
  cmpBefore: number | null;
  /** CMP in current data */
  cmpAfter: number | null;
  /** Absolute ₹ CMP change */
  cmpDelta: number | null;
  /** % CMP change relative to snapshot */
  cmpPctDelta: number | null;
  metricDeltas: MetricDelta[];
  categoryDeltas: CategoryDelta[];
  /**
   * True when the company data was refreshed AFTER the bookmark was created,
   * meaning there is genuinely newer information available.
   */
  hasNewData: boolean;
  /**
   * True when the snapshot was written as a backfill baseline rather than at
   * the actual moment of bookmarking - so delta is relative to "when baseline
   * was set", not "when user originally bookmarked".
   */
  isBackfilled: boolean;
}

// ─── Metric definitions ──────────────────────────────────────────────────────

interface MetricDef {
  label: string;
  key: keyof BookmarkSnapshot["raw"];
  unit: MetricDelta["unit"];
  higherIsBetter: boolean;
}

const METRIC_DEFS: MetricDef[] = [
  { label: "ROE", key: "roe", unit: "%", higherIsBetter: true },
  { label: "ROCE", key: "roce", unit: "%", higherIsBetter: true },
  { label: "OPM", key: "opm", unit: "%", higherIsBetter: true },
  { label: "D/E", key: "debt_to_equity", unit: "x", higherIsBetter: false },
  { label: "P/E", key: "pe", unit: "x", higherIsBetter: false },
  { label: "Pledged %", key: "pledged_pct", unit: "%", higherIsBetter: false },
  {
    label: "Sales CAGR",
    key: "sales_5y_cagr",
    unit: "%",
    higherIsBetter: true,
  },
];

// ─── Main function ────────────────────────────────────────────────────────────

export function computeScoreDiff(
  snapshot: BookmarkSnapshot,
  current: BookmarkSnapshot,
  bookmarkedAt: Date,
  currentRefreshedAt: Date,
  isBackfilled: boolean,
): ScoreDiff {
  // Score delta
  const scoreDelta =
    typeof current.final_score === "number" &&
    typeof snapshot.final_score === "number"
      ? parseFloat((current.final_score - snapshot.final_score).toFixed(1))
      : null;

  // Classification change
  const classificationBefore = snapshot.classification ?? null;
  const classificationAfter = current.classification ?? null;
  const classificationChanged =
    !!classificationBefore &&
    !!classificationAfter &&
    classificationBefore.toLowerCase() !== classificationAfter.toLowerCase();

  // CMP delta
  const cmpBefore = snapshot.cmp ?? null;
  const cmpAfter = current.cmp ?? null;
  const cmpDelta =
    cmpBefore !== null && cmpAfter !== null
      ? parseFloat((cmpAfter - cmpBefore).toFixed(2))
      : null;
  const cmpPctDelta =
    cmpBefore !== null && cmpAfter !== null && cmpBefore !== 0
      ? parseFloat((((cmpAfter - cmpBefore) / cmpBefore) * 100).toFixed(1))
      : null;

  // Metric deltas
  const metricDeltas: MetricDelta[] = METRIC_DEFS.map((def) => {
    const before = snapshot.raw[def.key] ?? null;
    const after = current.raw[def.key] ?? null;
    const delta =
      before !== null && after !== null
        ? parseFloat((after - before).toFixed(2))
        : null;
    return {
      label: def.label,
      unit: def.unit,
      higherIsBetter: def.higherIsBetter,
      before,
      after,
      delta,
    };
  }).filter((m) => m.before !== null || m.after !== null);

  // Category deltas - match by name
  const currentCatMap = new Map(current.categories.map((c) => [c.name, c]));
  const categoryDeltas: CategoryDelta[] = snapshot.categories
    .map((sc) => {
      const cc = currentCatMap.get(sc.name);
      if (!cc) return null;
      const delta = parseFloat((cc.earned - sc.earned).toFixed(1));
      return { name: sc.name, before: sc.earned, after: cc.earned, delta };
    })
    .filter((x): x is CategoryDelta => x !== null && x.delta !== 0);

  // Has new data: current company was refreshed AFTER the bookmark was created
  const hasNewData = currentRefreshedAt > bookmarkedAt;

  return {
    scoreDelta,
    classificationChanged,
    classificationBefore,
    classificationAfter,
    cmpBefore,
    cmpAfter,
    cmpDelta,
    cmpPctDelta,
    metricDeltas,
    categoryDeltas,
    hasNewData,
    isBackfilled,
  };
}

// ─── Helper: build a BookmarkSnapshot from a Company object ──────────────────

import type { Company } from "@/lib/types";

export function snapshotFromCompany(company: Company): BookmarkSnapshot {
  return {
    final_score: company.final_score,
    classification: company.classification ?? "",
    cmp: company.cmp,
    score_version: company.score_version,
    raw: {
      pe: company.raw.pe ?? null,
      roe: company.raw.roe ?? null,
      roce: company.raw.roce ?? null,
      opm: company.raw.opm ?? null,
      debt_to_equity: company.raw.debt_to_equity ?? null,
      pledged_pct: company.raw.pledged_pct ?? null,
      sales_5y_cagr: company.raw.sales_5y_cagr ?? null,
      profit_5y_cagr: company.raw.profit_5y_cagr ?? null,
    },
    categories: company.categories.map((c) => ({
      name: c.name,
      earned: c.earned,
      max: c.max,
    })),
  };
}
