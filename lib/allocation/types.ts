export type ProfileTag =
  | "young-aggressive"
  | "young-conservative"
  | "mid-balanced"
  | "old-conservative"
  | "old-aggressive";

export interface AssetNode {
  key: string;
  label: string;
  pct: number; // % of total portfolio (rounded to 0.1)
  amount: number; // ₹ = pct/100 * totalAmount
  color: string;
  instrument: string;
  case: string;
  children?: AssetNode[];
}

export interface WealthInput {
  amount: number; // ₹, 0 .. 1_00_00_000
  age: number; // 18 .. 80
  aggression: number; // 1 .. 100
  horizon: number; // 1 .. 100 (scale)
  includeRealEstate: boolean;
}

export interface AllocationResult {
  riskScore: number;
  riskLabel: string;
  equityPct: number;
  modelReturn: number;
  tree: AssetNode[];
  flat: AssetNode[];
  profileTag: ProfileTag;
  summary: string;
  realEstateNote: string | null;
  goalFeasibility?: GoalFeasibility | null;
}

export interface GoalFeasibility {
  targetToday: number; // ₹, in today's terms, as entered by the user
  targetFutureValue: number; // ₹ target inflated to the goal date
  projectedCorpus: number; // ₹ what the plan is expected to grow to by then
  gap: number; // ₹ targetFutureValue - projectedCorpus (negative = surplus)
  status: "on-track" | "short" | "surplus";
  inflationRate: number; // assumed annual %, used to inflate targetToday
  horizonYears: number;
}

export type GoalKey =
  | "park_overnight"
  | "emergency_fund"
  | "short_purchase"
  | "house_downpayment"
  | "child_education"
  | "retirement"
  | "wealth_legacy";

export interface GoalDef {
  key: GoalKey;
  label: string;
  termRating: number; // 1..100 short -> long
  definitive: boolean; // has a hard expiry date
  typicalHorizon: number; // pre-fills horizon scale (1..100)
  note: string;
}

export interface GoalInput {
  mode: "lumpsum" | "sip";
  amount: number; // lumpsum ₹ or monthly ₹ depending on mode
  goal: GoalKey;
  age: number;
  horizon: number; // 1..100 scale
  targetCorpus: number; // ₹, today's value of what the goal costs - 0 = skip feasibility check
}
