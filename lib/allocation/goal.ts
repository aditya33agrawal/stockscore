import type { AllocationResult, AssetNode, GoalFeasibility, GoalInput } from "./types";
import { COLORS } from "./colors";
import { horizonNorm, horizonYears } from "./horizon";
import { caseFor, deriveProfileTag, summaryFor } from "./cases";
import { getGoal } from "./goals-catalog";
import { riskLabel } from "./wealth";

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

// Long-run India CPI assumption used to project today's goal cost forward.
const ASSUMED_INFLATION = 6;

const EXPECTED_RETURN: Record<string, number> = {
  index_fund: 12,
  large_cap: 11,
  flexi_cap: 12.5,
  mid_cap: 14,
  small_cap: 16,
  debt_fund: 7,
  corporate_bonds: 7.8,
  govt_bills: 7,
  other_bonds: 7.3,
  cash: 4,
};

interface RawLeaf {
  key: string;
  label: string;
  pct: number;
  instrument: string;
}

function computeFeasibility(
  input: GoalInput,
  hYears: number,
  modelReturn: number,
): GoalFeasibility | null {
  const targetToday = Math.max(0, input.targetCorpus || 0);
  if (targetToday <= 0) return null;

  const targetFutureValue = targetToday * Math.pow(1 + ASSUMED_INFLATION / 100, hYears);

  const r = modelReturn / 100;
  let projectedCorpus: number;
  if (input.mode === "lumpsum") {
    projectedCorpus = input.amount * Math.pow(1 + r, hYears);
  } else {
    // Monthly SIP future value, compounded monthly at the blended annual rate.
    const monthlyRate = Math.pow(1 + r, 1 / 12) - 1;
    const n = Math.max(1, Math.round(hYears * 12));
    projectedCorpus =
      monthlyRate > 0
        ? input.amount * ((Math.pow(1 + monthlyRate, n) - 1) / monthlyRate) * (1 + monthlyRate)
        : input.amount * n;
  }

  const gap = targetFutureValue - projectedCorpus;
  const surplusBuffer = targetFutureValue * 0.05;
  const status: GoalFeasibility["status"] =
    gap > surplusBuffer ? "short" : gap < -surplusBuffer ? "surplus" : "on-track";

  return {
    targetToday,
    targetFutureValue: Math.round(targetFutureValue),
    projectedCorpus: Math.round(projectedCorpus),
    gap: Math.round(gap),
    status,
    inflationRate: ASSUMED_INFLATION,
    horizonYears: Math.round(hYears * 10) / 10,
  };
}

