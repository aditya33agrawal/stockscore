import Link from "next/link";
import { Github } from "lucide-react";

const CATEGORIES = [
  {
    name: "Valuation",
    max: 120,
    rationale:
      "Is the stock cheap or expensive on multiple lenses? P/E vs industry, P/BV, intrinsic value vs CMP, and PEG.",
    rules: [
      ["P/E vs Industry P/E", "+30 if PE/IndPE < 0.7, +15 if < 1.0, 0 if in line, -10 if > 1.5"],
      ["Price to Book Value", "+25 if PBV < 1, +15 if < 2, +5 if < 4, -10 if > 6"],
      ["Intrinsic Value vs CMP", "+35 if CMP/IV < 0.7 (margin of safety), +15 if < 1, -10 if > 1.5"],
      ["PEG Ratio", "+30 if 0 < PEG < 1, +15 if < 1.5, -10 if > 2, 0 if negative (flagged)"],
    ],
  },
  {
    name: "Profitability",
    max: 120,
    rationale:
      "Quality of earnings — are margins healthy and improving, and are returns on equity / capital strong?",
    rules: [
      ["OPM% (TTM, sector quartile)", "+30 top quartile, +20 second, +10 third, -10 bottom"],
      ["ROE (Last Year)", "+30 if > 20%, +20 if 15-20%, +10 if 10-15%, -10 if < 5%"],
      ["ROCE (Last Year)", "Same scale as ROE"],
      ["OPM trend (last 4 qtrs)", "+25 expanding, +10 flat, -10 contracting"],
    ],
  },
  {
    name: "Growth",
    max: 130,
    rationale:
      "5-year top-line and bottom-line CAGR, plus whether TTM is accelerating versus that 5Y base.",
    rules: [
      ["Sales CAGR 5Y", "+30 if > 20%, +18 if 10-20%, +10 if 5-10%, -10 if negative"],
      ["Profit CAGR 5Y", "Same scale as Sales 5Y"],
      ["TTM Sales vs 5Y avg", "+25 if accelerating, +10 inline, -10 if decelerating"],
      ["TTM Profit vs 5Y avg", "+25 if accelerating, +10 inline, -10 if decelerating"],
      ["EPS CAGR 5Y", "Same scale as Sales 5Y"],
    ],
  },
  {
    name: "Quarterly Momentum",
    max: 100,
    rationale:
      "Most recent quarter strength — both sequential (QoQ) and year-on-year (YoY).",
    rules: [
      ["QoQ Net Profit", "+30 if > 25%, +20 if 10-25%, +10 if 0-10%, -10 if negative"],
      ["YoY Net Profit", "Same scale"],
      ["Sales 4-qtr YoY", "+20 if 4/4 quarters growing, +10 if 2-3/4, -10 if 0-1/4"],
      ["OPM% last qtr vs year-ago", "+20 if > +2pp, +10 if 0-2pp, -10 if < -2pp"],
    ],
  },
  {
    name: "Balance Sheet",
    max: 100,
    rationale:
      "Leverage, debt trajectory, short-term liquidity, and reserves growth over 5 years.",
    rules: [
      ["Debt to Equity", "+30 if < 0.3, +20 if < 0.6, +10 if < 1, -20 if > 2"],
      ["Borrowings trend (3Y)", "+25 if declining, +10 if stable, -10 if rising sharply"],
      ["Current Ratio", "+20 if > 1.5, +10 if 1.2-1.5, -15 if < 1"],
      ["Reserves growth (5Y)", "+25 if consistently growing, +5 if stagnant, -10 if eroding"],
    ],
  },
  {
    name: "Cash Flow",
    max: 100,
    rationale:
      "How well reported profits convert to cash. FCF consistency. CFO trajectory.",
    rules: [
      ["CFO/Operating Profit (avg 3Y)", "+35 if > 80%, +20 if 60-80%, -15 if < 40%"],
      ["FCF positive years (last 3)", "+35 if 3/3, +20 if 2/3, -10 if 0-1/3"],
      ["CFO trend (3Y)", "+30 improving, +10 flat, -10 deteriorating"],
    ],
  },
  {
    name: "Shareholding",
    max: 100,
    rationale:
      "Promoter, FII, and DII confidence over the last 4 quarters. Pledged-share risk.",
    rules: [
      ["Promoter trend (4Q)", "+30 increasing, +15 stable, -20 decreasing (PSU: neutralised)"],
      ["FII trend (4Q)", "+25 buying, +5 flat, -10 selling"],
      ["DII trend (4Q)", "Same scale as FII"],
      ["Pledged %", "+20 if 0%, 0 if < 10%, -30 if > 30%"],
    ],
  },
  {
    name: "Dividend",
    max: 80,
    rationale:
      "Yield, consistency over the last 5 years, and whether the payout is sustainable.",
    rules: [
      ["Dividend Yield", "+30 if > 4%, +20 if 2-4%, +10 if 0.5-2%, 0 if zero"],
      ["Payout consistency", "+25 if paid all 5 years, +15 if 3-4, -5 if 0-2"],
      ["Dividend Payout %", "+25 if 20-50%, +10 if 10-20% or 50-70%, -10 if > 90%"],
    ],
  },
  {
    name: "Operational Efficiency",
    max: 80,
    rationale:
      "Working capital discipline. Are debtor days, inventory days, and cash conversion improving?",
    rules: [
      ["Debtor Days trend (3Y)", "+20 improving, 0 flat, -10 worsening"],
      ["Inventory Days trend (3Y)", "Same scale"],
      ["Cash Conversion Cycle (quartile)", "+20 top, +10 2nd, 0 3rd, -10 worst"],
      ["Working Capital Days trend", "Same scale as debtor days"],
    ],
  },
  {
    name: "Price & Technical",
    max: 70,
    rationale:
      "Price action context — how far below the 52-week high, how price has tracked fundamentals.",
    rules: [
      ["Down from 52w high", "+20 if 20-40% (value zone), +10 if 0-20%, -10 if > 50% (broken)"],
      ["Price 5Y vs Sales 5Y CAGR", "+20 if price < sales (cheap), +10 inline, 0 if price >> sales"],
      ["Up from 52w low", "+20 if 0-15% (early), +10 if 15-30%, 0 if > 50%"],
    ],
  },
];

