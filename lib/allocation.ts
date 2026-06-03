export type Goal =
  | "retirement"
  | "wealth_creation"
  | "house"
  | "child_education"
  | "short_term_parking";

export type RiskPref = "conservative" | "balanced" | "aggressive";

export interface AllocationInput {
  age: number;
  horizon: number;
  goal: Goal;
  expectedReturn: number;
  riskPref: RiskPref;
  monthly?: number;
}

export interface Slice {
  key: string;
  label: string;
  pct: number;
  rationale: string;
  instrument: string;
  color: string;
}

export interface AllocationResult {
  riskScore: number;
  riskLabel: string;
  realistic: boolean;
  modelReturn: number;
  slices: Slice[];
}

// Ink Wash categorical ramp — muted slate / violet / taupe / amber tones that
// harmonize with the cream canvas. Deliberately avoids green/red (reserved for
// value verdicts) so allocation segments are never mistaken for sentiment.
const COLORS: Record<string, string> = {
  stocks: "#6D8196",      // slate (brand)
  equity_mf: "#56687C",   // deep slate
  us: "#8499AE",          // light slate
  debt_mf: "#7C7196",     // muted violet
  bonds: "#9A8C7C",       // warm taupe
  gold: "#B8862B",        // amber
  real_estate: "#A8755E", // terracotta
};

export function riskLabel(r: number): string {
  if (r <= 25) return "Very Low";
  if (r <= 45) return "Low";
  if (r <= 60) return "Moderate";
  if (r <= 80) return "High";
  return "Very High";
}

export function recommendAllocation(i: AllocationInput): AllocationResult {
  const age = Math.max(1, Math.min(100, i.age));
  const horizon = Math.max(0, Math.min(50, i.horizon));

  // Base: classic (100 - age) for equity tolerance
  let r = 100 - age;

  // Horizon multiplier
  const hMult =
    horizon < 3 ? 0.5 : horizon < 7 ? 0.85 : horizon < 15 ? 1.05 : 1.15;
  r = r * hMult;

  // Goal modifier
  const goalAdj: Record<Goal, number> = {
    short_term_parking: -35,
    house: horizon < 5 ? -20 : -5,
    child_education: horizon < 8 ? -10 : 5,
    retirement: horizon < 10 ? -10 : 5,
    wealth_creation: 8,
  };
  r += goalAdj[i.goal];

  // Preference
  r += i.riskPref === "conservative" ? -15 : i.riskPref === "aggressive" ? 15 : 0;

  r = Math.round(Math.max(5, Math.min(95, r)));

  // Build allocation
  const eqTotal = r;
  const debtTotal = (100 - r) * 0.7;
  const goldPct = Math.min(15, 5 + (100 - r) * 0.1);
  const realEstatePct = horizon >= 7 ? Math.min(15, horizon * 1.0) : 0;

  const usPct = r >= 40 ? r * 0.1 : 0;
  const directStocksPct = r >= 50 ? Math.min(r * 0.3, 25) : 0;
  const equityMfPct = Math.max(0, eqTotal - usPct - directStocksPct);

  const debtMfPct = debtTotal * 0.6;
  const bondsPct = debtTotal * 0.4;

  const raw: Slice[] = [
    {
      key: "stocks",
      label: "Indian Stocks (Direct)",
      pct: directStocksPct,
      rationale: "High-conviction picks from Stockscore for alpha.",
      instrument: "Direct equities · 8–15 names",
      color: COLORS.stocks,
    },
    {
      key: "equity_mf",
      label: "Equity Mutual Funds",
      pct: equityMfPct,
      rationale: "Core diversified equity exposure with low maintenance.",
      instrument: "Flexi-cap / large-cap index funds",
      color: COLORS.equity_mf,
    },
    {
      key: "us",
      label: "US Market",
      pct: usPct,
      rationale: "Geographic diversification & access to global tech.",
      instrument: "Nasdaq 100 / S&P 500 ETFs (FoF)",
      color: COLORS.us,
    },
    {
      key: "debt_mf",
      label: "Debt Mutual Funds",
      pct: debtMfPct,
      rationale: "Stable, liquid fixed income.",
      instrument: "Short-duration / corporate bond funds",
      color: COLORS.debt_mf,
    },
    {
      key: "bonds",
      label: "Bonds",
      pct: bondsPct,
      rationale: "Direct yield with predictable cashflows.",
      instrument: "G-sec / AAA corp · 3–5 yr ladder",
      color: COLORS.bonds,
    },
    {
      key: "gold",
      label: "Gold & Silver",
      pct: goldPct,
      rationale: "Inflation hedge & crisis insurance.",
      instrument: "Sovereign Gold Bonds, Silver ETFs",
      color: COLORS.gold,
    },
    {
      key: "real_estate",
      label: "Real Estate",
      pct: realEstatePct,
      rationale:
        horizon >= 7
          ? "Long-horizon compounding & rental yield."
          : "Skipped — horizon too short for illiquid assets.",
      instrument: "REITs (liquid) / physical (long-term)",
      color: COLORS.real_estate,
    },
  ];

  // Normalize to 100
  const sum = raw.reduce((s, x) => s + x.pct, 0) || 1;
  const slices = raw.map((s) => ({
    ...s,
    pct: Math.round((s.pct / sum) * 1000) / 10,
  }));

  // Model expected return: rough blended estimate
  const expByKey: Record<string, number> = {
    stocks: 15,
    equity_mf: 12,
    us: 11,
    debt_mf: 7,
    bonds: 7.5,
    gold: 8,
    real_estate: 9,
  };
  const modelReturn =
    Math.round(
      slices.reduce((s, x) => s + (x.pct / 100) * (expByKey[x.key] ?? 0), 0) *
        10,
    ) / 10;
  const realistic = i.expectedReturn <= modelReturn + 1.5;

  return {
    riskScore: r,
    riskLabel: riskLabel(r),
    realistic,
    modelReturn,
    slices,
  };
}
