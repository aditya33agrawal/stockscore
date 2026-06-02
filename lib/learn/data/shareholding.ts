import type { MetricEntry } from "../types";

export const shareholdingMetrics: MetricEntry[] = [
  {
    id: "promoter-holding",
    term: "Promoter Holding",
    category: "shareholding",
    tagline: "How much of the company the founders / controlling family still own — and whether they're buying or selling.",
    inOneSentence:
      "Promoter holding is the percentage of the company owned by its founders or controlling group, reported every quarter to the exchanges.",
    intuition:
      "Promoters are the people running the business. If they own 60% of it, their personal wealth is tied to the company's success — they're highly aligned with you. If they own only 15% (and have been steadily selling), their incentives may have drifted. The *level* matters less than the *trend*: promoters quietly trimming their stake quarter after quarter is one of the loudest red flags in Indian equities.",
    concreteExample: {
      setup: "A company's promoter holding history: Q1 FY24: 55%, Q1 FY25: 52%, Q1 FY26: 48%.",
      walkthrough: "Promoter stake fell 7 percentage points in 2 years.",
      takeaway:
        "Promoters are net sellers of ~₹15% of their original stake. Why? Could be legitimate (estate planning, charity, debt repayment) — but the burden of proof shifts to the company. Always check the disclosure for the reason.",
    },
    formula: { plain: "Promoter Holding = Shares held by promoter group ÷ Total shares outstanding × 100" },
    inputs: [
      { name: "Promoter shares", meaning: "Shares held by the controlling group, including family trusts and holding companies", source: "Quarterly Shareholding Pattern (BSE/NSE)" },
      { name: "Total shares", meaning: "All equity shares outstanding", source: "Filings" },
    ],
    methodology:
      "Sourced from the quarterly shareholding pattern disclosed to exchanges. We track both the level (latest quarter) and the change over 1Y / 3Y. Promoter pledge (shares pledged with lenders) is tracked separately — pledge above 25% is a meaningful risk.",
    whyThisConstruction:
      "Looking at both level and change is essential. A stable 70% promoter holding is a vote of confidence; a falling 70% is a warning regardless of how high the absolute number looks. We use exchange filings (not company statements) because they're legally required and timestamped.",
    benefits: [
      "Direct read on insider conviction.",
      "Quarterly cadence means signals appear fast.",
      "Pledge data adds an early-warning layer for distress.",
    ],
    limitations: [
      "Some sells are operational (succession planning, complying with SEBI free-float rules) and don't signal a view on the business.",
      "Doesn't tell you about promoter buying via creeping acquisition — track that separately.",
      "Holding via opaque structures (FPIs registered abroad) can hide true beneficial ownership.",
    ],
    howToRead: [
      { label: "Holding > 50%, stable or rising", desc: "Strongly aligned. Founders have skin in the game." },
      { label: "Holding 25–50%", desc: "Normal for older or professionally-managed businesses. Watch the trend." },
      { label: "Holding < 25%", desc: "Promoter influence is limited. Treat the company as professional-managed (different lens)." },
      { label: "Holding falling consistently", desc: "Demand a reason. 3+ quarters of selling is the threshold." },
    ],
    traps: [
      "High promoter holding alone doesn't equal good corporate governance — some founders dilute minority shareholders through related-party transactions.",
      "Pledged shares look like promoter shares but can be sold by lenders in distress — count them carefully.",
      "Bonus issues or splits don't change holding %; don't misread the share count change as a transaction.",
    ],
    pairsWellWith: ["promoter-pledge", "fii-holding", "roce"],
    redFlags: [
      "Promoter holding falling AND pledge rising in the same quarter — almost always signals personal-balance-sheet stress at the promoter level.",
    ],
  },
];
