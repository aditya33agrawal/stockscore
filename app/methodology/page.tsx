import Link from "next/link";
import { Github, Info } from "lucide-react";

const CATEGORIES = [
  {
    name: "Quality of Business",
    weight: 18,
    rationale:
      "The core question: are the economics structurally good? Scored on ROCE, ROE, operating margins and capex discipline. OPM is benchmarked against the sector median so a refinery at 5% OPM is judged differently to an FMCG company at 5% OPM.",
    factors: [
      {
        label: "ROCE (latest)",
        formula: "logistic(x0=18%, hw=8.8pp)",
        reading: "Midpoint at 18%; 90% score at ~27%; 10% score at ~9%",
      },
      {
        label: "ROCE 5yr consistency",
        formula: "logistic on mean×(1−CV)",
        reading: "Rewards sustained ROCE over volatile ROCE — cyclical swings penalised",
      },
      {
        label: "ROE (latest)",
        formula: "logistic(x0=18%, hw=11pp)",
        reading: "Wider band — ROE is noisier than ROCE; <15% is weak, >30% exceptional",
      },
      {
        label: "OPM vs Sector Median",
        formula: "logistic(Δ vs sector median, x0=0, hw=6pp)",
        reading: "Relative factor — scored vs sector prior. Logged in assumptions.",
      },
      {
        label: "OPM Trend (3yr slope)",
        formula: "logistic(OLS slope, x0=0, hw=1.1pp/yr)",
        reading: "±1.1pp/yr annual slope saturates the score",
      },
      {
        label: "Capex / Depreciation (5yr avg)",
        formula: "band(0.5, 1.0, 2.5, 4.0)",
        reading: "Goldilocks: 1–2.5× = reinvesting for growth; <0.5 = under-investing; >4× = over-spending",
      },
      {
        label: "Margin Stability",
        formula: "linUp(OPM / sales_CV, 0, 30)",
        reading: "Rewards stable margins on stable revenue — penalises commodity-like volatility",
      },
    ],
  },
  {
    name: "Growth",
    weight: 16,
    rationale:
      "Magnitude and time both matter. We never ask 'is growth > X%' — we score on a continuous logistic curve, so 3× sales growth in 3 years scores materially higher than 2× in 3 years. 10-year weight is redistributed if data is missing.",
    factors: [
      { label: "Sales CAGR 10yr / 5yr / 3yr", formula: "logistic(x0=10/12/15%, hw=8pp)", reading: "Higher bar for shorter windows — recent performance must exceed long-term base" },
      { label: "PAT CAGR 10yr / 5yr / 3yr", formula: "logistic(x0=12/15/18%, hw=9pp)", reading: "Profit bar is higher than sales — operating leverage rewarded" },
      { label: "EPS CAGR 5yr", formula: "logistic(x0=15%, hw=9pp)", reading: "Per-share earnings — dilution-aware" },
      { label: "Earnings Acceleration", formula: "logistic(TTM growth − 5yr CAGR, x0=0, hw=10pp)", reading: "Gated: no credit if 5yr PAT CAGR ≤ 0" },
      { label: "Sales–PAT Alignment", formula: "linUp(PAT CAGR / Sales CAGR, 0, 1)", reading: "Full score if profit grows faster than sales — operating leverage" },
      { label: "Growth Durability", formula: "linUp(fraction of +ve YoY years, 0.5, 1.0)", reading: "Anti-cyclicality — rewards consistent growers" },
    ],
  },
  {
    name: "Valuation",
    weight: 14,
    rationale:
      "Combining absolute cheapness with peer-relative cheapness. All factors are explicitly guarded: negative P/E, negative book value, and non-positive growth yield zero score (not artificially high scores). The 52w drawdown factor is quality-gated to avoid rewarding falling knives.",
    factors: [
      { label: "P/E vs Industry", formula: "linDown(pe/industry_pe, 0.5, 1.8)", reading: "Full score at 50% of sector PE; zero at 1.8×" },
      { label: "P/E Absolute", formula: "linDown(pe, 12, 40)", reading: "Guarded: zero if PE ≤ 0" },
      { label: "Price to Book", formula: "If CMP ≤ BV → full; else linDown(P/B, 1.0, 3.0)", reading: "Zero above 3× P/B — user's explicit rule" },
      { label: "PEG Ratio", formula: "linDown(peg, 0.5, 2.5)", reading: "Guarded: zero if PEG ≤ 0 or growth ≤ 0" },
      { label: "Margin of Safety (IV)", formula: "linUp(gap, −0.2, 0.5)", reading: "Graham number: √(22.5 × EPS × BV). Logged if computed." },
      { label: "Dividend Yield", formula: "logistic(x0=2%, hw=1.5pp)", reading: "Caps gracefully at ~5% — avoids yield trap" },
      { label: "52w Drawdown (quality-gated)", formula: "linUp(0.10, 0.40) × quality gate", reading: "Withheld if Quality score < 60% — rewards buying quality on weakness only" },
    ],
  },
  {
    name: "Balance Sheet",
    weight: 12,
    rationale:
      "Solvency, leverage trajectory, and liquidity. D/E band edges are sector-aware — a utility with D/E=2.5 is judged very differently from a consumer company. The 'rising leverage' penalty was removed: it is fully captured by the debt trajectory factors.",
    factors: [
      { label: "Debt to Equity", formula: "band(sector-specific edges)", reading: "Sector-aware Goldilocks band. Hard-fail on negative book value." },
      { label: "Debt Trend (5yr)", formula: "linDown(current/5yAgo, 0.8, 2.0)", reading: "Falling debt rewarded; doubling = 0 score" },
      { label: "Debt Trend (10yr)", formula: "linDown(current/10yAgo, 0.8, 2.0)", reading: "Long-horizon leverage trajectory" },
      { label: "Pledged Shares", formula: "linDown(pledged%, 0, 10)", reading: "0% = full; ≥10% = 0. Heavy penalty also applied if ≥25%." },
      { label: "Debt vs Market Cap", formula: "linDown(debt/mcap, 0.10, 0.60)", reading: "Debt >60% of market cap = 0" },
      { label: "Current Ratio", formula: "band(0.8, 1.5, 3.0, 5.0)", reading: "Too high = idle capital; too low = liquidity risk" },
      { label: "Reserves CAGR 5yr", formula: "logistic(x0=10%, hw=7pp)", reading: "Compounding equity base" },
    ],
  },
  {
    name: "Cash Flow",
    weight: 10,
    rationale:
      "Are the profits real? CFO/PAT conversion quality, FCF consistency, FCF yield, and working capital discipline via receivables and inventory trend slopes.",
    factors: [
      { label: "Earnings Quality (CFO/PAT)", formula: "logistic(x0=0.85, hw=0.55)", reading: "Loosened half-width — range 0.30–1.40. Persistent failure (< 0.5) also penalised." },
      { label: "FCF Positive Years", formula: "(count/5) × 2", reading: "5 of 5 positive FCF years = full 2 pts" },
      { label: "FCF Yield", formula: "linUp(FCF/mcap, 1%, 7%)", reading: "7%+ FCF yield = full score" },
      { label: "Receivable Days Trend", formula: "linDown(OLS slope, 0, 15 days/yr)", reading: "Stretching >15 days/yr = 0 score — deteriorating WC" },
      { label: "Inventory Days Trend", formula: "linDown(OLS slope, 0, 20 days/yr)", reading: "Bloating >20 days/yr = 0 score" },
      { label: "CFO Growth Trend", formula: "logistic(norm slope, x0=0, hw=0.5)", reading: "Normalised by mean CFO" },
    ],
  },
  {
    name: "Quarterly Momentum",
    weight: 10,
    rationale:
      "Is now better than last year? Uses YoY comparisons (not QoQ noise), a 2yr stacked CAGR to resist base-effect manipulation, and an OPM trend slope. Other-income is scored as a positive-only factor (high other-income = lower score); extreme values trigger a separate penalty.",
    factors: [
      { label: "Revenue YoY + QoQ", formula: "logistic(x0=10%, hw=10pp) + logistic(x0=0, hw=5pp)", reading: "YoY carries 3× the weight of QoQ" },
      { label: "Net Profit YoY", formula: "logistic(x0=10%, hw=10pp)", reading: "" },
      { label: "PAT 2yr Stacked CAGR", formula: "logistic(x0=10%, hw=12pp)", reading: "(latest_q/q_8ago)^0.5 − 1. Base-effect resilient." },
      { label: "EPS YoY", formula: "logistic(x0=10%, hw=10pp)", reading: "" },
      { label: "OPM YoY Δ + OLS Slope", formula: "logistic(Δ, x0=0, hw=2.7pp) + logistic(slope, x0=0, hw=1.1)", reading: "Margin expansion weighted more than absolute margin level" },
      { label: "Other-Income Quality", formula: "linDown(other/PBT, 0.10, 0.30)", reading: "Score 1 if <10%; 0 if >30%. Penalty in §5 for >30%." },
      { label: "Profit Growth Streak", formula: "linUp(streak, 0, 4)", reading: "Consecutive YoY profit-growth quarters; capped at 4" },
    ],
  },
  {
    name: "Shareholding",
    weight: 8,
    rationale:
      "Who is buying, and in which direction? The promoter trend carries 3 pts — the single highest factor weight in this category — because promoter selling is a leading indicator of business deterioration that rarely appears in financials first.",
    factors: [
      { label: "Promoter Holding Level", formula: "linUp(25%, 60%)", reading: "Full score at ≥60%; zero if <25%" },
      { label: "Promoter Trend (8Q delta)", formula: "logistic(x0=0, hw=2pp)", reading: "Highest weight (3pts) — exit ≥5pp triggers separate penalty" },
      { label: "FII Trend (8Q delta)", formula: "logistic(x0=0, hw=3pp)", reading: "Wider band — FII flows are more volatile" },
      { label: "DII Trend (8Q delta)", formula: "logistic(x0=0, hw=3pp)", reading: "" },
      { label: "FII + DII Joint Buying", formula: "Binary +0.5", reading: "Smart-money confirmation — both FII and DII adding over 8Q" },
    ],
  },
  {
    name: "Peer Composite",
    weight: 6,
    rationale:
      "Is this the best company in its sector? Purely relative — each factor is the company's percentile rank among its screener.in peer set. Skipped if fewer than 3 peers; weight is redistributed to the top 4 categories.",
    factors: [
      { label: "P/E rank (lower better)", formula: "percentile × 1.0", reading: "" },
      { label: "ROCE rank", formula: "percentile × 1.0", reading: "" },
      { label: "OPM rank", formula: "percentile × 1.0", reading: "" },
      { label: "Quarterly profit growth rank", formula: "percentile × 1.0", reading: "" },
      { label: "Sales growth + Debt/Mcap + Div yield + Mcap", formula: "percentile × 0.5 each", reading: "Log-scaled Mcap — larger = less illiquidity risk" },
    ],
  },
  {
    name: "Price & Technical",
    weight: 4,
    rationale:
      "Is the price action confirming the fundamental case? Uses a 2-signal regime detector with zero fitted parameters — interpretable and reproducible. This approach is preferred over MACD/ADX/HMM for our data-parsimony constraint (single daily price + two DMAs).",
    factors: [
      { label: "DMA Stack", formula: "CMP > DMA50 > DMA200 → +1; reversed → −1", reading: "Golden/death cross structure" },
      { label: "52-week Position", formula: ">0.66 of range → +1; <0.33 → −1", reading: "Combined with DMA stack → 5-level regime" },
    ],
  },
  {
    name: "Size & Liquidity",
    weight: 2,
    rationale:
      "Not a quality factor — a discoverability and illiquidity tax. Large-caps get a 2pt premium; micro-caps get 0.5pt. The difference is explicitly a liquidity/institution-access adjustment, not a judgment on business quality.",
    factors: [
      { label: "Market Cap Tier", formula: ">₹50k Cr=2; >₹10k=1.5; >₹1k=1; else=0.5", reading: "" },
    ],
  },
];