export function computeGoalAllocation(input: GoalInput): AllocationResult {
  const amount = Math.max(0, input.amount);
  const age = clamp(input.age, 18, 80);
  const horizon = clamp(input.horizon, 1, 100);
  const goal = getGoal(input.goal);

  const hNorm = horizonNorm(horizon);
  const hYears = horizonYears(horizon);

  const rawLeaves: RawLeaf[] = [];
  let riskScore: number;
  let realEstateNote: string | null = null;

  if (goal.definitive) {
    // Capital-protection mode: Debt + Bonds & Bills + Cash only.
    // Nearer the date (lower horizon) -> more cash; further out -> more bonds/debt.
    const cashShare = clamp(0.55 - hNorm * 0.45, 0.1, 0.55);
    const remaining = 1 - cashShare;
    const debtShare = remaining * 0.45;
    const bondsShare = remaining * 0.55;

    const cashPct = cashShare * 100;
    const debtPct = debtShare * 100;
    const bondsPct = bondsShare * 100;

    const govtShare = clamp(0.55 - hNorm * 0.1, 0.35, 0.6);
    const corpShare = clamp(0.3 + hNorm * 0.1, 0.25, 0.4);
    const otherShare = clamp(1 - govtShare - corpShare, 0.05, 0.3);
    const bSum = govtShare + corpShare + otherShare || 1;

    rawLeaves.push(
      { key: "debt_fund", label: "Debt Funds", pct: debtPct, instrument: "Short-duration debt fund" },
      { key: "corporate_bonds", label: "Corporate Bonds", pct: (corpShare / bSum) * bondsPct, instrument: "AAA corporate bonds" },
      { key: "govt_bills", label: "Govt Bills", pct: (govtShare / bSum) * bondsPct, instrument: "G-sec / T-bills" },
      { key: "other_bonds", label: "Other Bonds", pct: (otherShare / bSum) * bondsPct, instrument: "Laddered bond mix" },
      { key: "cash", label: "Cash & Liquid", pct: cashPct, instrument: "Liquid fund / savings account" },
    );

    riskScore = clamp(Math.round((1 - cashShare) * 40), 5, 40);
    realEstateNote = null;
  } else {
    // Open-ended: equity-led, tempered by age (older -> carve a little debt),
    // honoring the same youth equity floor used in Wealth Creation.
    const baseEquity = clamp(105 - age, 25, 90);
    const youthFloor = clamp(55 - (age - 25) * 1.1, 12, 50);
    let equityPct = Math.max(baseEquity, youthFloor);
    equityPct = clamp(equityPct + (hNorm - 0.5) * 10, 20, 95);
    equityPct = Math.round(equityPct);
    const debtPct = 100 - equityPct;

    const youngBoost = clamp((50 - age) / 50, 0, 1);
    rawLeaves.push(
      { key: "index_fund", label: "Index Fund", pct: equityPct * 0.32, instrument: "Nifty 50 / Total Market Index Fund" },
      { key: "large_cap", label: "Large Cap", pct: equityPct * (0.26 - youngBoost * 0.12), instrument: "Large-cap equity fund" },
      { key: "flexi_cap", label: "Flexi / Multi Cap Fund", pct: equityPct * 0.24, instrument: "Flexi-cap / multi-cap fund" },
      { key: "mid_cap", label: "Mid Cap", pct: equityPct * (0.1 + youngBoost * 0.12), instrument: "Mid-cap equity fund" },
      { key: "small_cap", label: "Small Cap", pct: equityPct * (0.04 + youngBoost * 0.1), instrument: "Small-cap equity fund" },
      { key: "debt_fund", label: "Debt Funds", pct: debtPct, instrument: "Short-duration debt fund" },
    );

    riskScore = equityPct;
  }

  const sum = rawLeaves.reduce((s, l) => s + Math.max(0, l.pct), 0) || 1;
  const leaves = rawLeaves
    .map((l) => ({ ...l, pct: Math.round((Math.max(0, l.pct) / sum) * 1000) / 10 }))
    .filter((l) => l.pct >= 0.5);

  const ctx = { age, aggression: riskScore, horizonYears: hYears, riskScore, profileTag: deriveProfileTag(age, riskScore) };

  const toNode = (l: RawLeaf): AssetNode => ({
    key: l.key,
    label: l.label,
    pct: l.pct,
    amount: Math.round((l.pct / 100) * amount),
    color: COLORS[l.key] ?? COLORS.debt,
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

  const equityNode = group("equity", "Equity", COLORS.equity, ["index_fund", "large_cap", "flexi_cap", "mid_cap", "small_cap"]);
  const debtNode = group("debt", "Debt", COLORS.debt, ["debt_fund"]);
  const bondsNode = group("bonds_bills", "Bonds & Bills", COLORS.bonds, ["corporate_bonds", "govt_bills", "other_bonds"]);
  const cashNode = group("cash_group", "Cash", COLORS.cash, ["cash"]);

  const tree = [equityNode, debtNode, bondsNode, cashNode].filter((n): n is AssetNode => n !== null);
  const flat = leaves.map((l) => byKey[l.key]);

  const modelReturn =
    Math.round(flat.reduce((s, l) => s + (l.pct / 100) * (EXPECTED_RETURN[l.key] ?? 7), 0) * 10) / 10;

  return {
    riskScore,
    riskLabel: riskLabel(riskScore),
    equityPct: equityNode?.pct ?? 0,
    modelReturn,
    tree,
    flat,
    profileTag: ctx.profileTag,
    summary: goal.definitive
      ? `Capital-protection mode for "${goal.label}" - growth assets stay out since this goal has a fixed date.`
      : summaryFor(ctx.profileTag),
    realEstateNote,
    goalFeasibility: computeFeasibility(input, hYears, modelReturn),
  };
}
