import type { MetricEntry } from "../types";

export const valuationMetrics: MetricEntry[] = [
  {
    id: "pe",
    term: "P/E Ratio",
    category: "valuation",
    tagline: "The rupees you pay today to claim ₹1 of yearly profit.",
    alsoCalled: ["Price-to-Earnings", "Earnings multiple", "PE multiple"],
    inOneSentence:
      "P/E tells you how many rupees the market is asking you to pay for every ₹1 of profit the company makes in a year.",
    intuition:
      "Imagine the company is a tiny shop that makes ₹1 profit a year. If the shop is for sale at ₹25, its P/E is 25. You are paying ₹25 today for the right to claim ₹1 of profit every year. If profit stays flat forever, it would take 25 years to earn back your money - that's why P/E is also called the 'payback multiple.'",
    concreteExample: {
      setup:
        "TCS trades at ₹3,800 per share. Its EPS (earnings per share) over the last 12 months is ₹125.",
      walkthrough:
        "P/E = ₹3,800 ÷ ₹125 = 30.4x. You are paying ₹30.40 for every ₹1 of current profit per share.",
      takeaway:
        "Whether 30.4x is cheap or expensive depends entirely on growth. If TCS grows EPS at 15% a year, that ₹1 becomes ₹2 in five years - the effective P/E drops. If EPS stays flat, 30.4x is steep.",
    },
    formula: { plain: "P/E = Current Share Price ÷ Earnings Per Share (EPS)" },
    inputs: [
      { name: "Share Price", meaning: "Latest market price", source: "Market" },
      {
        name: "EPS",
        meaning:
          "Net profit available to equity holders, divided by shares outstanding",
        source: "P&L",
      },
    ],
    methodology:
      "We use trailing-twelve-month (TTM) EPS from the most recent four quarters reported on screener.in. If the company is loss-making (EPS ≤ 0), we mark P/E as 'n/a' rather than show a misleading negative or huge positive number. The current share price is the latest close.",
    whyThisConstruction:
      "Using TTM EPS - instead of last full-year or forward estimates - anchors the ratio to data that has actually happened. Forward P/E depends on analyst forecasts that often miss; trailing P/E is honest. We use net profit (not EBITDA) in the denominator because P/E is meant to answer 'what do I, the equity holder, earn?' - and net profit is what's left after debt-holders and the tax authority are paid.",
    benefits: [
      "Single number; instantly comparable across companies in the same sector.",
      "Connects directly to shareholder reality - earnings per share is what equity owners ultimately get.",
      "Universally understood - every investor, broker, and screen uses it.",
    ],
    limitations: [
      "Useless for loss-making companies.",
      "Distorted by one-time gains/losses (asset sales, write-offs).",
      "Ignores debt - two companies with identical P/E can have very different risk profiles. Use EV/EBITDA when debt matters.",
      "At the top of a cyclical earnings cycle, P/E looks deceptively low.",
    ],
    alternatives: [
      {
        name: "PEG",
        whenBetter:
          "When you want to factor in growth - a high P/E with high growth can be cheaper than a low P/E with no growth.",
      },
      {
        name: "EV/EBITDA",
        whenBetter:
          "When comparing companies with very different debt levels or tax rates.",
      },
      {
        name: "P/B",
        whenBetter:
          "For banks, NBFCs, and asset-heavy businesses where earnings are volatile but book value is stable.",
      },
    ],
    howToRead: [
      {
        label: "Low P/E",
        desc: "Could be cheap - or the market expects earnings to fall. Always ask why.",
      },
      {
        label: "High P/E",
        desc: "Market expects strong growth. You're paying upfront for future profits.",
      },
      {
        label: "vs Industry P/E",
        desc: "The most useful comparison. 15x in banking is rich; 15x in IT is a bargain.",
      },
    ],
    ranges: {
      bad: "< 5 (distressed) or > 80 (speculative)",
      ok: "Industry median ± 20%",
      good: "20–30% below industry median with improving earnings",
      note: "Always compare within sector. Cross-sector P/E comparison is the #1 beginner mistake.",
    },
    sectorNotes: [
      {
        sector: "Banks/NBFCs",
        note: "P/E means less than P/B here. Bank earnings can swing with provisioning cycles.",
      },
      {
        sector: "Cyclicals (metals, cement)",
        note: "Low P/E at the cycle top is a warning, not a bargain. EPS is temporarily inflated.",
      },
      {
        sector: "High-growth IT/Pharma",
        note: "P/E of 35–45 can be reasonable if the company compounds EPS at 18%+.",
      },
    ],
    traps: [
      "Low P/E ≠ cheap. A dying business has a low P/E for a reason.",
      "Trailing P/E lags reality - a quarter of weak earnings hasn't shown up in EPS yet.",
      "EPS can be massaged by buybacks (lower share count → higher EPS without business improvement).",
    ],
    pairsWellWith: ["eps-growth", "roce", "industry-pe"],
    redFlags: [
      "P/E below 8 in a growing sector while peers trade at 20+. Either the market knows something, or it's a one-time gain making earnings look bigger than they are.",
    ],
  },
  {
    id: "pb",
    term: "Price to Book (P/B)",
    category: "valuation",
    tagline: "What you pay for ₹1 of the company's net assets.",
    alsoCalled: ["P/BV", "Price-to-Book-Value"],
    inOneSentence:
      "P/B compares the stock's market price to the company's book value per share - the per-share value of its assets minus liabilities.",
    intuition:
      "Book value is what would theoretically be left for shareholders if the company sold all its assets at the values on its balance sheet and paid off all debts. P/B of 1 means the market values the business at exactly its accounting net worth. P/B of 4 means the market is paying ₹4 for every ₹1 of accounting equity - usually because it expects the business to earn high returns on that equity.",
    concreteExample: {
      setup: "HDFC Bank trades at ₹1,600. Book value per share is ₹520.",
      walkthrough:
        "P/B = ₹1,600 ÷ ₹520 = 3.08x. You're paying ₹3.08 for every ₹1 of net assets on the books.",
      takeaway:
        "For a bank that consistently earns 17% ROE, paying 3x book is rational - that book grows at 17% a year. For a bank earning 8% ROE, 3x book is expensive.",
    },
    formula: { plain: "P/B = Share Price ÷ Book Value Per Share" },
    inputs: [
      { name: "Share Price", meaning: "Latest market price", source: "Market" },
      {
        name: "Book Value Per Share",
        meaning:
          "(Shareholders' Equity − Preferred Equity) ÷ Shares Outstanding",
        source: "Balance Sheet",
      },
    ],
    methodology:
      "Book value comes from the latest reported quarterly balance sheet. We use stated book value as reported, without re-marking intangibles or goodwill - those are noted as limitations.",
    whyThisConstruction:
      "Book value, unlike earnings, doesn't swing quarter to quarter. For financial companies whose earnings are volatile (provisioning, NPAs), P/B is far more stable than P/E. It's also closer to a 'liquidation floor' for asset-heavy businesses.",
    benefits: [
      "Stable denominator - works during earnings downturns when P/E breaks.",
      "Especially meaningful for banks, NBFCs, insurance, and asset-heavy businesses.",
      "Pairs cleanly with ROE: P/B ÷ ROE roughly equals 'years to earn back what you paid.'",
    ],
    limitations: [
      "Meaningless for asset-light businesses (software, consulting) where most value is people and brand - not on the balance sheet.",
      "Book value can be inflated by goodwill from past acquisitions that may be worthless today.",
      "Doesn't account for off-balance-sheet liabilities (lease commitments, contingent claims).",
    ],
    alternatives: [
      { name: "P/E", whenBetter: "When earnings are stable and predictable." },
      {
        name: "EV/EBITDA",
        whenBetter:
          "For comparing operating businesses with different debt structures.",
      },
    ],
    howToRead: [
      {
        label: "P/B < 1",
        desc: "Market values the company below its accounting net worth. Often distressed; sometimes a real bargain.",
      },
      {
        label: "P/B 1–3",
        desc: "Typical range for solid businesses earning a reasonable ROE.",
      },
      {
        label: "P/B > 5",
        desc: "Justified only if ROE is consistently high (20%+). Otherwise rich.",
      },
    ],
    sectorNotes: [
      {
        sector: "Banks/NBFCs",
        note: "Primary valuation metric. Cross-check with ROE - a bank trading at 2x P/B should earn at least 15% ROE.",
      },
      {
        sector: "IT/Software",
        note: "P/B is misleading - book value barely reflects the actual business. Use P/E or EV/EBITDA.",
      },
      {
        sector: "Capital goods/Steel",
        note: "P/B near 1 in a cyclical trough can be an entry point if balance sheet is clean.",
      },
    ],
    traps: [
      "A P/B of 0.5 looks like a steal until you realize 70% of book value is intangible goodwill.",
      "Recent revaluation reserves can inflate book value without any actual cash being earned.",
    ],
    pairsWellWith: ["roe", "pe", "de"],
  },
  {
    id: "ev-ebitda",
    term: "EV / EBITDA",
    category: "valuation",
    tagline:
      "What it would cost to buy the entire business - divided by its annual operating cash earnings.",
    alsoCalled: ["Enterprise multiple"],
    inOneSentence:
      "EV/EBITDA is like P/E for the whole business, including debt - useful when comparing companies with different debt levels.",
    intuition:
      "Imagine you wanted to buy the entire company outright. You'd pay shareholders the market cap AND take over the debt (minus cash on hand). That total cost is Enterprise Value. EBITDA is the company's annual operating profit before depreciation, interest, and tax - the rough cash the business throws off. EV/EBITDA tells you how many years of operating cash flow it would take to recoup the takeover price.",
    concreteExample: {
      setup:
        "A company has market cap ₹10,000 Cr, debt ₹3,000 Cr, cash ₹500 Cr. EBITDA last year was ₹1,500 Cr.",
      walkthrough:
        "EV = 10,000 + 3,000 − 500 = ₹12,500 Cr. EV/EBITDA = 12,500 ÷ 1,500 = 8.3x.",
      takeaway:
        "It would take 8.3 years of EBITDA to recoup the full takeover cost. Compared to a peer at EV/EBITDA of 14x, this looks cheaper - assuming the EBITDA quality is similar.",
    },
    formula: { plain: "EV/EBITDA = (Market Cap + Debt − Cash) ÷ EBITDA" },
    inputs: [
      {
        name: "Market Cap",
        meaning: "Share price × shares outstanding",
        source: "Market",
      },
      {
        name: "Debt",
        meaning: "Short-term + long-term borrowings",
        source: "Balance Sheet",
      },
      {
        name: "Cash",
        meaning: "Cash + cash equivalents + liquid investments",
        source: "Balance Sheet",
      },
      {
        name: "EBITDA",
        meaning: "Operating profit + depreciation + amortization",
        source: "P&L",
      },
    ],
    methodology:
      "We use TTM EBITDA. Debt and cash are taken from the most recent quarterly balance sheet. Enterprise Value uses market values for equity and book values for debt (a standard simplification - corporate-finance textbooks call out the inaccuracy but it's how the market actually quotes the ratio).",
    whyThisConstruction:
      "P/E gets distorted by capital structure (a debt-heavy company has lower net profit because of interest). EV/EBITDA strips this out - by adding debt to the numerator and removing interest from the denominator (EBITDA is pre-interest), it lets you compare a debt-heavy infra company with a debt-free IT firm on apples-to-apples terms.",
    benefits: [
      "Capital-structure neutral - works across debt-heavy and debt-light companies.",
      "Tax-neutral - useful for cross-border or holding-company comparisons.",
      "Closer to 'what would an acquirer pay?' - used in actual M&A negotiations.",
    ],
    limitations: [
      "EBITDA ignores depreciation, which is a real cost for capital-heavy businesses (a steel plant wears out).",
      "EBITDA also ignores changes in working capital - a company with ballooning receivables can show strong EBITDA but no real cash.",
      "Inflates the apparent quality of cyclical businesses near the top of their cycle.",
    ],
    alternatives: [
      {
        name: "EV/EBIT",
        whenBetter:
          "When depreciation is a real economic cost (capital-intensive sectors).",
      },
      {
        name: "P/E",
        whenBetter:
          "When debt is negligible and you care about per-share economics.",
      },
    ],
    howToRead: [
      {
        label: "EV/EBITDA < 8",
        desc: "Cheap on absolute basis. Verify EBITDA quality and growth.",
      },
      {
        label: "EV/EBITDA 8–15",
        desc: "Typical for stable businesses with moderate growth.",
      },
      {
        label: "EV/EBITDA > 20",
        desc: "Expensive - needs high growth or expanding margins to justify.",
      },
    ],
    sectorNotes: [
      {
        sector: "Banks",
        note: "Don't use. EBITDA is meaningless for financial businesses.",
      },
      {
        sector: "Capital-heavy (cement, steel, telecom)",
        note: "Preferred metric - neutralizes huge depreciation differences.",
      },
    ],
    traps: [
      "EBITDA can be flattered by aggressive cost capitalization - costs that should hit the P&L are pushed to depreciation and removed from the metric.",
      "EV ignores minority interest and preferred shares - for holding companies, add these to the numerator.",
    ],
    pairsWellWith: ["pe", "opm", "de"],
  },
  {
    id: "market-cap",
    term: "Market Cap",
    category: "valuation",
    tagline: "What the whole equity slice of the business is worth right now.",
    alsoCalled: ["Market Capitalisation"],
    inOneSentence:
      "Market cap is the total rupee value of all the company's shares at today's price - what it would (theoretically) cost to buy out every shareholder.",
    intuition:
      "If a company has 100 crore shares and each trades at ₹500, the market is collectively saying the equity is worth ₹50,000 Cr. It doesn't tell you what the company is worth in absolute terms - only what the market is paying for it today. Market cap is the size label, not the valuation judgment.",
    concreteExample: {
      setup:
        "Reliance Industries has roughly 676 Cr shares outstanding. Price ₹2,900.",
      walkthrough:
        "Market Cap = 676 × ₹2,900 ≈ ₹19,60,000 Cr (~₹19.6 lakh Cr).",
      takeaway:
        "Reliance is in the 'mega-cap' bucket - its sheer size dictates institutional ownership and slow but stable price action.",
    },
    formula: { plain: "Market Cap = Share Price × Total Shares Outstanding" },
    inputs: [
      { name: "Share Price", meaning: "Latest market price", source: "Market" },
      {
        name: "Shares Outstanding",
        meaning: "Total equity shares issued and not bought back",
        source: "Balance Sheet / Filings",
      },
    ],
    methodology:
      "Shares outstanding from the latest annual report or quarterly filing. Excludes treasury shares (already bought back). Doesn't include diluted shares from options unless materially exercised.",
    whyThisConstruction:
      "Multiplying price by shares gives the market's collective vote on equity value. It doesn't include debt - that's by design. Market cap is specifically the equity-holder slice; Enterprise Value is the whole-business slice.",
    benefits: [
      "Simple bucket for risk-and-style classification (large/mid/small cap).",
      "Drives index inclusion (Nifty 50, Sensex use a free-float-adjusted version).",
      "Determines liquidity - larger caps have tighter spreads.",
    ],
    limitations: [
      "Says nothing about valuation richness - a ₹1 lakh Cr business can be cheap or expensive.",
      "Includes only equity - for indebted companies, market cap understates the true business size.",
      "Can grow purely from price rerating without any business improvement.",
    ],
    howToRead: [
      {
        label: "Large-cap (> ₹20,000 Cr)",
        desc: "Institutional coverage, deep liquidity, slower but steadier moves.",
      },
      {
        label: "Mid-cap (₹5,000–20,000 Cr)",
        desc: "Often the growth sweet spot - large enough to research, small enough to compound.",
      },
      {
        label: "Small-cap (< ₹5,000 Cr)",
        desc: "Less researched, less liquid. Higher risk; higher potential reward.",
      },
    ],
    sectorNotes: [
      {
        sector: "Banks/NBFCs",
        note: "Use market cap × (1 + Debt/Equity) for a fairer comparison with non-financial peers.",
      },
    ],
    traps: [
      "Don't confuse market cap with enterprise value - EV adds debt back. For acquisition math, always use EV.",
      "Free-float market cap (excluding promoter holdings) is what indices use; total market cap is what brokerages quote.",
    ],
    pairsWellWith: ["ev-ebitda", "promoter-holding"],
  },
  {
    id: "dividend-yield",
    term: "Dividend Yield",
    category: "valuation",
    tagline: "The cash return rate you get just from holding the stock.",
    inOneSentence:
      "Dividend yield is the annual dividend the company pays per share, expressed as a percentage of the current share price.",
    intuition:
      "If a stock costs ₹100 and pays ₹4 in dividends a year, the yield is 4%. It's directly comparable to a fixed deposit rate - but unlike an FD, the dividend can grow (or be cut), and the underlying price moves too. Yield is what the stock pays you while you wait for it to appreciate.",
    concreteExample: {
      setup:
        "ITC trades at ₹450 and paid ₹15.50 in total dividends over the last 12 months.",
      walkthrough: "Dividend Yield = ₹15.50 ÷ ₹450 = 3.4%.",
      takeaway:
        "ITC offers ~3.4% cash yield while the bank FD rate is ~7%. That gap is the 'price' you pay for owning equity instead of debt - you accept lower current income for the chance of price appreciation and dividend growth.",
    },
    formula: {
      plain:
        "Dividend Yield = Annual Dividend Per Share ÷ Current Share Price × 100",
    },
    inputs: [
      {
        name: "Annual Dividend Per Share",
        meaning: "Sum of dividends declared in the last 12 months",
        source: "Filings",
      },
      { name: "Share Price", meaning: "Latest market price", source: "Market" },
    ],
    methodology:
      "We use TTM dividends actually declared (interim + final + special), not announced future dividends. Special dividends are included because they hit your bank - but flagged in the methodology since they are one-offs.",
    whyThisConstruction:
      "Trailing dividend is more honest than forward - companies routinely 'announce' dividend policies they later cut. Using cash actually paid reflects the truth.",
    benefits: [
      "Directly comparable across asset classes (FD, bonds, stocks).",
      "Indicates how much of total return is income vs price appreciation.",
      "High and stable yields signal mature, cash-generating businesses.",
    ],
    limitations: [
      "Doesn't tell you if the dividend is sustainable - payout ratio reveals that.",
      "A 'high yield' is sometimes a value trap: yield is high because the price has crashed expecting a cut.",
      "Ignores buybacks - companies returning cash via buybacks (TCS, Infosys) show artificially low dividend yield.",
    ],
    alternatives: [
      {
        name: "Total Shareholder Yield",
        whenBetter:
          "When buybacks materially supplement dividends - add buyback yield to dividend yield.",
      },
    ],
    howToRead: [
      {
        label: "Yield < 1%",
        desc: "Growth company reinvesting all profits. Don't hold for income.",
      },
      {
        label: "Yield 2–4%",
        desc: "Mature, profitable business returning a sensible share of profits.",
      },
      {
        label: "Yield > 6%",
        desc: "Either a true cash-cow utility/PSU - or the market is pricing in a dividend cut.",
      },
    ],
    traps: [
      "Yield × payout = dividend as % of profit. If payout > 100%, the dividend isn't covered by earnings; check cash flow.",
      "Tax matters: dividends are taxed in your hands at slab rate. The post-tax yield can be much lower than the headline.",
    ],
    pairsWellWith: ["payout-ratio", "cfo-pat", "pe"],
  },
];
