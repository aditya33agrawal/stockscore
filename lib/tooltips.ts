import type { ReactNode } from "react";

export interface TooltipDef {
  title: string;
  body: ReactNode | string;
}

/**
 * Central registry of every metric/label tooltip on the site.
 *
 * Tooltip content standard - every entry should cover:
 *   1. WHAT  - plain-English definition.
 *   2. WHY   - why it matters (what does a good/bad value tell us?).
 *   3. HOW   - how it is computed in our score (formula, regression, etc.).
 *   4. BENCH - what counts as good / neutral / bad.
 *
 * Strings are rendered as a single paragraph; use the structured form
 * `{ title, body }` and write multi-paragraph bodies as `ReactNode`
 * when more clarity is required.
 */
export const TOOLTIPS: Record<string, TooltipDef> = {
  // ── Categories (the 10 score buckets) ──
  category_valuation: {
    title: "Valuation (10 pts)",
    body: "How richly the market is pricing the business right now. We blend P/E, PEG, EV/EBITDA and price-to-book on logistic curves so 'cheap' adds points while 'expensive' loses them - but never on a step rubric, so a stock at 24× P/E doesn't score the same as one at 80×.",
  },
  category_profitability: {
    title: "Profitability (20 pts)",
    body: "Quality of the earnings the company actually produces. ROCE, ROE and operating margin are scored with logistic curves anchored at sector-appropriate medians, so a 22% ROCE in cement counts more than 22% in a private bank where everyone clears 18%.",
  },
  category_growth: {
    title: "Growth (15 pts)",
    body: "Is the business getting bigger and is the bottom line keeping up? We measure 3y/5y revenue and profit growth using an OLS regression on log-values - that's a least-squares trend line, which smooths out one freak year so a single COVID dip doesn't tank the score.",
  },
  category_quarterly: {
    title: "Quarterly Momentum (10 pts)",
    body: "Is the recent trend confirming or contradicting the long-term story? We score YoY and QoQ growth across the last 4–8 quarters and reward consistency. A company growing every quarter scores higher than one that posts one big quarter and three flat ones.",
  },
  category_balance_sheet: {
    title: "Balance Sheet (15 pts)",
    body: "Can the business survive a bad year? Debt-to-equity, interest coverage and current ratio are all scored on logistic curves. We use logistic instead of step thresholds because going from D/E 0.9 to 1.1 isn't a cliff - it's a gradient.",
  },
  category_cash_flow: {
    title: "Cash Flow (10 pts)",
    body: "Is reported profit converting into actual cash? We compare CFO with reported PAT over 5 years and reward companies that consistently turn ≥80% of profit into operating cash. Reported profits without matching cash are the single biggest warning sign in fundamental analysis.",
  },
  category_shareholding: {
    title: "Shareholding (8 pts)",
    body: "Who owns the company and are they buying or selling? Higher promoter holding adds points (skin in the game), pledged shares subtract points, and we track 8-quarter trends in promoter/FII/DII stakes to spot conviction shifts.",
  },
  category_dividend: {
    title: "Dividend (4 pts)",
    body: "Is the company returning cash to shareholders sustainably? Yield, payout ratio and the consistency of the last 5 dividends all contribute. We don't reward unsustainable payouts (>80% of earnings) because they break in the first bad year.",
  },
  category_operational: {
    title: "Operational Efficiency (5 pts)",
    body: "Working-capital days, cash-conversion cycle, debtor days and inventory turnover. Shorter cycles mean the business funds its own growth instead of borrowing for it - that compounds beautifully over a decade.",
  },
  category_technical: {
    title: "Price & Technical (3 pts)",
    body: "A small kicker that nudges the score for stocks trading above their 50-day and 200-day moving averages, plus a healthy RSI band. Tiny weight on purpose - we are a fundamental score, not a charting tool.",
  },

  // ── Individual metrics shown on company / sector pages ──
  pe: {
    title: "Stock P/E",
    body: "Price ÷ trailing earnings per share - how many years of current earnings you're paying for one share. Below sector median is usually attractive; above 50× signals very high growth expectations. Scored on a logistic curve, not a step.",
  },
  roe: {
    title: "Return on Equity",
    body: "Annual net profit ÷ shareholders' equity. Says how efficiently the business uses owner capital. Above 18% is strong; below 10% is weak unless the company is rapidly deleveraging.",
  },
  roce: {
    title: "Return on Capital Employed",
    body: "EBIT ÷ (equity + debt). Same idea as ROE but includes borrowed money - important for businesses that lever up. Above 20% is excellent; below 12% suggests capital is being burned.",
  },
  opm: {
    title: "Operating Profit Margin",
    body: "Operating profit ÷ revenue. The piece of every rupee of sales that survives the actual cost of running the business. Sector-relative - software at 30% OPM is normal; cement at 20% is exceptional.",
  },
  current_ratio: {
    title: "Current Ratio",
    body: "Current assets ÷ current liabilities. Tests whether the company can pay its short-term bills without borrowing. Above 1.5 is comfortable, below 1.0 is a red flag - though banks and NBFCs are exempt (different balance-sheet structure).",
  },
  debt_to_equity: {
    title: "Debt / Equity",
    body: "Total borrowings ÷ shareholders' equity. Higher leverage amplifies returns in good years and losses in bad ones. Under 0.5 is conservative, over 1.5 needs strong interest coverage to justify.",
  },
  promoter_holding: {
    title: "Promoter Holding",
    body: "Percentage of shares held by founders / controlling shareholders. High and stable promoter stake (>50%) means the owners eat their own cooking. Falling promoter holding over 8 quarters is one of the clearest warning signals in Indian equities.",
  },
  dividend_yield: {
    title: "Dividend Yield",
    body: "Annual dividend ÷ current price. A useful floor on returns and a sign of cash-generation discipline. Yields above the 10-year G-sec rate are attractive if the payout ratio is reasonable.",
  },
  revenue_cagr: {
    title: "Revenue CAGR (5y)",
    body: "The compounded annual growth rate of revenue over 5 years, fitted with an OLS regression on log(revenue). We use regression instead of just (last/first)^(1/n) − 1 because it smooths anomalous endpoint years - one bad COVID year shouldn't dominate the number. Above 15% is strong, 8–15% is solid, below 5% is weak.",
  },
  profit_cagr: {
    title: "Profit CAGR (5y)",
    body: "Same as revenue CAGR but on net profit. The gap between profit CAGR and revenue CAGR tells you whether the business is gaining or losing operating leverage over time.",
  },
  cv: {
    title: "Coefficient of Variation",
    body: "Standard deviation ÷ mean - how 'lumpy' a number is over time. We use it on profit and revenue series to reward consistency. A 15% CV is steady; a 50% CV means the business is one bad year away from a re-rating.",
  },
  ols_slope: {
    title: "OLS slope (trend)",
    body: "Ordinary least-squares regression slope. We fit a straight line through a metric over time and use the slope as the trend signal. It's more robust than endpoint-to-endpoint growth because it uses every data point, not just two.",
  },
  logistic: {
    title: "Logistic curve",
    body: "An S-shaped scoring function. As a metric improves, the score rises quickly through the 'meaningful range' and then plateaus - so going from D/E 1.5 to 1.2 matters a lot, but going from 0.3 to 0.1 barely changes the score. Avoids the cliff-effect of step rubrics.",
  },
  percentile_rank: {
    title: "Percentile rank",
    body: "Where this company sits in its sector on this metric, expressed 0–100. Used when sector context matters more than absolute thresholds - e.g., 18% ROE is good for cement but middling for FMCG.",
  },

  // ── Score / classification ──
  final_score: {
    title: "Final Score",
    body: "The 0–100 composite of all 10 category scores plus bonuses and penalties. Sector ceilings cap the maximum (cyclicals at 90, financials at 80, tobacco at 75) to keep cross-sector comparisons honest.",
  },
  classification: {
    title: "Classification",
    body: "A simple bucket on top of the score: Avoid (<40), Watchlist (40–55), Accumulate (55–70), Invest-grade (70–82), Exceptional (>82). Use it as a starting point, not a verdict - always read the breakdown.",
  },

  // ── Ratios tab (Deep Dive) ──
  peg_ratio: {
    title: "PEG Ratio",
    body: "P/E ÷ earnings growth rate. Adjusts valuation for growth - a P/E of 30 at 30% growth (PEG≈1) is far cheaper than a P/E of 30 at 5% growth (PEG=6). Below 1 is generally considered cheap.",
  },
  price_to_book: {
    title: "Price to Book Value",
    body: "Current price ÷ book value per share. Trading at or below book value is a margin of safety for asset-heavy businesses; richly above book usually prices in intangible value like brand or growth.",
  },
  book_value: {
    title: "Book Value",
    body: "Net worth (equity + reserves) divided by number of shares - the accounting value attributable to each share if the company were liquidated at balance-sheet values.",
  },
  intrinsic_value: {
    title: "Intrinsic Value",
    body: "Graham number: √(22.5 × EPS × Book Value). A conservative fair-value estimate based purely on earnings and asset backing, ignoring growth expectations.",
  },
  pledged_pct: {
    title: "Pledged Percentage",
    body: "Share of promoter holding pledged as collateral for loans. A sharp share-price fall can trigger forced sales by lenders, so even 5-10% pledge is worth watching; 25%+ is a serious red flag.",
  },
  market_cap_tier: {
    title: "Market Cap",
    body: "Share price × shares outstanding. Determines the company's size tier (large/mid/small/micro-cap), which affects liquidity and execution risk.",
  },
  dma: {
    title: "Moving Average (DMA)",
    body: "Average closing price over the trailing window (50 or 200 days). Price above both DMAs, with the 50-day above the 200-day, is a classic bullish trend structure ('golden cross').",
  },
  week52_range: {
    title: "52-Week Range Position",
    body: "How far the current price sits from its 52-week high/low. Near the high suggests momentum; near the low can be a value opportunity or a falling knife depending on business quality.",
  },
  sales_growth_window: {
    title: "Compounded Sales Growth",
    body: "Revenue CAGR over the stated window (3/5/10 years or TTM). Longer windows show durability; shorter windows show recent momentum - compare both to spot acceleration or deceleration.",
  },
  profit_growth_window: {
    title: "Compounded Profit Growth",
    body: "Net profit CAGR over the stated window. If this consistently beats sales growth, the business is gaining operating leverage - margins are expanding as it scales.",
  },
  stock_price_cagr: {
    title: "Stock Price CAGR",
    body: "Annualised return an investor would have earned holding the stock over the stated window, based purely on price appreciation (excludes dividends).",
  },
  roe_growth_window: {
    title: "Return on Equity",
    body: "Average Return on Equity over the stated window - net profit ÷ shareholders' equity. A consistently high ROE across windows signals a durable, capital-efficient business rather than a one-off good year.",
  },

  // ── Compare table headers ──
  market_cap: {
    title: "Market Capitalisation",
    body: "Share price × number of shares outstanding. The market's total valuation of the company. Used here for sizing and for sector concentration metrics.",
  },
  ev_ebitda: {
    title: "EV / EBITDA",
    body: "Enterprise value ÷ EBITDA. A capital-structure-neutral version of P/E - useful when comparing leveraged companies. Below 12× is attractive in most sectors.",
  },
};
