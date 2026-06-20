// ─── Score breakdown ──────────────────────────────────────────────────────────

export interface ScoreItem {
  label: string;
  points: number;
  detail: string;
  /** Short tooltip explaining the formula or economic rationale for this factor. */
  tooltip?: string;
}

export interface CategoryScore {
  name: string;
  earned: number;
  max: number;
  summary?: string;
  items: ScoreItem[];
}

export interface Penalty {
  label: string;
  points: number;
  detail: string;
}

export interface Bonus {
  label: string;
  points: number;
  detail: string;
}

export interface TopItem {
  label: string;
  category: string;
  points: number;
}

/**
 * Per-factor breakdown row - tidy long-format data for the UI factor-detail
 * tab and for paper reproducibility / ablation analysis (Figure 1).
 */
export interface FactorRow {
  factor: string;
  category: string;
  raw_value: number | null;
  score_01: number; // 0..1 before weight is applied
  weight: number;
  points: number;
  source: "absolute" | "relative" | "trend";
  notes?: string; // e.g. "scored vs sector prior, n=4"
}

// ─── Raw company metrics (stored in DB, used by evaluators) ──────────────────

export interface CompanyRaw {
  pe?: number;
  industry_pe?: number;
  pbv?: number;
  book_value?: number;
  roe?: number;
  roce?: number;
  opm?: number;
  debt_to_equity?: number;
  current_ratio?: number;
  dividend_yield?: number;
  pledged_pct?: number;
  market_cap?: number;
  sales_5y_cagr?: number;
  profit_5y_cagr?: number;
  dma50?: number;
  dma200?: number;
  high52w?: number;
  low52w?: number;
  stock_1y_cagr?: number;
  stock_3y_cagr?: number;
  intrinsic_value?: number;
  peg?: number;
}

// ─── Company (v2 - extends v1 fields, all additions optional for backwards compat) ─

export interface Company {
  slug: string;
  name: string;
  ticker: string;
  cmp: number;
  final_score: number;
  raw_total: number;
  rank: number;
  classification?: string;
  assumptions?: string[];
  categories: CategoryScore[];
  penalties: Penalty[];
  /** Bonuses applied on top of raw category total. */
  bonuses?: Bonus[];
  strengths: TopItem[];
  weaknesses: TopItem[];
  raw: CompanyRaw;

  // ── v2 additions ─────────────────────────────────────────────────────────
  score_version?: "v2.0";
  /** Two-signal trend regime from scorer (DMA stack + 52w position). */
  regime?: "uptrend" | "sideways" | "downtrend";
  /** Company's rank percentile among live peers (0..1). Only when peers ≥ 3. */
  peer_percentile?: number;
  /** Freshness multipliers applied to quality and quarterly categories. */
  freshness_multipliers?: { quarterly: number; annual: number };
  /** Long-format per-factor breakdown - Figure 1 in paper. */
  factor_breakdown?: FactorRow[];
}

// ─── Sector ──────────────────────────────────────────────────────────────────

export interface SectorStats {
  median_pe?: number;
  median_roce?: number;
  median_opm?: number;
  median_de?: number;
  median_dividend_yield?: number;
}

export interface SectorData {
  slug: string;
  name: string;
  refreshed_at: string;
  companies_count: number;
  description: string;
  analyst_note?: string;
  sector_stats: SectorStats;
  companies: Company[];
}

export interface SectorIndexEntry {
  slug: string;
  name: string;
  companies_count: number;
  refreshed_at: string;
  description: string;
  top_company?: string;
  top_ticker?: string;
  top_score?: number;
}