const BONUSES = [
  { label: "Net Cash Company", points: "+2", trigger: "Total debt < cash equivalents" },
  { label: "Compounding Machine", points: "+2", trigger: "5yr ROE ≥18% AND 5yr PAT CAGR ≥15% AND D/E <0.5" },
  { label: "Dividend Aristocrat", points: "+1", trigger: "Dividend paid last year AND payout 20–60%" },
  { label: "Promoter Buying", points: "+1", trigger: "Promoters added ≥1.5pp in last 4 quarters" },
  { label: "Margin Expander", points: "+1", trigger: "OPM +3pp AND ROCE +5pp over 3yr" },
];

const PENALTIES = [
  { label: "Sin Business (Tobacco/Gambling)", points: "−4", trigger: "Detected from about/sector text; ceiling also applied" },
  { label: "Heavy Promoter Pledge", points: "−5", trigger: "Pledged ≥25%" },
  { label: "Promoter Exit", points: "−3", trigger: "Promoter holding fell ≥5pp in last 8 quarters" },
  { label: "Earnings Quality Red Flag", points: "−3", trigger: "5yr avg CFO/PAT < 0.5" },
  { label: "Other-Income Dependency", points: "−2 to −4", trigger: "Other income >30% of PBT (−2); >50% (−4)" },
  { label: "Float Dominated by Retail", points: "−1.5", trigger: "Public holding > max(FII, DII, Promoter)" },
  { label: "Illiquid Free Float", points: "−2", trigger: "Free float <15% AND mcap <₹5,000 Cr" },
  { label: "Persistent FCF Deficit", points: "−2", trigger: "FCF negative in ≥4 of last 5 years" },
];

