import type { MetricEntry } from "../types";

export const sectorMetrics: MetricEntry[] = [
  {
    id: "industry-pe",
    term: "Industry P/E (Sector Median)",
    category: "sector",
    tagline: "The yardstick that turns 'expensive' or 'cheap' into a meaningful answer.",
    inOneSentence:
      "Industry P/E is the median P/E across all companies in a sector — the benchmark you should compare any single company's P/E against.",
    intuition:
      "A P/E of 30 sounds expensive in absolute terms — but if every other IT company trades at 35, the stock is actually cheap relative to its peers. Industry P/E gives you that context. Cross-sector P/E comparison is meaningless (banking and software exist on different planets); within-sector comparison is the only honest version.",
    concreteExample: {
      setup: "Stock A has a P/E of 22. The IT services sector median P/E is 28.",
      walkthrough: "Stock A trades at 22 ÷ 28 = 0.79 — i.e. 21% below sector median.",
      takeaway:
        "Either A has a real problem (slower growth, weaker margins) explaining the discount, or it's a relative bargain. The number alone doesn't decide — it tells you what question to ask.",
    },
    formula: { plain: "Industry P/E = Median P/E across all listed companies in the sector (excluding loss-makers)" },
    inputs: [
      { name: "Member P/Es", meaning: "P/E for every company in the sector with positive earnings", source: "Computed" },
    ],
    methodology:
      "We use the median (not the mean) because a handful of high-P/E outliers (just-turned-profitable companies, hyper-growth names) can drag the mean upward without representing the sector. Loss-making companies are excluded — they have no meaningful P/E.",
    whyThisConstruction:
      "Median resists outlier distortion; mean does not. For a small sector (5 companies), even one extreme value can move the mean by 30% without changing the typical company's valuation. The median is what the 'middle company' actually trades at, which is the relevant comparison.",
    benefits: [
      "Anchors valuation judgments in a sector-specific baseline.",
      "Highlights sector-wide rerating events (when median moves, every stock is being repriced).",
    ],
    limitations: [
      "Sector definitions are imperfect — a multi-segment conglomerate may not belong to any single sector cleanly.",
      "Small sectors (< 5 listed companies) have unstable medians.",
    ],
    howToRead: [
      { label: "Company P/E < 80% of industry median", desc: "Possible undervaluation. Verify with growth, ROCE, and margin trends." },
      { label: "Company P/E within ±20% of industry median", desc: "Roughly priced in line with peers. Differentiation lies elsewhere." },
      { label: "Company P/E > 130% of industry median", desc: "Premium pricing. Market is betting on superior fundamentals — check if they're delivering." },
    ],
    pairsWellWith: ["pe", "peg", "roce"],
    traps: [
      "If the entire sector is in a bubble, 'in line with sector' just means 'expensive with company'.",
      "Sector means very little for hyper-diversified businesses (e.g. Reliance, ITC) — judge them segment-by-segment.",
    ],
  },
  {
    id: "score-bands",
    term: "Stockscore Classification (Avoid → Exceptional)",
    category: "sector",
    tagline: "Plain-English labels for the final 0–100 score.",
    inOneSentence:
      "Stockscore maps the final 0–100 number into five labels: Avoid, Watchlist, Accumulate, Invest-grade, Exceptional — so the score has actionable meaning.",
    intuition:
      "A score of 73 is meaningless on its own. The band tells you what to do with it: Invest-grade companies meet the bar for a long-term portfolio holding; Watchlist companies have promise but a missing piece; Avoid is exactly what it sounds like. The bands are calibrated against historical outcomes — not arbitrary.",
    concreteExample: {
      setup: "Company gets a final score of 78, classified 'Invest-grade'.",
      walkthrough:
        "78 sits in the 75–84 band → 'Invest-grade' = passes every major filter (profitability, growth, balance sheet, cash quality) with at least one category genuinely above average.",
      takeaway:
        "An Invest-grade stock can sit in a long-term portfolio. It doesn't guarantee outperformance — it certifies that the obvious risks have been screened out.",
    },
    formula: {
      plain:
        "Bands: 0–34 Avoid · 35–54 Watchlist · 55–74 Accumulate · 75–89 Invest-grade · 90–100 Exceptional",
    },
    inputs: [
      { name: "Final Score", meaning: "Raw 10-category score + bonuses − penalties, capped by industry ceiling", source: "Scorer" },
    ],
    methodology:
      "Industry ceilings: tobacco caps at 75, financials at 80, all others at 100. These reflect sector-specific structural risks that the scoring rubric does not otherwise penalize.",
    whyThisConstruction:
      "Numeric scores create false precision. Labels force a decision: invest, watch, or avoid. The five-band structure mirrors how credit ratings work (AAA → D) and how analyst recommendations are usually summarized.",
    benefits: [
      "Decisional, not just descriptive.",
      "Stable thresholds — a score change within a band doesn't trigger a label change.",
    ],
    limitations: [
      "Bands are calibrated to long-term holding, not trading.",
      "A classification is not a recommendation; it's a screen result.",
    ],
    howToRead: [
      { label: "Avoid", desc: "Multiple major red flags. Even a price crash usually doesn't change the verdict." },
      { label: "Watchlist", desc: "One or two structural issues. Worth monitoring for change." },
      { label: "Accumulate", desc: "Mostly clean. Suitable for incremental building if valuation is reasonable." },
      { label: "Invest-grade", desc: "Passes every major filter; one or more standout strengths." },
      { label: "Exceptional", desc: "Top-tier on virtually every dimension. Rare." },
    ],
    pairsWellWith: ["pe", "roce", "cfo-pat"],
    traps: [
      "A high score does not override valuation — an Exceptional company at 80x P/E may still be a poor entry point.",
      "Industry ceilings mean some great businesses can never get above 80 in our system. The cap is a feature, not a bug.",
    ],
  },
];
