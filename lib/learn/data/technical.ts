import type { MetricEntry } from "../types";

export const technicalMetrics: MetricEntry[] = [
  {
    id: "returns",
    term: "Stock Returns (1Y / 3Y / 5Y)",
    category: "technical",
    tagline: "What the share price has actually done over a chosen period.",
    inOneSentence:
      "Stock returns measure the price change over a window (often plus dividends) - how much money you'd have made or lost holding the stock for that period.",
    intuition:
      "If a stock was ₹100 a year ago and is ₹120 today, your 1-year return is 20%. Add dividends paid and it's a 'total return.' Short windows (1Y) capture momentum and sentiment. Long windows (5Y, 10Y) reflect whether the business actually created value through a full cycle. The contrast between the two is the most useful signal.",
    concreteExample: {
      setup:
        "Stock was ₹500 (1 year ago), ₹250 (5 years ago), and is ₹600 today.",
      walkthrough:
        "1Y return = (600 ÷ 500) − 1 = 20%. 5Y return = (600 ÷ 250) − 1 = 140%; as CAGR = (600/250)^(1/5) − 1 = 19%/yr.",
      takeaway:
        "Both short and long windows positive - the stock has compounded at roughly 19% per year over five years, and the trend is intact in the recent year.",
    },
    formula: {
      plain:
        "Price Return = (End Price ÷ Start Price) − 1; CAGR = (End ÷ Start)^(1/years) − 1; Total Return adds dividends.",
    },
    inputs: [
      {
        name: "Start Price",
        meaning:
          "Adjusted close N years/months ago (adjusted for splits, bonus)",
        source: "Market",
      },
      { name: "End Price", meaning: "Latest close", source: "Market" },
    ],
    methodology:
      "We use split- and bonus-adjusted closing prices so the series is continuous. Dividends are excluded from headline returns (they're shown separately as dividend yield) to keep the price return clean and comparable across stocks with different payout policies.",
    whyThisConstruction:
      "We show price return (not total return) because investors mentally separate 'capital gain' from 'income.' We use adjusted prices because a 1:1 bonus issue or 1:5 split otherwise creates a fake 50% or 80% drop in the raw series. CAGR is used for multi-year windows to express returns as an annualized rate - directly comparable to fixed deposits, mutual fund returns, and other CAGRs.",
    benefits: [
      "Universally comparable measure of past performance.",
      "Cheap to compute, easy to scan.",
      "Contrast between short and long windows reveals mean reversion or momentum.",
    ],
    limitations: [
      "Past returns don't predict future returns.",
      "A stock down 40% isn't automatically cheap - it may still be overvalued.",
      "Headline price return ignores dividends - for income-heavy stocks (PSUs), total return is materially higher.",
    ],
    howToRead: [
      {
        label: "Strong 1Y + weak 5Y",
        desc: "Recent rerating, not long-term value creation. Verify the rerating has fundamental support.",
      },
      {
        label: "Weak 1Y + strong 5Y",
        desc: "Short-term dip in a compounding story - potentially an entry opportunity.",
      },
      {
        label: "Strong 1Y AND strong 5Y",
        desc: "Established winner; valuation likely already reflects it.",
      },
      {
        label: "Weak 1Y AND weak 5Y",
        desc: "Persistent underperformer. Ask whether the business has structural issues.",
      },
    ],
    traps: [
      "Cherry-picking start dates can make any stock look great or terrible.",
      "Comparing absolute returns across periods of different length is misleading - always convert long periods to CAGR.",
      "Sector tailwinds (entire industry rerating) can mask individual mediocrity.",
    ],
    pairsWellWith: ["eps-growth", "pe", "market-cap"],
  },
];
