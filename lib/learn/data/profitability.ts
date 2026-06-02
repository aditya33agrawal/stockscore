import type { MetricEntry } from "../types";

export const profitabilityMetrics: MetricEntry[] = [
  {
    id: "roce",
    term: "ROCE",
    category: "profitability",
    tagline: "How many rupees of operating profit the business squeezes from every ₹100 of capital it deploys.",
    alsoCalled: ["Return on Capital Employed"],
    inOneSentence:
      "ROCE measures how efficiently a business turns the total money put into it — both equity and debt — into operating profit.",
    intuition:
      "Think of the company as a machine. The fuel is 'capital employed' — every rupee of equity put in by owners plus every rupee of debt borrowed. The output is EBIT (operating profit before interest and tax). ROCE asks: for every ₹100 of fuel, how much output? A ROCE of 20% means the machine throws off ₹20 of operating profit annually per ₹100 of capital.",
    concreteExample: {
      setup: "Company has ₹500 Cr equity + ₹300 Cr debt = ₹800 Cr capital employed. EBIT last year was ₹160 Cr.",
      walkthrough: "ROCE = 160 ÷ 800 = 20%.",
      takeaway:
        "20% ROCE is excellent. Even after paying ~8% interest on the debt, the business is creating value — it earns more than the cost of the capital funding it.",
    },
    formula: { plain: "ROCE = EBIT ÷ Capital Employed × 100, where Capital Employed = Total Equity + Total Debt − Cash" },
    inputs: [
      { name: "EBIT", meaning: "Operating profit before interest and tax", source: "P&L" },
      { name: "Total Equity", meaning: "Shareholders' funds (equity + reserves)", source: "Balance Sheet" },
      { name: "Total Debt", meaning: "Short-term + long-term borrowings", source: "Balance Sheet" },
    ],
    methodology:
      "We use TTM EBIT in the numerator and the average of opening and closing capital employed for the period in the denominator (a flow ÷ stock ratio benefits from averaging — using only the closing balance overstates ROCE for fast-growing businesses).",
    whyThisConstruction:
      "EBIT (not net profit) is in the numerator because we want to judge the operations independent of how the company is financed and taxed. Capital employed (not just equity) is in the denominator because debt is also working capital — judging the business by how it uses all the money put to work, not just owners' money, is more honest. This is exactly the trick that distinguishes a great operator (high ROCE regardless of leverage) from a leveraged-up mediocre operator (high ROE, low ROCE).",
    benefits: [
      "Capital-structure agnostic — works across debt-heavy and debt-light peers.",
      "Captures core operating efficiency without tax/interest noise.",
      "Compares well across multi-year cycles — the trend is more telling than the single year.",
    ],
    limitations: [
      "Capital-light businesses (software, FMCG) naturally show very high ROCE — don't compare cross-sector.",
      "Capital employed at book value can be stale (especially for old fixed assets).",
      "A recent factory or acquisition temporarily depresses ROCE before contributing to EBIT.",
    ],
    alternatives: [
      { name: "ROIC", whenBetter: "When you want to net out non-operating assets (excess cash, investments) for a purer view." },
      { name: "ROE", whenBetter: "When you specifically care about shareholders' returns regardless of leverage." },
    ],
    howToRead: [
      { label: "ROCE > 20%", desc: "Excellent. Strong competitive advantage or pricing power." },
      { label: "ROCE 12–20%", desc: "Decent — comfortably above cost of capital. Value-creating." },
      { label: "ROCE < 10%", desc: "Likely destroying value if cost of capital is higher. Investigate." },
    ],
    ranges: {
      bad: "< 8%",
      ok: "10–15%",
      good: "> 18% sustained over 5 years",
    },
    sectorNotes: [
      { sector: "IT/Software", note: "Asset-light. 30%+ ROCE is normal — don't be impressed without comparing within sector." },
      { sector: "Banks/NBFCs", note: "ROCE is structurally misleading for financials. Use ROA or ROE instead." },
      { sector: "Power/Infra", note: "Long-gestation projects mean ROCE looks weak in build years; judge over a cycle." },
    ],
    traps: [
      "A high ROCE in year 1 after a write-off can look spectacular — capital employed shrank artificially.",
      "Aggressive lease accounting (operating vs finance) can hide capital employed off the balance sheet.",
    ],
    pairsWellWith: ["roe", "de", "opm"],
  },
  {
    id: "roe",
    term: "ROE",
    category: "profitability",
    tagline: "How much profit the company makes on every ₹100 of owners' money.",
    alsoCalled: ["Return on Equity"],
    inOneSentence:
      "ROE is net profit divided by shareholders' equity — what shareholders earn on the money they have left in the business.",
    intuition:
      "If you and your friends put ₹100 of your own money into a business and at year-end the business has ₹18 of net profit available, ROE is 18%. It tells you how good management is at turning your equity into bottom-line profit.",
    concreteExample: {
      setup: "A company has shareholders' equity of ₹1,000 Cr and reported net profit of ₹180 Cr.",
      walkthrough: "ROE = 180 ÷ 1,000 = 18%.",
      takeaway:
        "18% ROE is solid. Roughly speaking, if all profits were retained, your equity stake would compound at ~18% a year — much higher than the 7% fixed deposit rate.",
    },
    formula: { plain: "ROE = Net Profit ÷ Average Shareholders' Equity × 100" },
    inputs: [
      { name: "Net Profit", meaning: "Profit attributable to equity shareholders after tax and minority interest", source: "P&L" },
      { name: "Shareholders' Equity", meaning: "Equity share capital + reserves + retained earnings", source: "Balance Sheet" },
    ],
    methodology:
      "TTM net profit divided by average of opening and closing equity. We exclude one-time gains where flagged. For companies with significant minority interest, we use net profit attributable to the parent only.",
    whyThisConstruction:
      "Net profit (not EBIT) is in the numerator because ROE answers the equity holder's question: 'after the company pays its lenders and the tax authority, what's left for me?' Equity (not capital employed) is in the denominator for the same reason — ROE is the shareholder lens. Use ROCE to judge the business; use ROE to judge what the business returns to *you*.",
    benefits: [
      "Direct shareholder-relevance: it's the return on what you actually own.",
      "Combined with retention ratio, it predicts long-term book-value compounding.",
      "Universally tracked, easy to compare within sectors.",
    ],
    limitations: [
      "Inflated by debt. A company can lift ROE simply by buying back stock or borrowing more — without earning a single rupee more.",
      "Can be flattered by share buybacks shrinking the denominator.",
      "Negative-equity companies (huge accumulated losses written off) show meaningless ROE.",
    ],
    alternatives: [
      { name: "ROCE", whenBetter: "When you want to judge operating efficiency without leverage tricks." },
      { name: "5-year average ROE", whenBetter: "Always preferable to single-year ROE for stable conclusions." },
    ],
    howToRead: [
      { label: "ROE > 20%", desc: "Strong. Management consistently delivers high returns." },
      { label: "ROE 12–20%", desc: "Solid. Meaningfully above bank FD rates." },
      { label: "ROE < 10%", desc: "Weak. Compare with ROCE: if ROCE is higher, debt is dragging ROE; if ROCE is also low, the business itself is mediocre." },
    ],
    ranges: {
      bad: "< 10%",
      ok: "12–18%",
      good: "> 20% sustained 5+ years with low debt",
    },
    sectorNotes: [
      { sector: "Banks/NBFCs", note: "Primary profitability metric. 15%+ is the bar; below 12% is weak." },
      { sector: "Cyclicals", note: "ROE spikes at the cycle top. Always use 5-year averages." },
    ],
    traps: [
      "High debt artificially inflates ROE. Always read ROE alongside D/E.",
      "Buybacks lift ROE without improving the underlying business.",
      "Negative equity → division by a tiny number → wildly distorted ROE. Treat as 'n/a'.",
    ],
    pairsWellWith: ["roce", "de", "pb"],
  },
  {
    id: "opm",
    term: "Operating Profit Margin (OPM)",
    category: "profitability",
    tagline: "Of every ₹100 in sales, how many rupees survive as operating profit.",
    alsoCalled: ["EBIT Margin", "Operating Margin"],
    inOneSentence:
      "OPM is operating profit as a percentage of revenue — the cents-on-the-rupee that the core business actually keeps before interest and tax.",
    intuition:
      "Imagine you sell a ₹100 t-shirt. Cost of fabric ₹40, factory and salaries ₹25, marketing ₹15. You're left with ₹20 of operating profit before tax and interest. Your OPM is 20%. The higher the OPM, the more pricing power or cost discipline you have — and the more cushion you have when costs rise.",
    concreteExample: {
      setup: "Asian Paints reports revenue of ₹35,000 Cr and EBIT of ₹6,300 Cr.",
      walkthrough: "OPM = 6,300 ÷ 35,000 = 18%.",
      takeaway:
        "An 18% OPM in a competitive consumer business is exceptional and signals strong pricing power, brand premium, and tight cost control.",
    },
    formula: { plain: "OPM = EBIT ÷ Revenue × 100" },
    inputs: [
      { name: "EBIT", meaning: "Revenue − raw materials − wages − other operating expenses − depreciation", source: "P&L" },
      { name: "Revenue", meaning: "Net sales (excluding excise/GST)", source: "P&L" },
    ],
    methodology:
      "We use TTM revenue and EBIT. Other income is excluded from EBIT — we want the operating margin, not the boost from treasury gains. One-time items are included as reported; we don't ourselves normalize, but we surface unusually large swings in the company page.",
    whyThisConstruction:
      "EBIT (not EBITDA) keeps depreciation in the picture — for capital-heavy businesses, ignoring depreciation overstates the true operating margin. EBIT (not net profit) keeps interest and tax out — those depend on financing and jurisdiction, not on how well the business operates.",
    benefits: [
      "Direct read on pricing power and cost discipline.",
      "Trend over years tells you whether competition is intensifying or the moat is widening.",
      "Comparable within sectors regardless of debt or tax differences.",
    ],
    limitations: [
      "Not comparable across sectors — oil refining at 5% OPM is great; software at 5% is terrible.",
      "Depreciation policy differences distort cross-company comparison (use EBITDA margin to neutralize).",
      "One-off cost cuts can inflate OPM temporarily.",
    ],
    alternatives: [
      { name: "EBITDA Margin", whenBetter: "Comparing across companies with different asset bases or depreciation policies." },
      { name: "Gross Margin", whenBetter: "To isolate pricing power from operating cost discipline." },
    ],
    howToRead: [
      { label: "Rising OPM trend", desc: "Margins expanding — scale is kicking in or input costs are falling." },
      { label: "Stable OPM", desc: "Mature business with disciplined cost management." },
      { label: "Falling OPM", desc: "Competition or rising costs eating margin. Red flag if sustained for 4+ quarters." },
    ],
    sectorNotes: [
      { sector: "Software/IT", note: "20–28% is typical for tier-1 IT." },
      { sector: "Banks/NBFCs", note: "Use NIM (Net Interest Margin) instead — OPM doesn't apply meaningfully." },
      { sector: "Commodity/Refining", note: "Single-digit OPM is normal; obsess about volume and crack spreads instead." },
    ],
    traps: [
      "Reclassifying expenses from COGS to 'exceptional items' can inflate OPM artificially.",
      "Currency tailwinds (rupee weakening for exporters) lift OPM temporarily — separate the structural margin from the FX-led one.",
    ],
    pairsWellWith: ["roce", "ebitda-margin", "sales-growth"],
  },
];