export default function MethodologyPage() {
  const totalMax = CATEGORIES.reduce((a, c) => a + c.max, 0);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          Methodology
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-chalk-50">
          How the scoring works
        </h1>
        <p className="mt-4 text-chalk-300 text-lg leading-relaxed serif">
          Every company in a sector is scored on a 1000-point rubric across 10
          fundamental categories. The total is normalised to /100. Sector
          context matters: some metrics use absolute thresholds, others use
          quartiles within the input set.
        </p>
        <a
          href="https://github.com/"
          target="_blank"
          rel="noreferrer noopener"
          className="mt-4 inline-flex items-center gap-2 rounded-md border border-ink-700/60 px-3 py-1.5 text-xs hover:bg-ink-800/60"
        >
          <Github className="h-3.5 w-3.5" /> See the full implementation on
          GitHub
        </a>
      </header>

      {/* Why */}
      <section className="mb-12 space-y-4 text-chalk-200 serif text-lg leading-relaxed">
        <h2 className="text-2xl font-semibold text-chalk-50 not-italic font-sans">
          Why sector-relative?
        </h2>
        <p>
          An OPM of 8% sounds mediocre — until you realise it's the best in oil
          refining, where 6% is sector median. An ROE of 18% sounds excellent —
          until you compare it to private banks averaging 22%.
        </p>
        <p>
          Absolute thresholds catch obvious quality. But for metrics where the
          sector reality dominates (margins, working capital, leverage),
          peer-relative quartiles are far more honest. The rubric mixes both
          deliberately.
        </p>
      </section>

      {/* The 10 categories */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-chalk-50 mb-4">
          The 10 categories ({totalMax} pts)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-chalk-300/70 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left py-2">Category</th>
                <th className="text-right py-2 w-20">Max</th>
                <th className="text-right py-2 w-16">% of total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-700/40">
              {CATEGORIES.map((c) => (
                <tr key={c.name}>
                  <td className="py-2 text-chalk-100">{c.name}</td>
                  <td className="py-2 text-right num text-chalk-100">{c.max}</td>
                  <td className="py-2 text-right num text-chalk-300">
                    {((c.max / totalMax) * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="py-2 text-chalk-50">Total</td>
                <td className="py-2 text-right num text-chalk-50">
                  {totalMax}
                </td>
                <td className="py-2 text-right num text-chalk-50">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Per-category */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-chalk-50 mb-6">
          Category drilldown
        </h2>
        <div className="space-y-8">
          {CATEGORIES.map((c, i) => (
            <div key={c.name}>
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-semibold text-chalk-50">
                  {i + 1}. {c.name}
                </h3>
                <span className="num text-sm text-chalk-300">max {c.max}</span>
              </div>
              <p className="mt-1 text-sm text-chalk-300 serif">
                {c.rationale}
              </p>
              <ul className="mt-3 rounded-lg border border-ink-700/60 bg-ink-900/40 divide-y divide-ink-700/40">
                {c.rules.map(([rule, scale]) => (
                  <li key={rule} className="px-4 py-2 text-sm">
                    <p className="text-chalk-100 font-medium">{rule}</p>
                    <p className="text-xs text-chalk-300/80 num mt-0.5">
                      {scale}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Penalties */}
      <section className="mb-12 space-y-3 text-chalk-200 serif text-lg leading-relaxed">
        <h2 className="text-2xl font-semibold text-chalk-50 not-italic font-sans">
          Penalties (separate, on top)
        </h2>
        <p>
          Some risks are too important to dilute inside a category. Pledged
          shares above 30%, a sudden current-ratio collapse, or a 5-year decline
          in reserves trigger explicit penalties that deduct from the raw 1000
          before the /100 normalisation.
        </p>
      </section>

      {/* Sources */}
      <section className="mb-12 space-y-3 text-chalk-200 serif text-lg leading-relaxed">
        <h2 className="text-2xl font-semibold text-chalk-50 not-italic font-sans">
          Sources & limitations
        </h2>
        <p>
          All data is sourced from{" "}
          <a
            href="https://www.screener.in"
            className="text-accent hover:underline"
          >
            screener.in
          </a>
          . The scraper runs nightly. TTM versus FY mismatches, lag in
          shareholding filings, and one-off charges in profit can all distort
          scores — that's why the breakdown view always shows the underlying
          metric, not just the points.
        </p>
        <p className="text-base text-chalk-300">
          <strong className="text-chalk-50">This is not investment advice.</strong>{" "}
          The scoring is one input among many. Always read annual reports,
          listen to concalls, and form your own view.
        </p>
      </section>

      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-lg bg-accent text-ink-950 px-4 py-2 text-sm font-semibold hover:bg-accent/90"
      >
        Try it — pick a sector →
      </Link>
    </div>
  );
}
