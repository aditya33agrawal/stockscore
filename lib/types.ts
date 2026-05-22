export interface ScoreItem {
  label: string;
  points: number;
  detail: string;
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

export interface TopItem {
  label: string;
  category: string;
  points: number;
}

export interface CompanyRaw {
  pe?: number;
  industry_pe?: number;
  pbv?: number;
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
}

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
  strengths: TopItem[];
  weaknesses: TopItem[];
  raw: CompanyRaw;
}

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