const BANDS = [
  { label: "Avoid",       range: "0–39",  desc: "Material flaws across multiple categories." },
  { label: "Watchlist",   range: "40–54", desc: "Mixed signals; revisit at lower valuation." },
  { label: "Accumulate",  range: "55–69", desc: "Solid business; deploy on weakness." },
  { label: "Invest-grade",range: "70–84", desc: "Compounder candidate; core position eligible." },
  { label: "Exceptional", range: "85+",   desc: "Top-decile; size up." },
];

export default function MethodologyPage() {
  const totalWeight = CATEGORIES.reduce((a, c) => a + c.weight, 0);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* Header */}
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Methodology</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-chalk-50">
          How the scoring works
        </h1>
        <p className="mt-4 text-chalk-300 text-lg leading-relaxed serif">
          Every company is scored on a 100-point rubric across 10 fundamental categories using{" "}
          <strong className="text-chalk-50">continuous logistic and linear curves</strong> — no step
          thresholds. A marginal improvement in any metric produces a marginal improvement in score.
        </p>
        <a
          href="https://github.com/"
          target="_blank"
          rel="noreferrer noopener"
          className="mt-4 inline-flex items-center gap-2 rounded-md border border-ink-700/60 px-3 py-1.5 text-xs hover:bg-ink-800/60"
        >
          <Github className="h-3.5 w-3.5" /> See the full implementation on GitHub
        </a>
      </header>

      {/* Design principles */}
      <section className="mb-12 space-y-4 text-chalk-200 serif text-lg leading-relaxed">
        <h2 className="text-2xl font-semibold text-chalk-50 not-italic font-sans">Design principles</h2>
        <p>
          The v2 algorithm addresses three weaknesses in typical screener scoring systems:
        </p>
        <ol className="space-y-3 ml-5 list-decimal text-base">
          <li>
            <strong className="text-chalk-50">No cliff edges.</strong> A company at ROE 19.9% and
            one at ROE 20.1% get virtually the same score. We use logistic curves parameterised as{" "}
            <code className="text-xs bg-ink-800 px-1.5 py-0.5 rounded">logistic(x₀, half_width)</code> — both
            values are economically interpretable: midpoint and saturation distance.
          </li>
          <li>
            <strong className="text-chalk-50">Absolute + relative.</strong> &ldquo;ROCE &gt; 20% is
            great&rdquo; is true on average but wrong for oil refiners where 12% is excellent. OPM is
            scored relative to the sector median; the D/E band is sector-specific.
          </li>
          <li>
            <strong className="text-chalk-50">Magnitude and time encoded.</strong> Sales growing 3× in
            3 years scores materially more than 2× in 3 years because the CAGR feeds a continuous
            logistic — not a threshold.
          </li>
        </ol>
      </section>

      {/* Scoring primitives */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-chalk-50 mb-4">Scoring primitives</h2>
        <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 divide-y divide-ink-700/40">
          {[
            {
              name: "linUp(x, lo, hi)",
              desc: "More is better. Score = 0 at lo, 1 at hi. Linear ramp.",
            },
            {
              name: "linDown(x, lo, hi)",
              desc: "Less is better. Score = 1 at lo, 0 at hi. Linear ramp.",
            },
            {
              name: "band(x, a, b, c, d)",
              desc: "Goldilocks zone. Ramps to 1 on [a,b), holds 1 on [b,c], ramps to 0 on (c,d].",
            },
            {
              name: "logistic(x, x₀, half_width)",
              desc: "Smooth saturating curve. x₀ = midpoint (score 0.5); half_width = distance at which score reaches 0.9. k = ln(9)/hw.",
            },
          ].map((p) => (
            <div key={p.name} className="px-5 py-3 grid md:grid-cols-[220px_1fr] gap-2">
              <code className="text-xs text-accent font-mono">{p.name}</code>
              <p className="text-sm text-chalk-300">{p.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-chalk-300/60">
          All primitives return [0, 1]. Points = weight × primitive(). This guarantees monotonicity, no cliff edges, and analytic differentiability for sensitivity analysis.
        </p>
      </section>

      {/* Category weights */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-chalk-50 mb-4">Category weights ({totalWeight} pts)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-chalk-300/70 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left py-2">Category</th>
                <th className="text-right py-2 w-16">Weight</th>
                <th className="text-right py-2 w-16">% of total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-700/40">
              {CATEGORIES.map((c) => (
                <tr key={c.name}>
                  <td className="py-2 text-chalk-100">{c.name}</td>
                  <td className="py-2 text-right num text-chalk-100">{c.weight}</td>
                  <td className="py-2 text-right num text-chalk-300">
                    {((c.weight / totalWeight) * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="py-2 text-chalk-50">Total (raw)</td>
                <td className="py-2 text-right num text-chalk-50">{totalWeight}</td>
                <td className="py-2 text-right num text-chalk-50">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-chalk-300/60">
          Bonuses (max +5) and penalties (max −14) apply on top of raw total. Ceiling: 75 for sin industries, 90 for cyclical sectors, 100 otherwise.
        </p>
      </section>

      {/* Category drilldown */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-chalk-50 mb-6">Category drilldown</h2>
        <div className="space-y-6">
          {CATEGORIES.map((c, i) => (
            <div key={c.name} className="rounded-xl border border-ink-700/60 bg-ink-900/40 overflow-hidden">
              <div className="px-5 py-4 border-b border-ink-700/40">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-base font-semibold text-chalk-50">
                    {i + 1}. {c.name}
                  </h3>
                  <span className="num text-sm text-chalk-300">max {c.weight} pts</span>
                </div>
                <p className="mt-1 text-sm text-chalk-300 serif">{c.rationale}</p>
              </div>
              <ul className="divide-y divide-ink-700/30">
                {c.factors.map((f) => (
                  <li key={f.label} className="px-5 py-3 grid md:grid-cols-[1fr_auto] gap-3 items-start">
                    <div>
                      <p className="text-sm text-chalk-100 font-medium">{f.label}</p>
                      {f.reading && (
                        <p className="text-xs text-chalk-300/70 mt-0.5">{f.reading}</p>
                      )}
                    </div>
                    <code className="text-xs text-accent/80 font-mono bg-ink-800/60 px-2 py-1 rounded self-start shrink-0">
                      {f.formula}
                    </code>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Bonuses */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-chalk-50 mb-4">Bonuses (max +5)</h2>
        <ul className="rounded-xl border border-accent/20 bg-accent/5 divide-y divide-accent/10">
          {BONUSES.map((b) => (
            <li key={b.label} className="flex items-start justify-between px-5 py-3 gap-4">
              <div>
                <p className="text-sm text-chalk-100 font-medium">{b.label}</p>
                <p className="text-xs text-chalk-300/70 mt-0.5">{b.trigger}</p>
              </div>
              <span className="num font-semibold text-accent shrink-0">{b.points}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Penalties */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-chalk-50 mb-4">Penalties (max −14)</h2>
        <p className="text-sm text-chalk-300 mb-3 serif">
          Penalties represent tail-risk gate events — below the threshold they don&apos;t matter;
          above it they are a serious red flag that a continuous factor cannot fully represent.
          Each penalty has an explicit exposure-matrix justification: it does not duplicate
          what a category factor already captures.
        </p>
        <ul className="rounded-xl border border-bad/20 bg-bad/5 divide-y divide-bad/10">
          {PENALTIES.map((p) => (
            <li key={p.label} className="flex items-start justify-between px-5 py-3 gap-4">
              <div>
                <p className="text-sm text-chalk-100 font-medium">{p.label}</p>
                <p className="text-xs text-chalk-300/70 mt-0.5">{p.trigger}</p>
              </div>
              <span className="num font-semibold text-bad shrink-0">{p.points}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Classification bands */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-chalk-50 mb-4">Classification bands</h2>
        <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 divide-y divide-ink-700/40">
          {BANDS.map((b) => (
            <div key={b.label} className="px-5 py-3 flex items-center gap-4">
              <span className="num font-semibold text-chalk-50 w-28 shrink-0">{b.label}</span>
              <span className="num text-accent text-sm w-14 shrink-0">{b.range}</span>
              <span className="text-sm text-chalk-300">{b.desc}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-chalk-300/60">
          Target band distribution: 10% Avoid / 25% Watchlist / 35% Accumulate / 25% Invest-grade / 5% Exceptional.
          Calibrated via logistic x₀ and half_width parameters on a 70% training set; validated on a held-out 30%.
        </p>
      </section>

      {/* Factor exposure matrix */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-chalk-50 mb-3">Factor exposure policy</h2>
        <p className="text-sm text-chalk-300 mb-4 serif">
          Each input signal appears in at most one channel: a continuous factor <em>or</em> a penalty — never both, unless the penalty represents a qualitative state change the continuous factor cannot represent (e.g., pledge crossing 25% is a binary event).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-chalk-300/50 uppercase tracking-wider">
              <tr className="border-b border-ink-700/40">
                <th className="text-left py-2 px-3">Input</th>
                <th className="text-left py-2 px-3">Continuous channel</th>
                <th className="text-left py-2 px-3">Penalty channel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-700/30 text-chalk-200">
              {[
                ["Pledge %", "§Balance Sheet (wt 2) linDown(0,10)", "§5 if ≥25% (−5) — qualitative cliff"],
                ["Debt trajectory", "§Balance Sheet (5y + 10y, wt 3)", "None — subsumed by factor"],
                ["Other-income share", "§Quarterly (wt 1) linDown(0.10,0.30)", "§5 if >30% (−2), if >50% (−4)"],
                ["Promoter holding", "§Shareholding level + trend", "§5 if drop ≥5pp in 8Q (−3)"],
                ["CFO/PAT", "§Cash Flow (wt 3)", "§5 if 5yr avg <0.5 (−3)"],
                ["Public free-float", "None", "§5 if public > max others (−1.5)"],
              ].map(([input, cont, pen]) => (
                <tr key={input as string} className="hover:bg-ink-800/20">
                  <td className="py-2 px-3 font-medium text-chalk-100">{input}</td>
                  <td className="py-2 px-3 text-chalk-300/80">{cont}</td>
                  <td className="py-2 px-3 text-bad/80">{pen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Sources & limitations */}
      <section className="mb-12 space-y-3 text-chalk-200 serif text-lg leading-relaxed">
        <h2 className="text-2xl font-semibold text-chalk-50 not-italic font-sans">Sources & limitations</h2>
        <p>
          All data is sourced from{" "}
          <a href="https://www.screener.in" className="text-accent hover:underline">
            screener.in
          </a>
          . Every data fallback, missing-field assumption, and sector prior usage is logged in the{" "}
          <code className="text-xs bg-ink-800 px-1 py-0.5 rounded">assumptions[]</code> array visible in
          the Factor Breakdown tab on each company page.
        </p>
        <p className="text-base text-chalk-300">
          <strong className="text-chalk-50">This is not investment advice.</strong> The scoring is
          one quantitative input. Always read annual reports, listen to concalls, and form your own
          view before committing capital.
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
