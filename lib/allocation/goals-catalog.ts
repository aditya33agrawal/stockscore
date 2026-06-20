import type { GoalDef, GoalKey } from "./types";

export const GOALS: GoalDef[] = [
  {
    key: "park_overnight",
    label: "Park money overnight / a few hours",
    termRating: 1,
    definitive: true,
    typicalHorizon: 1,
    note: "Capital safety and same-day liquidity matter more than returns.",
  },
  {
    key: "emergency_fund",
    label: "Emergency fund",
    termRating: 8,
    definitive: true,
    typicalHorizon: 10,
    note: "Needs to be accessible within a day or two, at any time, without loss.",
  },
  {
    key: "short_purchase",
    label: "Car / vacation / wedding (1–3 yrs)",
    termRating: 20,
    definitive: true,
    typicalHorizon: 35,
    note: "A known date and amount - no room for equity drawdowns.",
  },
  {
    key: "house_downpayment",
    label: "House down-payment (3–5 yrs)",
    termRating: 35,
    definitive: true,
    typicalHorizon: 48,
    note: "Glide from bonds into cash as the purchase date nears.",
  },
  {
    key: "child_education",
    label: "Child education (10–18 yrs)",
    termRating: 65,
    definitive: true,
    typicalHorizon: 72,
    note: "A dated goal far enough out to start in equity, then glide to debt.",
  },
  {
    key: "retirement",
    label: "Retirement",
    termRating: 85,
    definitive: false,
    typicalHorizon: 88,
    note: "No hard expiry - equity-led, tempered by how close retirement is.",
  },
  {
    key: "wealth_legacy",
    label: "Wealth creation / legacy (lifetime)",
    termRating: 100,
    definitive: false,
    typicalHorizon: 100,
    note: "Open-ended - equity does the compounding.",
  },
];

export function getGoal(key: GoalKey): GoalDef {
  return GOALS.find((g) => g.key === key) ?? GOALS[GOALS.length - 1];
}
