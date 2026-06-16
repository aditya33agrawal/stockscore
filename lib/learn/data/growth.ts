import type { MetricEntry } from "../types";

export const growthMetrics: MetricEntry[] = [
  {
    id: "sales-growth",
    term: "Revenue / Sales Growth",
    category: "growth",
    tagline: "Is the top line actually getting bigger - and how fast?",
    alsoCalled: ["Top-line growth", "Revenue CAGR"],
    inOneSentence:
      "Sales growth is the year-over-year (or compounded) increase in the company's revenue - a measure of whether the business is expanding.",
    intuition:
      "Revenue is the size of the pie the company is selling. If sales grew from ₹1,000 Cr to ₹1,150 Cr, that's 15% growth - the business is selling more, raising prices, or both. CAGR (compounded annual growth rate) smooths multiple years into a single 'average' growth number, so a 5-year sales CAGR of 12% means the company grew its revenue at ~12% every year on average.",
    concreteExample: {
      setup: "Company revenue: FY20 ₹1,000 Cr; FY25 ₹1,762 Cr.",
      walkthrough: "5-year CAGR = (1,762 ÷ 1,000)^(1/5) − 1 = 12% per year.",
      takeaway:
        "12% revenue CAGR is comfortably above India's nominal GDP growth (~10%), meaning the business is gaining real share - not just riding inflation.",
    },
    formula: {
      plain:
        "YoY Growth = (Current Year Revenue ÷ Prior Year Revenue) − 1; CAGR = (End ÷ Start)^(1/years) − 1",
    },
    inputs: [
      { name: "Revenue", meaning: "Net sales for the period", source: "P&L" },
    ],
    methodology:
      "We compute TTM, 3-year, 5-year, and 10-year CAGRs from screener.in's annual revenue series. CAGR uses the geometric mean (compounding), not arithmetic average - this avoids overstating growth when there are alternating up and down years.",
    whyThisConstruction:
      "We use CAGR instead of average growth because compounding is how money actually grows. Averaging 'grew 50% then fell 50%' looks like 0% but actually leaves you at 75% of where you started. CAGR captures this honestly.",
    benefits: [
      "Top-line health: a great margin on shrinking revenue is still a shrinking business.",
      "Comparable across periods through CAGR.",
      "Multi-year view smooths cyclical noise.",
    ],
    limitations: [
      "Revenue can grow through acquisitions (inorganic) - separate organic growth where possible.",
      "Accounting changes (GST transition, Ind-AS) create artificial discontinuities.",
      "Revenue growth without profit growth is hollow - companies can 'buy' revenue with low-margin contracts.",
    ],
    alternatives: [
      {
        name: "Volume Growth",
        whenBetter:
          "When inflation or pricing is masking weak underlying demand.",
      },
      {
        name: "Same-Store Sales Growth",
        whenBetter:
          "For retail/QSR where new-store openings inflate headline revenue.",
      },
    ],
    howToRead: [
      {
        label: "Sales CAGR > 15%",
        desc: "Fast-growing. Verify it's not just acquisitions or margin-dilutive deals.",
      },
      {
        label: "Sales CAGR 8–15%",
        desc: "Steady compounder - growing above GDP, likely gaining share.",
      },
      {
        label: "Sales CAGR < 5%",
        desc: "Slow. Mature business, or stagnating one.",
      },
    ],
    sectorNotes: [
      {
        sector: "Cyclicals",
        note: "Always use 5+ year CAGR - picking one cyclical high/low distorts everything.",
      },
      {
        sector: "Banks",
        note: "Use loan-book growth (advances) instead of revenue.",
      },
    ],
    traps: [
      "Acquisition-driven growth flatters CAGR; check organic growth separately.",
      "One huge order or contract can mask weak underlying demand for a year.",
    ],
    pairsWellWith: ["eps-growth", "opm", "roce"],
  },
  {
    id: "eps-growth",
    term: "EPS Growth",
    category: "growth",
    tagline: "Is the per-share profit actually growing for shareholders?",
    alsoCalled: ["Earnings Per Share Growth", "EPS CAGR"],
    inOneSentence:
      "EPS growth measures how much the profit attributable to each share is increasing - the metric that ultimately drives stock prices over the long run.",
    intuition:
      "Two companies can grow revenue at the same rate, but one issues new shares constantly (diluting your stake) while the other buys back stock. EPS - earnings per share - captures what *you, as one share's owner*, get. If a company grows EPS at 18% a year for a decade, the per-share earnings will be ~5x larger. Stock prices usually follow.",
    concreteExample: {
      setup:
        "EPS went from ₹20 (FY20) to ₹46 (FY25). Share count was constant.",
      walkthrough: "5-year CAGR = (46 ÷ 20)^(1/5) − 1 = 18%.",
      takeaway:
        "18% EPS CAGR is excellent. If the P/E multiple stays the same, the stock should approximately match the EPS growth rate over time.",
    },
    formula: {
      plain:
        "EPS = Net Profit ÷ Weighted Average Shares Outstanding; Growth measured as CAGR",
    },
    inputs: [
      {
        name: "Net Profit",
        meaning: "After tax, attributable to equity shareholders",
        source: "P&L",
      },
      {
        name: "Shares Outstanding",
        meaning:
          "Weighted average for the period (accounts for buybacks/issuances)",
        source: "Filings",
      },
    ],
    methodology:
      "We use diluted EPS where reported (it accounts for stock options and convertibles that could become shares). 5-year CAGR is the headline figure on the company page; 3-year and 10-year are also computed.",
    whyThisConstruction:
      "EPS growth is preferred over total profit growth because it controls for dilution. A company that grows profit 20% by issuing 15% more shares only delivers ~4% EPS growth to existing shareholders. Diluted EPS is preferred over basic EPS because it reflects the worst-case ownership claim.",
    benefits: [
      "Aligned with shareholder return - over long periods, stock prices track EPS growth closely.",
      "Adjusts for capital actions (buybacks, splits, bonus issues).",
      "Comparable across companies regardless of size.",
    ],
    limitations: [
      "Can be artificially boosted by buybacks even if the business isn't growing.",
      "One-time gains or losses distort a single year - use trailing 3 or 5 year CAGR.",
      "Doesn't tell you the *quality* of earnings (real cash vs accounting profit).",
    ],
    alternatives: [
      {
        name: "PAT Growth",
        whenBetter:
          "When you want absolute scale of profit growth, ignoring share count.",
      },
      {
        name: "CFO Growth",
        whenBetter:
          "When you want to verify the EPS growth is backed by real cash.",
      },
    ],
    howToRead: [
      {
        label: "EPS CAGR > 20%",
        desc: "Hyper-growth. Sustainable only with high ROCE and reinvestment runway.",
      },
      {
        label: "EPS CAGR 12–20%",
        desc: "Strong compounder. Most multi-baggers fall here over decades.",
      },
      {
        label: "EPS CAGR < 8%",
        desc: "Slow. Stock returns will likely lag unless valuation expands.",
      },
    ],
    traps: [
      "Buyback-driven EPS growth without revenue growth is engineering, not business growth.",
      "Tax cuts (one-time) can inflate EPS for a year - strip them out for comparison.",
      "Negative-to-positive transitions (loss → small profit) produce huge meaningless growth percentages.",
    ],
    pairsWellWith: ["sales-growth", "roce", "cfo-pat"],
  },
];
