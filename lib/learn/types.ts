export type Category =
  | "valuation"
  | "profitability"
  | "growth"
  | "quarterly"
  | "balance-sheet"
  | "cash-flow"
  | "shareholding"
  | "dividend"
  | "efficiency"
  | "technical"
  | "sector";

export interface CategoryMeta {
  id: Category;
  label: string;
  blurb: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: "valuation",
    label: "Valuation",
    blurb: "What you pay vs what you get",
  },
  {
    id: "profitability",
    label: "Profitability",
    blurb: "How efficiently capital becomes profit",
  },
  { id: "growth", label: "Growth", blurb: "Is the business getting bigger?" },
  {
    id: "quarterly",
    label: "Quarterly Momentum",
    blurb: "Short-term direction",
  },
  {
    id: "balance-sheet",
    label: "Balance Sheet",
    blurb: "Can the company survive a shock?",
  },
  { id: "cash-flow", label: "Cash Flow", blurb: "Is the profit real cash?" },
  {
    id: "shareholding",
    label: "Shareholding",
    blurb: "Who owns it - and are they buying or selling?",
  },
  { id: "dividend", label: "Dividend", blurb: "Cash returned to owners" },
  {
    id: "efficiency",
    label: "Operational Efficiency",
    blurb: "How hard the assets work",
  },
  {
    id: "technical",
    label: "Price & Technical",
    blurb: "What the chart is saying",
  },
  { id: "sector", label: "Sector & Scoring", blurb: "Cross-cutting context" },
];

export interface MetricEntry {
  id: string;
  term: string;
  category: Category;
  tagline: string;
  alsoCalled?: string[];

  // Layman layer
  inOneSentence: string;
  intuition: string;
  concreteExample: {
    setup: string;
    walkthrough: string;
    takeaway: string;
  };

  // Technical layer
  formula: { plain: string };
  inputs: { name: string; meaning: string; source: string }[];
  methodology: string;
  whyThisConstruction: string;
  benefits: string[];
  limitations: string[];
  alternatives?: { name: string; whenBetter: string }[];

  // Interpretation
  howToRead: { label: string; desc: string }[];
  ranges?: { bad: string; ok: string; good: string; note?: string };
  sectorNotes?: { sector: string; note: string }[];

  // Practical
  traps: string[];
  pairsWellWith?: string[];
  redFlags?: string[];
}
