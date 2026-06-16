/**
 * lib/scoring/sector_stats.ts - Sector-level priors for relative scoring.
 *
 * When live peer data has fewer than 8 companies, we fall back to these priors
 * computed from pre-study historical screener.in data (2021–2023 period).
 * Every usage is logged in assumptions[] with source and n_used.
 */

export interface SectorStat {
  metric: "opm" | "roce" | "pe" | "de";
  sector: string;
  median: number;
  p25: number;
  p75: number;
  n_used: number;
  source: "live" | "prior";
}

/**
 * Historical sector medians (pre-study period priors).
 * Format: { [sectorSlug]: { opm, roce, pe, de } }
 * All values are percentages or ratios as appropriate.
 */
const SECTOR_PRIORS: Record<
  string,
  { opm: number; roce: number; pe: number; de: number }
> = {
  "oil-gas": { opm: 5, roce: 12, pe: 10, de: 0.6 },
  "information-technology": { opm: 22, roce: 30, pe: 28, de: 0.1 },
  pharmaceuticals: { opm: 18, roce: 18, pe: 30, de: 0.3 },
  automobile: { opm: 10, roce: 14, pe: 22, de: 0.5 },
  "renewable-energy": { opm: 40, roce: 10, pe: 35, de: 2.0 },
  fmcg: { opm: 18, roce: 35, pe: 50, de: 0.1 },
  telecom: { opm: 35, roce: 8, pe: 30, de: 1.5 },
  "metal-mining": { opm: 14, roce: 14, pe: 12, de: 0.8 },
  power: { opm: 22, roce: 10, pe: 18, de: 1.5 },
  "capital-goods": { opm: 12, roce: 18, pe: 35, de: 0.3 },
  cement: { opm: 16, roce: 14, pe: 22, de: 0.4 },
  "consumer-durables": { opm: 10, roce: 20, pe: 40, de: 0.2 },
  "real-estate": { opm: 28, roce: 12, pe: 30, de: 1.0 },
  aviation: { opm: 8, roce: 8, pe: 20, de: 2.5 },
  chemicals: { opm: 18, roce: 18, pe: 30, de: 0.3 },
  "fertilizers-agrochemicals": { opm: 12, roce: 12, pe: 15, de: 0.6 },
  "textiles-apparel": { opm: 12, roce: 12, pe: 18, de: 0.5 },
  logistics: { opm: 10, roce: 12, pe: 25, de: 0.4 },
  railways: { opm: 20, roce: 14, pe: 22, de: 0.5 },
  defence: { opm: 14, roce: 18, pe: 40, de: 0.2 },
  "shipping-ports": { opm: 30, roce: 12, pe: 15, de: 0.8 },
  "media-entertainment": { opm: 20, roce: 16, pe: 25, de: 0.2 },
  retail: { opm: 8, roce: 18, pe: 55, de: 0.3 },
  "internet-ecommerce": { opm: 5, roce: 5, pe: 60, de: 0.2 },
  education: { opm: 15, roce: 14, pe: 30, de: 0.2 },
  "healthcare-hospitals": { opm: 15, roce: 16, pe: 40, de: 0.4 },
  "quick-commerce-food": { opm: 3, roce: 5, pe: 80, de: 0.1 },
  "data-centers-digital": { opm: 20, roce: 15, pe: 35, de: 0.5 },
  "semiconductors-electronics": { opm: 8, roce: 14, pe: 30, de: 0.2 },
  "water-waste-management": { opm: 15, roce: 14, pe: 28, de: 0.4 },
  "hospitality-tourism": { opm: 20, roce: 12, pe: 35, de: 0.5 },
  "gaming-gambling": { opm: 15, roce: 14, pe: 30, de: 0.1 },
  "construction-infra": { opm: 10, roce: 12, pe: 20, de: 0.8 },
  "cables-electricals": { opm: 10, roce: 18, pe: 30, de: 0.3 },
  paints: { opm: 16, roce: 25, pe: 55, de: 0.1 },
  "jewellery-luxury": { opm: 8, roce: 18, pe: 40, de: 0.3 },
  "paper-packaging": { opm: 12, roce: 10, pe: 14, de: 0.8 },
  "sugar-distilleries": { opm: 10, roce: 10, pe: 12, de: 0.8 },
  "marine-fisheries": { opm: 8, roce: 10, pe: 14, de: 0.4 },
  "printing-publishing": { opm: 12, roce: 10, pe: 15, de: 0.3 },
  "space-technology": { opm: 12, roce: 14, pe: 35, de: 0.2 },
  _default: { opm: 14, roce: 15, pe: 25, de: 0.5 },
};

/** Get the OPM prior for a sector slug. Falls back to "_default". */
export function getSectorOpmPrior(sectorSlug: string): number {
  return (SECTOR_PRIORS[sectorSlug] ?? SECTOR_PRIORS["_default"]).opm;
}

/** Get all priors for a sector slug. Falls back to "_default". */
export function getSectorPriors(sectorSlug: string) {
  return SECTOR_PRIORS[sectorSlug] ?? SECTOR_PRIORS["_default"];
}

import { winsorize } from "./primitives";

/**
 * Compute a live sector stat from a list of values.
 * If n < 8, returns prior instead and notes the source.
 */
export function computeSectorStat(
  metric: SectorStat["metric"],
  sectorSlug: string,
  values: number[],
): SectorStat {
  const clean = values.filter((v) => isFinite(v) && v > 0);
  const winsorized = winsorize(clean, 0.05, 0.95);

  if (winsorized.length >= 8) {
    const sorted = [...winsorized].sort((a, b) => a - b);
    const n = sorted.length;
    const median =
      n % 2
        ? sorted[Math.floor(n / 2)]
        : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
    const p25 = sorted[Math.floor(n * 0.25)];
    const p75 = sorted[Math.floor(n * 0.75)];
    return {
      metric,
      sector: sectorSlug,
      median,
      p25,
      p75,
      n_used: n,
      source: "live",
    };
  }

  // Fall back to priors
  const prior = getSectorPriors(sectorSlug);
  const v = prior[metric] ?? getSectorPriors("_default")[metric];
  return {
    metric,
    sector: sectorSlug,
    median: v,
    p25: v * 0.7,
    p75: v * 1.3,
    n_used: 0,
    source: "prior",
  };
}
