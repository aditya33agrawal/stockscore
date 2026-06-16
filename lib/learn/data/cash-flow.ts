import type { MetricEntry } from "../types";

export const cashFlowMetrics: MetricEntry[] = [
  {
    id: "cfo-pat",
    term: "CFO / PAT (Earnings Quality)",
    category: "cash-flow",
    tagline:
      "How much of the reported profit actually became cash in the bank.",
    alsoCalled: ["Earnings Quality Ratio", "Operating Cash Flow Conversion"],
    inOneSentence:
      "CFO/PAT compares cash flow from operations to net profit - the ratio tells you whether reported profits are backed by actual cash or just accounting entries.",
    intuition:
      "Profit is what the accountant says you earned. Cash is what hit your bank account. They aren't the same. If you sell ₹100 of goods on credit, the accountant records ₹100 of revenue (and proportional profit) - but you haven't seen the cash. Over time, real businesses should convert profit to cash at roughly 1:1. If CFO is ₹100 for every ₹100 of PAT, earnings are 'high quality.' If CFO is ₹40 against ₹100 PAT for several years running, something is wrong - usually inflated receivables, growing inventory, or aggressive revenue recognition.",
    concreteExample: {
      setup:
        "Over the last 5 years, a company reported cumulative PAT of ₹2,000 Cr and cumulative CFO of ₹1,900 Cr.",
      walkthrough: "CFO/PAT = 1,900 ÷ 2,000 = 0.95 (or 95%).",
      takeaway:
        "95% conversion is healthy - almost every rupee of accounting profit came home as cash. A consistent ratio below 70% is the single biggest warning sign in accounting fraud cases (think DHFL, Yes Bank pre-crisis).",
    },
    formula: {
      plain:
        "CFO / PAT = Cumulative Cash Flow from Operations ÷ Cumulative Net Profit (over 5–10 years)",
    },
    inputs: [
      {
        name: "CFO",
        meaning:
          "Net cash generated from operating activities (from the cash flow statement)",
        source: "Cash Flow Statement",
      },
      {
        name: "PAT",
        meaning: "Profit after tax for the same period",
        source: "P&L",
      },
    ],
    methodology:
      "We compute CFO/PAT on a cumulative 5-year basis (and 10-year where available). Single-year ratios are too noisy - working capital swings can push the ratio above 1.5 or below 0.5 in any given year without signalling anything. The multi-year average is what matters.",
    whyThisConstruction:
      "Comparing the cash version of profit (CFO) to the accrual version (PAT) is the single best test of whether the accountant's numbers reflect economic reality. CFO already strips out non-cash items (depreciation, working-capital changes) - so the ratio directly answers: 'are the receivables and inventory entries on the P&L turning into cash, or piling up on the balance sheet?'",
    benefits: [
      "Single most powerful fraud / aggressive-accounting screen.",
      "Captures working-capital deterioration before it shows in any other ratio.",
      "Sector-agnostic - the cash-vs-profit relationship should hold everywhere except financials.",
    ],
    limitations: [
      "Single-year readings are very noisy due to working-capital timing.",
      "Doesn't work for banks/NBFCs - their CFO is dominated by lending/deposit flows.",
      "Capex isn't subtracted - so it's not a free cash flow measure. Look at FCF/PAT for that.",
    ],
    alternatives: [
      {
        name: "FCF / PAT",
        whenBetter:
          "When you want to also account for capex required to sustain the business.",
      },
      {
        name: "Accrual Ratio",
        whenBetter:
          "Academic version - focuses on the *change* in accruals; more useful for fraud detection.",
      },
    ],
    howToRead: [
      {
        label: "> 90%",
        desc: "High-quality earnings. Profits convert to cash. Trust the P&L.",
      },
      {
        label: "60 – 90%",
        desc: "Normal range for most businesses, especially during growth phases (working capital expanding).",
      },
      {
        label: "< 50% over 5+ years",
        desc: "Major red flag. Receivables or inventory are growing faster than business. Investigate hard.",
      },
    ],
    sectorNotes: [
      {
        sector: "Banks/NBFCs",
        note: "CFO/PAT is not meaningful - financial businesses have a different cash-flow structure.",
      },
      {
        sector: "Capital goods / Project-based",
        note: "Lumpy by nature. Use a 5-year rolling window, not single years.",
      },
      {
        sector: "FMCG/IT",
        note: "Should consistently be near or above 100%. Anything sustained below 80% is a warning.",
      },
    ],
    traps: [
      "A single great cash year after several poor ones may just be a collection from old receivables - not a quality improvement.",
      "Selling receivables (factoring) artificially boosts CFO; check for sudden jumps with no corresponding business change.",
      "Capitalizing operating expenses (interest, R&D) understates accruals and inflates CFO/PAT temporarily.",
    ],
    pairsWellWith: ["sales-growth", "receivable-days", "de"],
    redFlags: [
      "CFO/PAT consistently below 70% combined with rising receivable days and rising debt - classic 'profits exist only on paper' setup.",
    ],
  },
];
