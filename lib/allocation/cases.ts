import type { ProfileTag } from "./types";

interface CaseCtx {
  age: number;
  aggression: number;
  horizonYears: number;
  riskScore: number;
  profileTag: ProfileTag;
}

function youngAggr(ctx: CaseCtx) {
  return ctx.age <= 35 && ctx.aggression >= 55;
}
function oldConservative(ctx: CaseCtx) {
  return ctx.age >= 50 && ctx.aggression <= 45;
}

const horizonWord = (y: number) =>
  y >= 30 ? "lifetime" : y >= 7 ? "long" : y >= 2 ? "medium" : "short";

export const CASES: Record<string, (ctx: CaseCtx) => string> = {
  direct_equity: (ctx) =>
    youngAggr(ctx)
      ? `A high-conviction sleeve sized for your ${horizonWord(ctx.horizonYears)}-term horizon - room to back specific calls without derailing the core.`
      : `A small, deliberate direct-stock sleeve to add alpha on top of your diversified core.`,
  index_fund: () =>
    `Low-cost, broad-market exposure that forms the dependable core of the equity sleeve.`,
  large_cap: (ctx) =>
    oldConservative(ctx)
      ? `Established, lower-volatility businesses - the part of equity you can hold through a downturn.`
      : `Steady compounders that anchor the equity sleeve while the satellite funds chase growth.`,
  flexi_cap: () =>
    `Manager flexibility across market caps - a single fund that adapts as cycles turn.`,
  multi_asset: (ctx) =>
    ctx.riskScore < 45
      ? `Built-in diversification across equity, debt and gold - smooths the ride when conviction is lower.`
      : `A stabiliser inside the equity sleeve, blending asset classes without leaving growth behind.`,
  mid_cap: (ctx) =>
    youngAggr(ctx)
      ? `At ${ctx.age} with a ${horizonWord(ctx.horizonYears)} horizon, mid caps can ride multiple cycles - sized to add growth without overwhelming the book.`
      : `A measured growth tilt, sized small given your risk profile.`,
  small_cap: (ctx) =>
    youngAggr(ctx)
      ? `Highest-growth, highest-volatility sleeve - sized small so a drawdown won't derail decades of compounding.`
      : `A thin slice of small-cap exposure, kept light given your age and risk setting.`,
  sector_fund: () =>
    `A tactical, thematic bet - capped small since concentrated sector calls cut both ways.`,
  foreign: () =>
    `Geographic diversification and access to global tech outside the Indian market cycle.`,
  debt_fund: (ctx) =>
    oldConservative(ctx)
      ? `Stable, liquid fixed income that does the heavy lifting on capital preservation.`
      : `Ballast for the portfolio - smooths returns and funds near-term needs without selling equity in a dip.`,
  corporate_bonds: (ctx) =>
    ctx.riskScore >= 55
      ? `Slightly higher yield than government paper, taken on with credit research, not blind reach for yield.`
      : `A modest credit-spread pickup over government bonds, kept short-duration.`,
  govt_bills: (ctx) =>
    oldConservative(ctx)
      ? `Near-certain repayment and liquidity - the ballast that lets the rest of the book take risk.`
      : `The safest rupee in the portfolio - sovereign-backed and liquid.`,
  other_bonds: () =>
    `Rounds out fixed income with laddered maturities for predictable cashflows.`,
  gold: () =>
    `Inflation hedge and crisis insurance that moves independently of equity and debt.`,
  silver: (ctx) =>
    ctx.aggression >= 60
      ? `A higher-beta companion to gold - more volatile, with industrial-demand upside.`
      : `A small complement to gold inside the metal sleeve.`,
  real_estate: (ctx) =>
    `Your corpus and ${horizonWord(ctx.horizonYears)} horizon clear the threshold where illiquid property earns a place - sized to not compromise liquidity.`,
  cash: (ctx) =>
    ctx.horizonYears < 1
      ? `Immediate liquidity for a near-term need - capital safety over returns.`
      : `A liquidity buffer so a market dip never forces a forced sale elsewhere.`,
};

export function caseFor(key: string, ctx: CaseCtx): string {
  return CASES[key]?.(ctx) ?? "Sized to fit your overall risk profile and horizon.";
}

export function deriveProfileTag(age: number, riskScore: number): ProfileTag {
  if (age <= 35 && riskScore >= 60) return "young-aggressive";
  if (age <= 35 && riskScore < 60) return "young-conservative";
  if (age >= 55 && riskScore >= 55) return "old-aggressive";
  if (age >= 55) return "old-conservative";
  return "mid-balanced";
}

export function summaryFor(tag: ProfileTag): string {
  switch (tag) {
    case "young-aggressive":
      return "Growth-tilted, built to compound for decades.";
    case "young-conservative":
      return "Cautious but not idle - a youth equity floor keeps you in the growth game.";
    case "old-aggressive":
      return "Still growth-leaning, with guardrails sized for a shorter runway.";
    case "old-conservative":
      return "Preservation-first, income-led.";
    case "mid-balanced":
    default:
      return "A balanced glide path between growth and stability.";
  }
}
