import type { AllocationResult, AssetNode, WealthInput } from "./types";
import { COLORS } from "./colors";
import { horizonNorm, horizonYears } from "./horizon";
import { caseFor, deriveProfileTag, summaryFor } from "./cases";

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

export function riskLabel(r: number): string {
  if (r <= 25) return "Very Low";
  if (r <= 45) return "Low";
  if (r <= 60) return "Moderate";
  if (r <= 80) return "High";
  return "Very High";
}

// Expected blended return per leaf, used only to surface an estimated CAGR.
const EXPECTED_RETURN: Record<string, number> = {
  direct_equity: 15,
  index_fund: 12,
  large_cap: 11,
  flexi_cap: 12.5,
  multi_asset: 10,
  mid_cap: 14,
  small_cap: 16,
  sector_fund: 14,
  foreign: 11,
  debt_fund: 7,
  corporate_bonds: 7.8,
  govt_bills: 7,
  other_bonds: 7.3,
  gold: 8,
  silver: 9,
  real_estate: 9,
  cash: 4,
};

interface RawLeaf {
  key: string;
  label: string;
  pct: number;
  instrument: string;
}

export function computeWealthAllocation(input: WealthInput): AllocationResult {
  const amount = clamp(input.amount, 0, 1_00_00_000);
  const age = clamp(input.age, 18, 80);
  const aggression = clamp(input.aggression, 1, 100);
  const horizon = clamp(input.horizon, 1, 100);

  const aggrNorm = (aggression - 50) / 50; // -1 .. +1
  const hNorm = horizonNorm(horizon); // 0 .. 1
  const hYears = horizonYears(horizon);

  // 1. Age baseline (classic glide path)
  const baseEquity = clamp(100 - age, 15, 85);

  // 2. Aggression effect, dampened by age - this is the dominant lever, and
  // its swing shrinks as age rises so the dial matters less for older users.
  const ageDamp = clamp(1 - (age - 25) / 90, 0.3, 1);
  const aggrEffect = aggrNorm * 35 * ageDamp;

  // 3. Horizon effect - secondary to age/aggression
  const horizonEffect = (hNorm - 0.5) * 12;

  let riskScore = clamp(baseEquity + aggrEffect + horizonEffect, 5, 95);

  // 4. Youth equity floor - young + max-conservative still keeps some growth
  const youthFloor = clamp(55 - (age - 25) * 1.1, 12, 50);
  riskScore = Math.max(riskScore, youthFloor);

  // 5. Old-age ceiling - aggression can't fully override capital preservation
  const oldCeil = clamp(120 - age, 35, 95);
  riskScore = Math.min(riskScore, oldCeil);
  riskScore = Math.round(riskScore);

  // ── Top-level bucket weights ──────────────────────────────────────────
  let equityPct = riskScore;
  const nonEquity = 100 - equityPct;

  const metalPct = clamp(4 + nonEquity * 0.1, 4, 12);
  const cashPct = clamp(2 + (1 - hNorm) * 10 + (riskScore < 30 ? 4 : 0), 2, 18);

  const foreignPct = equityPct * clamp(0.06 + aggrNorm * 0.06, 0, 0.18);
  equityPct -= foreignPct;

  let stability = Math.max(0, nonEquity - metalPct - cashPct);
  const bondsShare = clamp(
    0.35 + (age - 30) / 120 + (1 - riskScore / 100) * 0.2,
    0.3,
    0.65,
  );
  let bondsPct = stability * bondsShare;
  let debtPct = stability * (1 - bondsShare);

  // ── Real estate gating ────────────────────────────────────────────────
  const realEstateEligible =
    input.includeRealEstate && amount >= 25_00_000 && age >= 30 && hNorm >= 0.5;

  let rePct = 0;
  let realEstateNote: string | null = null;
  if (realEstateEligible) {
    rePct = clamp(8 + hNorm * 7, 8, 18);
    // fund it by trimming equity + bonds proportionally
    const trimFromEquity = rePct * 0.55;
    const trimFromBonds = rePct * 0.45;
    equityPct = Math.max(0, equityPct - trimFromEquity);
    bondsPct = Math.max(0, bondsPct - trimFromBonds);
  } else if (input.includeRealEstate) {
    realEstateNote =
      amount < 25_00_000
        ? "Real estate skipped: needs a corpus of at least ₹25L to clear illiquidity costs."
        : age < 30
          ? "Real estate skipped: needs an investor age of 30+ given its long lock-in."
          : "Real estate skipped: needs a longer time horizon given its illiquidity.";
  }

  // ── Real-estate-OFF redistribution ────────────────────────────────────
  if (!realEstateEligible) {
    // Small nudge in the direction RE's slot would have gone, so the OFF
    // state visibly favors equity-for-young/high-risk vs debt-for-old/low-risk.
    const freed = 4; // modest reallocation, not a full RE-sized slot
    if (riskScore >= 55) {
      equityPct += freed;
      stability -= freed * (bondsPct + debtPct > 0 ? 1 : 0);
      bondsPct = Math.max(0, bondsPct - freed * bondsShare);
      debtPct = Math.max(0, debtPct - freed * (1 - bondsShare));
    } else {
      bondsPct += freed * bondsShare;
      debtPct += freed * (1 - bondsShare);
      equityPct = Math.max(0, equityPct - freed);
    }
  }

  // ── Sub-splits ─────────────────────────────────────────────────────────
  const directShare =
    amount >= 5_00_000 && aggression >= 45
      ? clamp(0.15 + aggrNorm * 0.25, 0, 0.4)
      : 0;
  const directPct = equityPct * directShare;
  const indirectPct = equityPct - directPct;

  const indirectTilt = (conservativeBase: number, aggressiveBase: number) =>
    conservativeBase + (aggressiveBase - conservativeBase) * clamp((aggrNorm + 1) / 2, 0, 1);

  const indirectRaw: Record<string, number> = {
    index_fund: indirectTilt(28, 16),
    large_cap: indirectTilt(26, 10),
    flexi_cap: indirectTilt(24, 22),
    multi_asset: indirectTilt(14, 5),
    mid_cap: indirectTilt(6, 22),
    small_cap: indirectTilt(2, 18),
    sector_fund: amount >= 15_00_000 ? indirectTilt(0, 7) : 0,
  };
  const indirectSum = Object.values(indirectRaw).reduce((s, v) => s + v, 0) || 1;
  const indirectFunds: Record<string, number> = {};
  for (const [k, v] of Object.entries(indirectRaw)) {
    indirectFunds[k] = (v / indirectSum) * indirectPct;
  }

  const goldShare = clamp(0.7 - aggrNorm * 0.05, 0.55, 0.75);
  const goldPct = metalPct * goldShare;
  const silverPct = metalPct * (1 - goldShare);

  const govtShare = clamp(0.45 + (age - 30) / 150 + (1 - riskScore / 100) * 0.15, 0.3, 0.65);
  const corpShare = clamp(0.4 - (1 - riskScore / 100) * 0.1, 0.25, 0.45);
  const otherShare = clamp(1 - govtShare - corpShare, 0.05, 0.3);
  const bondsSum = govtShare + corpShare + otherShare || 1;
  const corporateBondsPct = (corpShare / bondsSum) * bondsPct;
  const govtBillsPct = (govtShare / bondsSum) * bondsPct;
  const otherBondsPct = (otherShare / bondsSum) * bondsPct;

  const reLabel = amount < 50_00_000 ? "REIT (liquid)" : "REIT + physical mix";

  const rawLeaves: RawLeaf[] = [
    { key: "direct_equity", label: "Direct Equity", pct: directPct, instrument: "Direct equities · 8–15 names" },
    { key: "index_fund", label: "Index Fund", pct: indirectFunds.index_fund, instrument: "Nifty 50 / Total Market Index Fund" },
    { key: "large_cap", label: "Large Cap", pct: indirectFunds.large_cap, instrument: "Large-cap equity fund" },
    { key: "flexi_cap", label: "Flexi / Multi Cap Fund", pct: indirectFunds.flexi_cap, instrument: "Flexi-cap / multi-cap fund" },
    { key: "multi_asset", label: "Multi Asset Allocation Fund", pct: indirectFunds.multi_asset, instrument: "Multi-asset allocation fund" },
    { key: "mid_cap", label: "Mid Cap", pct: indirectFunds.mid_cap, instrument: "Mid-cap equity fund" },
    { key: "small_cap", label: "Small Cap", pct: indirectFunds.small_cap, instrument: "Small-cap equity fund" },
    { key: "sector_fund", label: "Sector Fund", pct: indirectFunds.sector_fund, instrument: "Thematic / sector fund" },
    { key: "debt_fund", label: "Debt Funds", pct: debtPct, instrument: "Short-duration / corporate bond fund" },
    { key: "gold", label: "Gold", pct: goldPct, instrument: "Sovereign Gold Bonds / Gold ETF" },
    { key: "silver", label: "Silver", pct: silverPct, instrument: "Silver ETF" },
    { key: "real_estate", label: "Real Estate", pct: rePct, instrument: reLabel },
    { key: "corporate_bonds", label: "Corporate Bonds", pct: corporateBondsPct, instrument: "AAA corporate bonds · 3–5 yr" },
    { key: "govt_bills", label: "Govt Bills", pct: govtBillsPct, instrument: "G-sec / T-bills" },
    { key: "other_bonds", label: "Other Bonds", pct: otherBondsPct, instrument: "Laddered bond mix" },
    { key: "foreign", label: "Nasdaq / Global FoF", pct: foreignPct, instrument: "Nasdaq 100 / S&P 500 FoF" },
    { key: "cash", label: "Cash & Liquid", pct: cashPct, instrument: "Liquid fund / savings" },
  ];

  // Normalize to 100, drop dust
  const sum = rawLeaves.reduce((s, l) => s + Math.max(0, l.pct), 0) || 1;
  const leaves = rawLeaves
    .map((l) => ({ ...l, pct: Math.round((Math.max(0, l.pct) / sum) * 1000) / 10 }))
    .filter((l) => l.pct >= 0.5);

  const ctx = { age, aggression, horizonYears: hYears, riskScore, profileTag: deriveProfileTag(age, riskScore) };

  const toNode = (l: RawLeaf): AssetNode => ({
    key: l.key,
    label: l.label,
    pct: l.pct,
    amount: Math.round((l.pct / 100) * amount),
    color: COLORS[l.key] ?? COLORS.equity,
    instrument: l.instrument,
    case: caseFor(l.key, ctx),
  });

  const byKey = Object.fromEntries(leaves.map((l) => [l.key, toNode(l)]));

  const group = (key: string, label: string, color: string, childKeys: string[]): AssetNode | null => {
    const children = childKeys.map((k) => byKey[k]).filter(Boolean);
    if (children.length === 0) return null;
    const pct = Math.round(children.reduce((s, c) => s + c.pct, 0) * 10) / 10;
    return {
      key,
      label,
      pct,
      amount: Math.round((pct / 100) * amount),
      color,
      instrument: "",
      case: "",
      children,
    };
  };

  const indirectGroup = group("indirect_equity", "Indirect Equity", COLORS.equity, [
    "index_fund", "large_cap", "flexi_cap", "multi_asset", "mid_cap", "small_cap", "sector_fund",
  ]);
  const equityChildren: AssetNode[] = [];
  if (byKey.direct_equity) equityChildren.push(byKey.direct_equity);
  if (indirectGroup) equityChildren.push(indirectGroup);
  const equityPctTotal = Math.round(equityChildren.reduce((s, c) => s + c.pct, 0) * 10) / 10;
  const equityNode: AssetNode | null =
    equityChildren.length > 0
      ? {
          key: "equity",
          label: "Equity",
          pct: equityPctTotal,
          amount: Math.round((equityPctTotal / 100) * amount),
          color: COLORS.equity,
          instrument: "",
          case: "",
          children: equityChildren,
        }
      : null;

  const debtNode = group("debt", "Debt", COLORS.debt, ["debt_fund"]);
  const metalNode = group("metal", "Metal", COLORS.metal, ["gold", "silver"]);
  const realEstateNode = group("real_estate_group", "Real Estate", COLORS.real_estate, ["real_estate"]);
  const bondsNode = group("bonds_bills", "Bonds & Bills", COLORS.bonds, ["corporate_bonds", "govt_bills", "other_bonds"]);
  const foreignNode = group("foreign_market", "Foreign Market", COLORS.foreign, ["foreign"]);
  const cashNode = group("cash_group", "Cash", COLORS.cash, ["cash"]);

  const tree = [equityNode, debtNode, metalNode, realEstateNode, bondsNode, foreignNode, cashNode].filter(
    (n): n is AssetNode => n !== null,
  );

  const flat = leaves.map((l) => byKey[l.key]);

  const modelReturn =
    Math.round(
      flat.reduce((s, l) => s + (l.pct / 100) * (EXPECTED_RETURN[l.key] ?? 8), 0) * 10,
    ) / 10;

  return {
    riskScore,
    riskLabel: riskLabel(riskScore),
    equityPct: equityNode?.pct ?? 0,
    modelReturn,
    tree,
    flat,
    profileTag: ctx.profileTag,
    summary: summaryFor(ctx.profileTag),
    realEstateNote,
  };
}
