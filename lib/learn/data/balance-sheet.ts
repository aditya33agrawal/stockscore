import type { MetricEntry } from "../types";

export const balanceSheetMetrics: MetricEntry[] = [
  {
    id: "de",
    term: "Debt to Equity (D/E)",
    category: "balance-sheet",
    tagline: "How much the company has borrowed relative to what owners have put in.",
    alsoCalled: ["D/E Ratio", "Gearing", "Leverage Ratio"],
    inOneSentence:
      "D/E compares the company's total debt to its shareholders' equity — a measure of financial leverage and risk.",
    intuition:
      "If you put ₹100 of your own money into a shop and borrow another ₹50, your D/E is 0.5. You owe ₹50 to the bank for every ₹100 you own. If you borrow ₹300, your D/E is 3 — you owe ₹300 against your ₹100. The more you borrow, the more profit per rupee of your own money you can earn in good times — and the faster you go bankrupt in bad times.",
    concreteExample: {
      setup: "A company has total debt of ₹400 Cr and shareholders' equity of ₹800 Cr.",
      walkthrough: "D/E = 400 ÷ 800 = 0.5",
      takeaway:
        "0.5x is comfortably low. The company can absorb a profit slump for years without distress. By contrast, a D/E of 3x means a 10% drop in EBIT can leave the company unable to service interest.",
    },
    formula: { plain: "D/E = Total Debt ÷ Shareholders' Equity" },
    inputs: [
      { name: "Total Debt", meaning: "Short-term + long-term borrowings (interest-bearing only)", source: "Balance Sheet" },
      { name: "Shareholders' Equity", meaning: "Equity capital + reserves", source: "Balance Sheet" },
    ],
    methodology:
      "We include all interest-bearing debt (term loans, working-capital loans, debentures, lease obligations recognized under Ind-AS 116). Trade payables are not debt. Cash is not netted off — that's a Net Debt / Equity ratio (also computed separately).",
    whyThisConstruction:
      "Using total debt (not net debt) gives the gross financial obligation — debt has to be serviced even if cash sits idle. We use equity at book value (not market value of equity) because the relevant question is 'how much of the company's funding came from borrowing vs from owners' actual capital contributions and retained profits' — that's a balance-sheet question, not a market one.",
    benefits: [
      "Simple stress-test of financial fragility.",
      "Universally understood and reported.",
      "Trend over time signals deleveraging or leveraging-up phases.",
    ],
    limitations: [
      "Off-balance-sheet obligations (operating leases pre-Ind-AS 116, contingent liabilities, guarantees) aren't captured.",
      "Some sectors (banks, NBFCs, infra) operate with structurally high D/E and shouldn't be compared to consumer or IT.",
      "Doesn't tell you about debt maturity — ₹100 due tomorrow is more dangerous than ₹100 due in 10 years.",
    ],
    alternatives: [
      { name: "Net Debt / EBITDA", whenBetter: "When you care about ability to service debt from operating cash flow." },
      { name: "Interest Coverage", whenBetter: "When you want a direct read on whether interest is comfortably covered." },
    ],
    howToRead: [
      { label: "D/E < 0.5", desc: "Low leverage. Company doesn't depend on borrowed money — can absorb shocks." },
      { label: "D/E 0.5–1.5", desc: "Moderate. Normal for manufacturing. Not a concern on its own." },
      { label: "D/E > 2", desc: "High. Fine for infra/financials; warning for consumer or commodity businesses." },
    ],
    ranges: {
      bad: "> 2 outside financials/infra",
      ok: "0.5 – 1.5",
      good: "< 0.5 with strong interest coverage",
    },
    sectorNotes: [
      { sector: "Banks/NBFCs", note: "Structurally 6–10x. Compare to peers, not to the rest of the market." },
      { sector: "Infra/Real Estate", note: "2–4x is normal. Watch for project cash-flow timing." },
      { sector: "IT/FMCG", note: "Usually near zero. Anything above 0.5 deserves a closer look." },
    ],
    traps: [
      "Off-balance-sheet leases (especially pre-Ind-AS 116 historical data) can make D/E look artificially low.",
      "A company can have low D/E but huge contingent liabilities or guarantees — read the notes.",
      "Convertible debt sits in a grey zone — eventually becomes equity but currently looks like debt.",
    ],
    pairsWellWith: ["interest-coverage", "roe", "cfo-pat"],
  },
  {
    id: "current-ratio",
    term: "Current Ratio",
    category: "balance-sheet",
    tagline: "Can the company pay what it owes within a year using what it already has?",
    inOneSentence:
      "Current ratio is current assets divided by current liabilities — a quick test of short-term liquidity.",
    intuition:
      "Current assets (cash, receivables, inventory) are things expected to turn into cash within a year. Current liabilities (trade payables, short-term loans) are things due within a year. If you have ₹150 of stuff due to convert to cash and only ₹100 owed in the same period, your current ratio is 1.5 — you can comfortably meet near-term obligations. If it's 0.7, you owe more than you have coming in — a liquidity crunch may be near.",
    concreteExample: {
      setup: "A company has current assets of ₹3,000 Cr and current liabilities of ₹2,000 Cr.",
      walkthrough: "Current Ratio = 3,000 ÷ 2,000 = 1.5",
      takeaway:
        "1.5x is healthy. There's a 50% cushion above what's due within 12 months — not so high that capital is sitting idle, not so low that a single bad month risks default.",
    },
    formula: { plain: "Current Ratio = Current Assets ÷ Current Liabilities" },
    inputs: [
      { name: "Current Assets", meaning: "Cash + receivables + inventory + other items due within 12 months", source: "Balance Sheet" },
      { name: "Current Liabilities", meaning: "Trade payables + short-term debt + other items due within 12 months", source: "Balance Sheet" },
    ],
    methodology:
      "Taken directly from the latest reported balance sheet. We don't strip out slow-moving inventory or doubtful receivables — that adjustment moves you toward the Quick Ratio.",
    whyThisConstruction:
      "By matching 'due within a year' assets to 'due within a year' liabilities, the ratio asks a direct question: in the short run, will the company need to raise emergency funding? The choice of 12 months is conventional — it lines up with the accounting period and most operating cycles.",
    benefits: [
      "Simple stress-test of liquidity.",
      "Trendable — falling current ratio is an early warning even before any default.",
    ],
    limitations: [
      "Inventory may not be liquid — if you can't sell it, it's not really an asset.",
      "Receivables from a single dominant customer concentrate risk.",
      "Industries with negative working capital (FMCG, supermarkets) routinely show current ratios < 1 — by design, not weakness.",
    ],
    alternatives: [
      { name: "Quick Ratio", whenBetter: "When inventory might not be quickly saleable — strips inventory out of the numerator." },
      { name: "Cash Ratio", whenBetter: "For a worst-case liquidity test using only cash and equivalents." },
    ],
    howToRead: [
      { label: "Ratio > 2", desc: "Very liquid; potentially capital sitting idle." },
      { label: "Ratio 1.2 – 2", desc: "Comfortable for most manufacturing businesses." },
      { label: "Ratio < 1", desc: "Short-term liabilities exceed short-term assets. Investigate carefully — normal for FMCG, dangerous for others." },
    ],
    sectorNotes: [
      { sector: "FMCG/Retail", note: "Often 0.8–1. They collect from customers fast and pay suppliers slowly — negative working capital is a strength." },
      { sector: "Capital Goods", note: "1.5+ expected due to long inventory cycles." },
    ],
    traps: [
      "Slow-moving or obsolete inventory inflates current assets but isn't truly liquid.",
      "Trade receivables from a stressed counterparty are an asset on paper, a risk in reality.",
    ],
    pairsWellWith: ["de", "ccc", "cfo-pat"],
  },
];
