import Link from "next/link";
import { ArrowRight, BookOpen, TrendingUp, Shield, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { ScoreCurve } from "@/components/methodology/ScoreCurve";
import { CategoryJumpLink } from "@/components/methodology/CategoryJumpLink";

export const metadata = {
  title: "Methodology – How the score works",
  description:
    "A complete, plain-English walkthrough of every scoring category, formula, and design decision behind StockScore's 100-point fundamental model.",
};

// ─── Learn page cross-links ────────────────────────────────────────────────────
// IDs come from lib/learn/data/*.ts
function LearnLink({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <Link
      href={`/learn#${id}`}
      className="inline-flex items-center gap-0.5 text-accent hover:underline underline-offset-2 text-[13px] font-medium"
    >
      {children}
      <BookOpen className="h-3 w-3 opacity-60 shrink-0" />
    </Link>
  );
}

function SectionAnchor({ id }: { id: string }) {
  return <span id={id} className="-mt-24 pt-24 block absolute pointer-events-none" aria-hidden />;
}

function Chip({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "good" | "bad" | "warn" | "neutral" | "accent" }) {
  const cls = {
    good: "border-good/25 bg-good/10 text-good",
    bad: "border-bad/25 bg-bad/10 text-bad",
    warn: "border-warn/25 bg-warn/10 text-warn",
    neutral: "border-ink-700 bg-ink-800/50 text-chalk-300",
    accent: "border-accent/25 bg-accent/10 text-accent",
  }[tone];
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold num ${cls}`}>
      {children}
    </span>
  );
}

function WhyBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 flex gap-2.5 rounded-lg border border-accent/15 bg-accent/5 px-3.5 py-3">
      <Info className="h-4 w-4 shrink-0 text-accent mt-0.5" />
      <p className="text-[13px] text-chalk-200 leading-relaxed">{children}</p>
    </div>
  );
}

function FactorRow({
  label,
  formula,
  reading,
  why,
  learnId,
}: {
  label: string;
  formula: string;
  reading?: string;
  why?: string;
  learnId?: string;
}) {
  return (
    <div className="border-t border-ink-700/30 px-5 py-4 grid md:grid-cols-[1fr_auto] gap-3 items-start">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <p className="text-sm text-chalk-100 font-medium">{label}</p>
          {learnId && <LearnLink id={learnId}>Learn</LearnLink>}
        </div>
        {reading && <p className="text-xs text-chalk-300/70 leading-relaxed">{reading}</p>}
        {why && (
          <p className="text-xs text-chalk-300/50 mt-1 italic leading-relaxed">{why}</p>
        )}
      </div>
      <code className="text-[11px] text-accent/80 font-mono bg-ink-800/60 px-2 py-1 rounded self-start shrink-0 whitespace-nowrap">
        {formula}
      </code>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MethodologyPage() {
  return (
    <div className="relative mx-auto max-w-4xl px-4 sm:px-6 py-12 sm:py-16">

      {/* ── JUMP NAV ── */}
      <nav className="mb-10 flex flex-wrap gap-2" aria-label="Jump to section">
        {[
          ["#philosophy", "Philosophy"],
          ["#math", "Scoring math"],
          ["#categories", "Categories"],
          ["#bonuses", "Bonuses"],
          ["#penalties", "Penalties"],
          ["#bands", "Score bands"],
          ["#limits", "Limitations"],
        ].map(([href, label]) => (
          <a
            key={href}
            href={href}
            className="rounded-full border border-ink-700 px-3 py-1 text-xs text-chalk-300 hover:border-accent/30 hover:text-accent transition-colors"
          >
            {label}
          </a>
        ))}
      </nav>

      {/* ── HEADER ── */}
      <header className="mb-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-2">Methodology</p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-chalk-50 leading-tight mb-5">
          How every score <br className="hidden sm:block" />
          <span className="text-accent italic">is calculated</span>
        </h1>
        <p className="text-[17px] text-chalk-200 leading-relaxed max-w-2xl">
          Every number you see on this site traces back to a documented rule. This page explains not just
          <em className="not-italic text-chalk-50"> what</em> we compute, but <em className="not-italic text-chalk-50">why</em> each threshold was
          chosen, why continuous curves beat binary thresholds, and where each metric
          fits in the overall picture.
        </p>
      </header>

      {/* ── SCORE ANATOMY ── */}
      <section className="mb-16">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-accent mb-4">The big picture</p>
        <h2 className="text-2xl font-bold text-chalk-50 mb-6">Anatomy of a score</h2>

        <div className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-center gap-2 sm:gap-0">
            {[
              { label: "Raw Score", sub: "Sum of 10 categories", range: "0 – 100", tone: "neutral" as const },
              null,
              { label: "+ Bonuses", sub: "Quality signals", range: "up to +5", tone: "good" as const },
              null,
              { label: "− Penalties", sub: "Tail-risk flags", range: "up to −14", tone: "bad" as const },
              null,
              { label: "= Final", sub: "After ceiling", range: "0 – 100", tone: "accent" as const },
            ].map((item, i) =>
              item === null ? (
                <ArrowRight key={i} className="hidden sm:block h-5 w-5 text-chalk-300/30 mx-auto shrink-0" />
              ) : (
                <div
                  key={item.label}
                  className={`glass border-subtle rounded-xl p-4 text-center ${
                    item.tone === "good" ? "border-good/20" :
                    item.tone === "bad" ? "border-bad/20" :
                    item.tone === "accent" ? "border-accent/30 bg-accent/5" : ""
                  }`}
                >
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
                    item.tone === "good" ? "text-good" :
                    item.tone === "bad" ? "text-bad" :
                    item.tone === "accent" ? "text-accent" : "text-chalk-300"
                  }`}>{item.label}</p>
                  <p className="text-[11px] text-chalk-300/60 mb-1.5">{item.sub}</p>
                  <Chip tone={item.tone}>{item.range}</Chip>
                </div>
              )
            )}
          </div>
          <p className="mt-4 text-xs text-chalk-300/50">
            Industry ceiling applied after bonuses/penalties: tobacco → 75, financials/cyclicals → 80–90, others → 100.
          </p>
        </div>
      </section>

      {/* ── PHILOSOPHY ── */}
      <section className="mb-16 relative">
        <SectionAnchor id="philosophy" />
        <p className="text-[11px] font-semibold uppercase tracking-widest text-accent mb-4">Why we built it this way</p>
        <h2 className="text-2xl font-bold text-chalk-50 mb-6">Design philosophy</h2>

        <div className="space-y-5">
          <details className="group glass border-subtle rounded-xl overflow-hidden" open>
            <summary className="flex cursor-pointer items-start gap-4 px-5 py-4 hover:bg-ink-800/30 transition-colors list-none">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold mt-0.5">1</span>
              <div>
                <p className="text-sm font-semibold text-chalk-50">No cliff edges - continuous curves everywhere</p>
                <p className="text-xs text-chalk-300/60 mt-0.5">Why a company at ROCE 19.9% and 20.1% get virtually the same score</p>
              </div>
            </summary>
            <div className="px-5 pb-5 border-t border-ink-700/30 pt-4 text-sm text-chalk-200 leading-relaxed space-y-3">
              <p>
                Most screeners use hard thresholds: "ROCE &gt; 20% = 5 stars". The problem is that a company
                at 19.9% gets a completely different score from one at 20.1% - despite being economically identical.
                This creates a discontinuity that has no basis in reality.
              </p>
              <p>
                We use <strong className="text-chalk-50">logistic curves</strong> parameterised as{" "}
                <code className="text-xs bg-ink-800 px-1.5 py-0.5 rounded font-mono">logistic(x₀, half_width)</code>,
                where <strong className="text-chalk-50">x₀</strong> is the midpoint (score = 0.5) and{" "}
                <strong className="text-chalk-50">half_width</strong> is how far you have to move from x₀ for the score
                to reach 0.9. Both values are economically grounded.
              </p>
              <div className="flex items-start gap-6 mt-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-chalk-300/60 mb-2 font-medium">ROCE scoring curve (x₀=18%, hw=8.8pp)</p>
                  <ScoreCurve type="logistic" params={[0.5, 0.22]} xLabel="ROCE" midLabel="18%" label="logistic(18%, 8.8pp)" />
                </div>
                <div className="flex-1 min-w-0 text-xs text-chalk-300 space-y-1.5 self-center">
                  <div className="flex items-center gap-2"><Chip tone="bad">9%</Chip><span>→ score ~10%</span></div>
                  <div className="flex items-center gap-2"><Chip tone="warn">18%</Chip><span>→ score 50%</span></div>
                  <div className="flex items-center gap-2"><Chip tone="good">27%</Chip><span>→ score ~90%</span></div>
                  <p className="text-chalk-300/50 mt-2">Every 1pp improvement in ROCE produces a real, proportionate improvement in score.</p>
                </div>
              </div>
            </div>
          </details>

          <details className="group glass border-subtle rounded-xl overflow-hidden">
            <summary className="flex cursor-pointer items-start gap-4 px-5 py-4 hover:bg-ink-800/30 transition-colors list-none">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold mt-0.5">2</span>
              <div>
                <p className="text-sm font-semibold text-chalk-50">Absolute + relative scoring - context is everything</p>
                <p className="text-xs text-chalk-300/60 mt-0.5">Why a refinery with 5% OPM can score the same as an FMCG company at 18%</p>
              </div>
            </summary>
            <div className="px-5 pb-5 border-t border-ink-700/30 pt-4 text-sm text-chalk-200 leading-relaxed space-y-3">
              <p>
                "OPM &gt; 15% is great" is true for FMCG. For an oil refinery, 5% OPM is excellent - crude oil
                costs almost as much as petrol. If you apply the same absolute threshold across all sectors, you'd
                never recommend a single refinery or commodity company.
              </p>
              <p>
                Three places where we adjust for sector context:
              </p>
              <ul className="ml-4 space-y-2 list-disc text-[13px]">
                <li>
                  <strong className="text-chalk-50">OPM</strong> is scored relative to the sector median. A company
                  2pp above its sector median scores better than one 2pp below - regardless of the absolute number.
                </li>
                <li>
                  <strong className="text-chalk-50">Debt-to-Equity bands</strong> are sector-specific. Utilities and
                  infrastructure operate with structural leverage; a D/E of 2.5 is normal. For a consumer company
                  the same D/E is a red flag.
                </li>
                <li>
                  <strong className="text-chalk-50">Peer composite</strong> (6 pts) is a pure relative ranking
                  within the peer set - it answers only "is this the best in its sector?".
                </li>
              </ul>
            </div>
          </details>

          <details className="group glass border-subtle rounded-xl overflow-hidden">
            <summary className="flex cursor-pointer items-start gap-4 px-5 py-4 hover:bg-ink-800/30 transition-colors list-none">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold mt-0.5">3</span>
              <div>
                <p className="text-sm font-semibold text-chalk-50">Magnitude and time both matter - no binary thresholds</p>
                <p className="text-xs text-chalk-300/60 mt-0.5">Why 3× sales growth in 3 years scores materially more than 2× in 3 years</p>
              </div>
            </summary>
            <div className="px-5 pb-5 border-t border-ink-700/30 pt-4 text-sm text-chalk-200 leading-relaxed space-y-3">
              <p>
                A threshold approach would say "sales CAGR &gt; 15% = full score". But a company growing at 25% CAGR
                is dramatically better than one growing at 16%. Both pass the threshold; only one should earn the
                higher score.
              </p>
              <p>
                We feed the actual CAGR value into the logistic curve. The midpoint is set at a realistic "good" level
                (e.g. 10–15% CAGR depending on the window), and the half_width is calibrated so that exceptional
                growth saturates the score - but never gives you infinite points for 100% CAGR.
              </p>
              <p>
                We also use multiple time windows (3yr, 5yr, 10yr) with progressively lower bars for longer horizons -
                because a 3-year sprint is harder to sustain than a 10-year trend.
              </p>
            </div>
          </details>

          <details className="group glass border-subtle rounded-xl overflow-hidden">
            <summary className="flex cursor-pointer items-start gap-4 px-5 py-4 hover:bg-ink-800/30 transition-colors list-none">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold mt-0.5">4</span>
              <div>
                <p className="text-sm font-semibold text-chalk-50">Guardrails before elegance - every formula is gamed-checked</p>
                <p className="text-xs text-chalk-300/60 mt-0.5">Why PEG, drawdown, and acceleration factors all have explicit "off" switches</p>
              </div>
            </summary>
            <div className="px-5 pb-5 border-t border-ink-700/30 pt-4 text-sm text-chalk-200 leading-relaxed space-y-3">
              <p>
                A purely mathematical formula can be gamed by inputs that are technically valid but economically
                meaningless. PEG ratio with negative growth, P/E with negative earnings, or a 52-week-low reward
                for a business in terminal decline are all cases where the raw arithmetic still "works" but the
                signal is nonsense.
              </p>
              <p>
                Every factor with this risk has an explicit guard that zeroes the score (rather than letting the
                formula extrapolate into a misleading number) - negative P/E, negative book value, non-positive
                PEG growth, and the quality-gated 52-week drawdown bonus are the clearest examples. Gates are
                listed in the factor reading wherever they apply, not buried in code.
              </p>
            </div>
          </details>

          <details className="group glass border-subtle rounded-xl overflow-hidden">
            <summary className="flex cursor-pointer items-start gap-4 px-5 py-4 hover:bg-ink-800/30 transition-colors list-none">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold mt-0.5">5</span>
              <div>
                <p className="text-sm font-semibold text-chalk-50">Bonuses and penalties are state changes, not double-counted</p>
                <p className="text-xs text-chalk-300/60 mt-0.5">Why a 25% pledge triggers a flat −5, on top of an already-low pledge factor score</p>
              </div>
            </summary>
            <div className="px-5 pb-5 border-t border-ink-700/30 pt-4 text-sm text-chalk-200 leading-relaxed space-y-3">
              <p>
                Continuous factors are good at representing gradual change, but some thresholds represent a genuine
                qualitative break, not just "more of the same." A 24% promoter pledge and a 26% promoter pledge are
                close on the continuous curve, but 25%+ is the point where forced-sale spirals become a real,
                distinct risk - the kind of thing a smooth curve under-weights by design.
              </p>
              <p>
                That's what bonuses (<Link href="#bonuses" className="text-accent hover:underline">max +5</Link>) and
                penalties (<Link href="#penalties" className="text-accent hover:underline">max −14</Link>) are for:
                discrete adjustments layered on top of the continuous score for conditions that need a step, not a
                slope. Each one is designed to avoid re-scoring what the underlying factor already captures - the
                penalty fires only in the extreme tail the continuous curve under-represents.
              </p>
            </div>
          </details>
        </div>
      </section>

      {/* ── SCORING MATH ── */}
      <section className="mb-16 relative">
        <SectionAnchor id="math" />
        <p className="text-[11px] font-semibold uppercase tracking-widest text-accent mb-4">Under the hood</p>
        <h2 className="text-2xl font-bold text-chalk-50 mb-3">Scoring primitives</h2>
        <p className="text-sm text-chalk-300 mb-3 leading-relaxed">
          Every factor in every category is a call to one of four primitives. They all return a value between
          0 and 1 - then multiply by the factor weight. This guarantees no cliffs, no negatives, and full
          analytic transparency: any score on the site can be traced back to a primitive, its parameters, and
          the raw input that produced it (see the <strong className="text-chalk-50">Factors</strong> tab on any
          company page).
        </p>
        <p className="text-sm text-chalk-300 mb-6 leading-relaxed">
          Four primitives is a deliberate constraint, not a limitation. Every metric on the site - whether it's a
          margin, a growth rate, or a leverage ratio - falls into one of four shapes: "smooth sweet spot"
          (<code className="text-xs bg-ink-800 px-1 py-0.5 rounded font-mono">logistic</code>), "more is strictly
          better" (<code className="text-xs bg-ink-800 px-1 py-0.5 rounded font-mono">linUp</code>), "less is
          strictly better" (<code className="text-xs bg-ink-800 px-1 py-0.5 rounded font-mono">linDown</code>), or
          "good in a range, bad at both extremes" (<code className="text-xs bg-ink-800 px-1 py-0.5 rounded font-mono">band</code>).
          Keeping the primitive set small means every curve in the model is auditable by eye, and a new factor
          can only be added by picking which of these four shapes its underlying economics actually has - not by
          hand-tuning a bespoke curve to fit a particular company.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              name: "logistic(x, x₀, hw)",
              tag: "S-curve",
              tagTone: "accent" as const,
              desc: "The workhorse. Smooth, saturating curve. x₀ = the midpoint where score = 0.5. hw = half_width - the distance at which score reaches 0.9. Used for metrics where you want diminishing returns on both sides of a sweet spot.",
              example: "ROCE scoring: logistic(x₀=18%, hw=8.8pp). At ROCE=18%, you score exactly 50%. Each extra 1pp of ROCE is worth more near the midpoint and less at the extremes.",
              curve: { type: "logistic" as const, params: [0.5, 0.22], label: "logistic(0.5, 0.22)" },
            },
            {
              name: "linUp(x, lo, hi)",
              tag: "More is better",
              tagTone: "good" as const,
              desc: "Linear ramp. Score = 0 at lo, 1 at hi. Used when there's a clear minimum and a clear excellent level with no diminishing returns in between. Simple and interpretable.",
              example: "FCF yield: linUp(FCF/mcap, 1%, 7%). Zero score at 1% FCF yield, full score at 7%. Every 1% improvement is worth the same amount of score.",
              curve: { type: "linUp" as const, params: [], label: "linUp(lo, hi)" },
            },
            {
              name: "linDown(x, lo, hi)",
              tag: "Less is better",
              tagTone: "bad" as const,
              desc: "Mirror of linUp. Score = 1 at lo, 0 at hi. Used for metrics where lower is better - P/E ratio, debt/equity, pledged shares, receivable days.",
              example: "P/E absolute: linDown(pe, 12, 40). Full score at P/E=12, zero at P/E=40. A P/E of 26 scores 50%.",
              curve: { type: "linDown" as const, params: [], label: "linDown(lo, hi)" },
            },
            {
              name: "band(x, a, b, c, d)",
              tag: "Goldilocks",
              tagTone: "warn" as const,
              desc: "Trapezoidal curve for 'not too little, not too much' cases. Ramps to 1 on [a,b], holds 1 on [b,c], ramps back to 0 on [c,d]. Perfect for metrics where extreme values in either direction are bad.",
              example: "Capex/Depreciation: band(0.5, 1.0, 2.5, 4.0). <0.5× = under-investing. 1–2.5× = healthy reinvestment. >4× = over-spending or empire building.",
              curve: { type: "band" as const, params: [], label: "band(a, b, c, d)" },
            },
          ].map((p) => (
            <div key={p.name} className="glass border-subtle rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <code className="text-sm font-mono text-accent font-semibold">{p.name}</code>
                <Chip tone={p.tagTone}>{p.tag}</Chip>
              </div>
              <p className="text-[13px] text-chalk-200 leading-relaxed">{p.desc}</p>
              <ScoreCurve type={p.curve.type} params={p.curve.params} label={p.curve.label} />
              <div className="rounded-lg border border-ink-700/50 bg-ink-900/50 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-chalk-300/60 mb-1">Example</p>
                <p className="text-xs text-chalk-300 leading-relaxed">{p.example}</p>
              </div>
            </div>
          ))}
        </div>

        <WhyBox>
          Every primitive is monotonic and bounded in [0, 1] - there is no parameter combination that produces a
          negative score, a score above 1, or a discontinuous jump. That's what makes the "Factors" tab on every
          company page trustworthy: the number you see there is exactly what the formula produced, with no
          hidden clamps, overrides, or manual overrides applied afterward.
        </WhyBox>
      </section>

      {/* ── CATEGORY WEIGHTS ── */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-chalk-50 mb-2">Category weights</h2>
        <p className="text-sm text-chalk-300 mb-6 leading-relaxed">
          The 100 raw points are distributed across 10 categories. Weights reflect the relative importance
          of each dimension for long-term compounding. Business quality and growth together make up 34 points -
          because a great business is hard to replicate, while a cheap valuation can be found or waited for.
          Click any row to jump straight to that category's full breakdown below.
        </p>
        <div className="space-y-2.5">
          {[
            { name: "Quality of Business", id: "cat-quality-of-business", pts: 18, why: "Foundation of any investment. A great business is the hardest moat to replicate.", color: "#6D8196" },
            { name: "Growth", id: "cat-growth", pts: 16, why: "Compounding requires consistent growth. Scale advantages come from volume.", color: "#7C3AED" },
            { name: "Valuation", id: "cat-valuation", pts: 14, why: "Price paid is the biggest determinant of absolute return. Fundamentals × price = outcome.", color: "#B8862B" },
            { name: "Balance Sheet", id: "cat-balance-sheet", pts: 12, why: "Solvency absorbs downturns. Leverage amplifies both gains and losses.", color: "#9A8C7C" },
            { name: "Cash Flow", id: "cat-cash-flow", pts: 10, why: "Accounting profits can be engineered. Cash cannot.", color: "#6D8196" },
            { name: "Quarterly Momentum", id: "cat-quarterly-momentum", pts: 10, why: "Current trajectory matters. Even great businesses can decelerate.", color: "#7C3AED" },
            { name: "Shareholding", id: "cat-shareholding", pts: 8, why: "Insider selling is an early warning sign rarely captured in financials.", color: "#B8862B" },
            { name: "Peer Composite", id: "cat-peer-composite", pts: 6, why: "Relative ranking confirms whether quality translates to competitive advantage.", color: "#9A8C7C" },
            { name: "Price & Technical", id: "cat-price-technical", pts: 4, why: "Price action can confirm or challenge a fundamental thesis.", color: "#6D8196" },
            { name: "Size & Liquidity", id: "cat-size-liquidity", pts: 2, why: "Not a quality signal - a liquidity tax. Small-caps carry access and execution risk.", color: "#9A8C7C" },
          ].map((c, i) => (
            <CategoryJumpLink key={c.name} targetId={c.id} className="group/row block">
              <div className="flex items-center gap-3 rounded-xl px-2 py-1.5 -mx-2 transition-colors hover:bg-ink-800/30 cursor-pointer">
                <span className="num text-[10px] text-chalk-300/30 w-4 shrink-0 text-right">{i + 1}</span>
                <span className="text-xs text-chalk-200 w-40 shrink-0 truncate whitespace-nowrap group-hover/row:text-accent transition-colors">
                  {c.name}
                </span>
                <div className="flex-1 h-5 rounded-full bg-ink-800/60 overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${c.pts}%`, background: c.color, opacity: 0.75 }}
                  />
                  <div className="absolute inset-0 flex items-center px-2">
                    <span className="text-[10px] num font-semibold text-chalk-100/70">{c.pts} pts</span>
                  </div>
                </div>
                <span className="text-[10px] num text-chalk-300/50 w-8 text-right shrink-0">{c.pts}%</span>
                <ArrowRight className="h-3 w-3 text-chalk-300/0 group-hover/row:text-accent/60 transition-colors shrink-0" />
              </div>
            </CategoryJumpLink>
          ))}
        </div>
        <p className="mt-4 text-xs text-chalk-300/50">
          Bonuses (max +5) and penalties (max −14) apply on top. Industry ceiling: tobacco → 75, cyclical sectors → 90, others → 100.
        </p>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="mb-16 relative">
        <SectionAnchor id="categories" />
        <p className="text-[11px] font-semibold uppercase tracking-widest text-accent mb-4">Category breakdown</p>
        <h2 className="text-2xl font-bold text-chalk-50 mb-6">Each category, explained</h2>

        <div className="space-y-5">

          {/* 1. Quality of Business */}
          <details id="cat-quality-of-business" className="glass border-subtle rounded-xl overflow-hidden scroll-mt-24" open>
            <summary className="flex cursor-pointer items-start justify-between gap-4 px-5 py-4 hover:bg-ink-800/20 transition-colors list-none">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-[11px] font-bold mt-0.5">1</span>
                <div>
                  <p className="text-sm font-semibold text-chalk-50">Quality of Business</p>
                  <p className="text-xs text-chalk-300/60 mt-0.5">Are the business economics structurally good?</p>
                </div>
              </div>
              <Chip tone="accent">18 pts</Chip>
            </summary>
            <div className="border-t border-ink-700/30 px-5 py-5 space-y-4">
              <div className="text-[13px] text-chalk-200 leading-relaxed space-y-2">
                <p>
                  This is the highest-weighted category because a structurally strong business is rare and durable.
                  You can buy a cheap business and wait for the market to re-rate it - but you can't easily transform
                  a structurally weak business into a great one.
                </p>
                <p>
                  The central question is: <strong className="text-chalk-50">does the business generate returns on capital
                  above its cost of capital?</strong> If ROCE &lt; ~10-12%, the business is probably destroying value
                  even as it grows. If ROCE is consistently &gt; 25%, you're likely looking at a genuine moat.
                </p>
              </div>
              <WhyBox>
                ROCE is prioritised over ROE here because ROCE is harder to inflate. ROE can be boosted by leverage -
                a company that takes on debt to fund buybacks will show high ROE even with mediocre economics. ROCE
                uses the full capital employed (equity + debt), making it a purer measure of business quality. Both are
                scored, but ROCE carries more weight.
              </WhyBox>

              <div className="rounded-xl border border-ink-700/50 overflow-hidden">
                <FactorRow label="ROCE (latest year)" formula="logistic(x₀=18%, hw=8.8pp)" learnId="roce"
                  reading="Score 50% at ROCE=18%; 90% at ROCE≈27%; 10% at ROCE≈9%."
                  why="18% is approximately the weighted average cost of capital for most Indian businesses. Below 18%, you're covering costs but not creating significant economic surplus." />
                <FactorRow label="ROCE 5-year consistency" formula="logistic(mean × (1−CV))"
                  reading="Rewards a stable 20% ROCE over an erratic average of 20% (e.g., 35% one year, 5% the next)."
                  why="A cyclical business that averages 20% ROCE looks great on average - but the 5% years are when you need cash for expansions and acquisitions. Consistency is a moat signal." />
                <FactorRow label="ROE (latest year)" formula="logistic(x₀=18%, hw=11pp)" learnId="roe"
                  reading="Wider half-width than ROCE - ROE is inherently noisier due to leverage effects."
                  why="ROE is kept as a cross-check on equity efficiency, but with a wider tolerance band precisely because leverage can inflate it." />
                <FactorRow label="OPM vs Sector Median" formula="logistic(Δ from sector, x₀=0, hw=6pp)" learnId="opm"
                  reading="Score above 50% only if the company beats its sector's median margin."
                  why="A 5% OPM refinery may be exceptional for its sector while a 5% OPM FMCG company is weak. Absolute OPM comparisons across sectors are meaningless." />
                <FactorRow label="OPM trend (3yr OLS slope)" formula="logistic(slope, x₀=0, hw=1.1pp/yr)"
                  reading="±1.1pp/yr annual change saturates the score. Expanding margins score better than contracting ones."
                  why="Direction matters as much as level. A company at 15% OPM expanding at +2pp/yr is more interesting than one at 22% contracting at −2pp/yr." />
                <FactorRow label="Capex / Depreciation (5yr avg)" formula="band(0.5, 1.0, 2.5, 4.0)"
                  reading="1–2.5× = healthy reinvestment. Below 0.5× = under-investing (asset decay). Above 4× = aggressive spend that may not be recovering."
                  why="Goldilocks: you want capex above depreciation to signal growth investment, but not so far above that it suggests empire-building or distressed replacement capex." />
                <FactorRow label="Margin stability" formula="linUp(OPM/sales_CV, 0, 30)"
                  reading="Rewards businesses with stable margins on stable revenue - penalises commodity-like volatility."
                  why="A company with 15% OPM that swings between 5% and 25% depending on input prices is not the same as one that consistently earns 15%. The CV ratio penalises that volatility." />
              </div>
            </div>
          </details>

          {/* 2. Growth */}
          <details id="cat-growth" className="glass border-subtle rounded-xl overflow-hidden scroll-mt-24">
            <summary className="flex cursor-pointer items-start justify-between gap-4 px-5 py-4 hover:bg-ink-800/20 transition-colors list-none">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-[11px] font-bold mt-0.5">2</span>
                <div>
                  <p className="text-sm font-semibold text-chalk-50">Growth</p>
                  <p className="text-xs text-chalk-300/60 mt-0.5">Is the business getting bigger, and is it accelerating?</p>
                </div>
              </div>
              <Chip tone="accent">16 pts</Chip>
            </summary>
            <div className="border-t border-ink-700/30 px-5 py-5 space-y-4">
              <div className="text-[13px] text-chalk-200 leading-relaxed space-y-2">
                <p>
                  Growth compounds. A business growing at 20% CAGR doubles every 3.5 years. But growth quality
                  matters as much as growth rate - are profits growing faster than sales? Is growth recent or sustained
                  over a decade? Is EPS growth real or diluted by fresh equity issuances?
                </p>
                <p>
                  We score multiple time windows (3yr, 5yr, 10yr) with deliberately higher bars for shorter windows.
                  Recent performance <em className="text-chalk-100">must</em> exceed the long-term base to score full marks -
                  this detects businesses that were once great but are now plateauing.
                </p>
              </div>
              <WhyBox>
                EPS growth is scored separately from PAT growth because it's dilution-aware. A company that grows
                PAT 20% by issuing 15% more shares every year is not creating proportionate value for existing holders.
                EPS growth forces the per-share lens.
              </WhyBox>
              <div className="rounded-xl border border-ink-700/50 overflow-hidden">
                <FactorRow label="Sales CAGR - 10yr / 5yr / 3yr" formula="logistic(x₀=10/12/15%, hw=8pp)" learnId="sales-growth"
                  reading="Midpoints: 10% for 10yr, 12% for 5yr, 15% for 3yr. Higher bar for shorter windows."
                  why="A 3-year sprint at 20% is impressive but not as durable as a 10-year average of 12%. The rising midpoints force recent performance to be exceptional." />
                <FactorRow label="PAT CAGR - 10yr / 5yr / 3yr" formula="logistic(x₀=12/15/18%, hw=9pp)"
                  reading="Profit midpoints are 2pp higher than sales at every window - operating leverage rewarded."
                  why="If profits grow faster than sales, the business is scaling efficiently. If profit CAGR < sales CAGR consistently, margins are deteriorating." />
                <FactorRow label="EPS CAGR (5yr)" formula="logistic(x₀=15%, hw=9pp)" learnId="eps-growth"
                  reading="Per-share earnings. Detects dilution."
                  why="A company can show 20% PAT CAGR while issuing 15% more shares annually - per-share value hasn't compounded meaningfully. EPS growth cuts through that." />
                <FactorRow label="Earnings acceleration" formula="logistic(TTM growth − 5yr CAGR, x₀=0, hw=10pp)"
                  reading="Gated: no credit if 5yr PAT CAGR ≤ 0. Rewards accelerating growth."
                  why="A business growing at 25% when its 5yr average was 15% is showing positive momentum. The gate prevents companies with negative 5yr earnings from gaming this." />
                <FactorRow label="Sales–PAT alignment" formula="linUp(PAT CAGR / Sales CAGR, 0, 1)"
                  reading="Full score if profits grow at least as fast as sales."
                  why="This encodes operating leverage - a business that can grow profits faster than revenue is improving structurally, not just riding a market wave." />
                <FactorRow label="Growth durability" formula="linUp(fraction of +ve YoY years, 0.5, 1.0)"
                  reading="Rewards consistent growers. A company with 8 of 10 positive growth years scores better than one with 5 of 10."
                  why="Anti-cyclicality test. A mining company might show great 5yr CAGR but have lost money in 4 individual years - the durability factor penalises that." />
              </div>
            </div>
          </details>

          {/* 3. Valuation */}
          <details id="cat-valuation" className="glass border-subtle rounded-xl overflow-hidden scroll-mt-24">
            <summary className="flex cursor-pointer items-start justify-between gap-4 px-5 py-4 hover:bg-ink-800/20 transition-colors list-none">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-[11px] font-bold mt-0.5">3</span>
                <div>
                  <p className="text-sm font-semibold text-chalk-50">Valuation</p>
                  <p className="text-xs text-chalk-300/60 mt-0.5">What are you paying for the business?</p>
                </div>
              </div>
              <Chip tone="accent">14 pts</Chip>
            </summary>
            <div className="border-t border-ink-700/30 px-5 py-5 space-y-4">
              <div className="text-[13px] text-chalk-200 leading-relaxed space-y-2">
                <p>
                  Price paid is the single biggest determinant of your realised return. You can buy a mediocre
                  business at a distressed price and do well; you can buy an exceptional business at an absurd
                  premium and lose money. The valuation category combines absolute cheapness with relative cheapness
                  and growth-adjusted cheapness.
                </p>
                <p>
                  Every factor has explicit guards against nonsensical inputs: negative P/E (losses), negative book
                  value, non-positive growth (for PEG), and the 52-week drawdown factor is quality-gated to
                  avoid rewarding "falling knives".
                </p>
              </div>
              <WhyBox>
                The 52-week drawdown factor - rewarding stocks near their lows - is deliberately quality-gated:
                it only activates if the company's quality score is above 60%. A bad business near its 52-week low
                is not a buying opportunity. A great business near its low often is.
              </WhyBox>
              <div className="rounded-xl border border-ink-700/50 overflow-hidden">
                <FactorRow label="P/E vs Industry" formula="linDown(pe / industry_pe, 0.5, 1.8)" learnId="industry-pe"
                  reading="Full score at 50% of sector P/E; zero at 1.8× sector P/E. Relative valuation."
                  why="A P/E of 20 is expensive for a public sector bank but cheap for a quality NBFC. Industry-relative P/E is a fairer cross-sector comparison than absolute P/E alone." />
                <FactorRow label="P/E absolute" formula="linDown(pe, 12, 40)" learnId="pe"
                  reading="Guarded: zero score if P/E ≤ 0. Score = 1 at P/E=12; score = 0 at P/E=40."
                  why="Absolute P/E anchors the valuation against the absolute cost of earnings. An industry might be uniformly expensive - that should still show up as a low score." />
                <FactorRow label="Price to Book" formula="CMP ≤ BV → 1; else linDown(P/B, 1.0, 3.0)" learnId="pb"
                  reading="Full score if trading at or below book value. Zero above 3× P/B."
                  why="P/B captures asset backing. Trading below book is a genuine margin of safety for asset-heavy businesses. The 3× ceiling reflects the user's explicit view that paying 3× book is a stretch." />
                <FactorRow label="PEG ratio" formula="linDown(peg, 0.5, 2.5)"
                  reading="Guarded: zero if PEG ≤ 0 or earnings growth ≤ 0. Full score at PEG=0.5."
                  why="PEG adjusts P/E for growth - a P/E of 30 at 30% growth (PEG=1) is far cheaper than P/E of 30 at 5% growth (PEG=6). It's the growth-aware valuation signal." />
                <FactorRow label="Intrinsic value margin of safety" formula="linUp(gap, −0.2, 0.5)"
                  reading="Uses Graham number: √(22.5 × EPS × BV). Full score at 50% discount to IV."
                  why="Graham's formula is conservative - it values the business on earnings power and asset backing, ignoring growth. A large gap between CMP and Graham IV is a hard safety net." />
                <FactorRow label="52w drawdown (quality-gated)" formula="linUp(0.10, 0.40) × quality gate"
                  reading="Only activates if quality score > 60%. Rewards a quality stock near its 52-week low."
                  why="Without the quality gate, this would reward any stock in freefall. The gate ensures we're buying quality on weakness, not catching a falling knife." />
              </div>
            </div>
          </details>

          {/* 4. Balance Sheet */}
          <details id="cat-balance-sheet" className="glass border-subtle rounded-xl overflow-hidden scroll-mt-24">
            <summary className="flex cursor-pointer items-start justify-between gap-4 px-5 py-4 hover:bg-ink-800/20 transition-colors list-none">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-[11px] font-bold mt-0.5">4</span>
                <div>
                  <p className="text-sm font-semibold text-chalk-50">Balance Sheet</p>
                  <p className="text-xs text-chalk-300/60 mt-0.5">Can the business survive a downturn?</p>
                </div>
              </div>
              <Chip tone="accent">12 pts</Chip>
            </summary>
            <div className="border-t border-ink-700/30 px-5 py-5 space-y-4">
              <div className="text-[13px] text-chalk-200 leading-relaxed space-y-2">
                <p>
                  A high-quality, fast-growing business can still be destroyed by a balance sheet that can't
                  withstand a credit crunch or demand shock. The balance sheet category asks: is the capital
                  structure sustainable, is leverage trending the right way, and are promoters putting their own
                  money at risk in a constructive way?
                </p>
              </div>
              <WhyBox>
                D/E bands are sector-specific because structural leverage is industry-normal in some sectors.
                A utility company is expected to carry D/E of 2–3× because its revenue is contracted and its
                asset base is predictable. The same D/E for a textile exporter is a warning sign. We use
                different band edges for capital-intensive sectors vs consumer/tech businesses.
              </WhyBox>
              <div className="rounded-xl border border-ink-700/50 overflow-hidden">
                <FactorRow label="Debt to Equity" formula="band(sector-specific edges)" learnId="de"
                  reading="Band edges shift by sector type. Hard zero on negative book value."
                  why="The Goldilocks band: too little debt might mean under-utilised leverage potential; too much is a solvency risk. The sweet spot differs by capital intensity." />
                <FactorRow label="Debt trend (5yr)" formula="linDown(current / 5yr-ago, 0.8, 2.0)"
                  reading="Full score if current debt is ≤80% of 5yr-ago debt. Zero if doubled."
                  why="Level matters, but trajectory matters more. A company with high debt but consistently paying it down is in a very different position from one with high debt that keeps rising." />
                <FactorRow label="Debt trend (10yr)" formula="linDown(current / 10yr-ago, 0.8, 2.0)"
                  reading="Long-horizon view of the leverage trajectory."
                  why="Some companies clean up debt tactically before fundraises. A 10yr view is harder to manipulate and shows the structural direction." />
                <FactorRow label="Pledged shares" formula="linDown(pledged%, 0, 10)"
                  reading="Zero pledge = full score. ≥10% pledge = zero score. Extra penalty at ≥25%."
                  why="When promoters pledge their shares, lenders can dump those shares on the market if the share price falls. This triggers a death spiral. Even 5% pledge should concern investors." />
                <FactorRow label="Debt vs market cap" formula="linDown(debt / mcap, 0.10, 0.60)"
                  reading="Full score if debt < 10% of market cap. Zero if debt > 60% of market cap."
                  why="Market cap is what the market thinks the business is worth. High debt relative to that valuation means the enterprise is largely owned by creditors, not equity holders." />
                <FactorRow label="Current ratio" formula="band(0.8, 1.5, 3.0, 5.0)" learnId="current-ratio"
                  reading="Too low = liquidity risk. Too high = idle capital. Sweet spot: 1.5–3.0×."
                  why="A current ratio of 0.9 means you can't pay your near-term liabilities from near-term assets - a cash flow crisis waiting to happen. A current ratio of 6 means cash is sitting idle." />
                <FactorRow label="Reserves CAGR (5yr)" formula="logistic(x₀=10%, hw=7pp)"
                  reading="Compounding book value. Full score at ~17%+ reserves CAGR."
                  why="Growing reserves means retained earnings are compounding. It's the equity flywheel - a business reinvesting at high returns will show this." />
              </div>
            </div>
          </details>

          {/* 5. Cash Flow */}
          <details id="cat-cash-flow" className="glass border-subtle rounded-xl overflow-hidden scroll-mt-24">
            <summary className="flex cursor-pointer items-start justify-between gap-4 px-5 py-4 hover:bg-ink-800/20 transition-colors list-none">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-[11px] font-bold mt-0.5">5</span>
                <div>
                  <p className="text-sm font-semibold text-chalk-50">Cash Flow</p>
                  <p className="text-xs text-chalk-300/60 mt-0.5">Are the accounting profits real cash?</p>
                </div>
              </div>
              <Chip tone="accent">10 pts</Chip>
            </summary>
            <div className="border-t border-ink-700/30 px-5 py-5 space-y-4">
              <div className="text-[13px] text-chalk-200 leading-relaxed space-y-2">
                <p>
                  Accounting profits can be legally manipulated - revenue recognition timing, capitalising expenses,
                  deferring provisions. Cash flows are far harder to fake because they represent real money moving
                  in and out of the bank account.
                </p>
                <p>
                  The classic check: if PAT is growing but CFO (cash from operations) is flat or falling, something
                  is being recognised as profit but not yet collected as cash. This shows up in ballooning receivables -
                  which the working capital factors also catch.
                </p>
              </div>
              <WhyBox>
                A CFO/PAT ratio persistently below 0.5 triggers a separate penalty (−3 pts) on top of the continuous
                factor score, because it represents a qualitative state change - the business has a structural
                cash conversion problem, not just a bad quarter.
              </WhyBox>
              <div className="rounded-xl border border-ink-700/50 overflow-hidden">
                <FactorRow label="Earnings quality (CFO/PAT)" formula="logistic(x₀=0.85, hw=0.55)" learnId="cfo-pat"
                  reading="Full score at CFO/PAT ≈ 1.4 (generating more cash than profit). Score 50% at 0.85."
                  why="The midpoint at 0.85 allows some tolerance - capital-intensive businesses sometimes have timing differences between profit and cash. But consistently below 0.5 is a red flag." />
                <FactorRow label="FCF positive years" formula="(count of positive FCF / 5) × 2"
                  reading="Up to 2 pts. 5 positive FCF years = full 2 pts."
                  why="Free Cash Flow = cash from operations minus capex. A business that can't generate free cash in most years is either growing through debt or has a structural cash problem." />
                <FactorRow label="FCF yield" formula="linUp(FCF / mcap, 1%, 7%)"
                  reading="What percentage of your investment is returned as free cash per year. 7%+ = full score."
                  why="FCF yield is the cleanest measure of how cheap a stock is relative to the cash it generates. At 7%+ FCF yield, you're getting your money back in ~14 years from cash alone." />
                <FactorRow label="Receivable days trend" formula="linDown(OLS slope, 0, 15 days/yr)"
                  reading="Zero score if receivables are stretching at >15 days/yr. Negative trend (improving) scores above 50%."
                  why="Stretching receivables is a classic sign of channel stuffing or collection problems. The slope (rate of change) matters more than the level alone." />
                <FactorRow label="Inventory days trend" formula="linDown(OLS slope, 0, 20 days/yr)"
                  reading="Bloating inventory at >20 days/yr = zero score."
                  why="Rising inventory is a leading indicator of demand weakness - the business is producing but not selling. Paired with rising receivables, it's a serious warning." />
                <FactorRow label="CFO growth trend" formula="logistic(norm slope, x₀=0, hw=0.5)"
                  reading="Normalised by mean CFO. Growing cash generation trends score above 0.5."
                  why="You want operational cash generation to compound over time, not just be lumpy. The normalised slope removes the effect of absolute scale." />
              </div>
            </div>
          </details>

          {/* 6. Quarterly Momentum */}
          <details id="cat-quarterly-momentum" className="glass border-subtle rounded-xl overflow-hidden scroll-mt-24">
            <summary className="flex cursor-pointer items-start justify-between gap-4 px-5 py-4 hover:bg-ink-800/20 transition-colors list-none">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-[11px] font-bold mt-0.5">6</span>
                <div>
                  <p className="text-sm font-semibold text-chalk-50">Quarterly Momentum</p>
                  <p className="text-xs text-chalk-300/60 mt-0.5">Is the business improving right now?</p>
                </div>
              </div>
              <Chip tone="accent">10 pts</Chip>
            </summary>
            <div className="border-t border-ink-700/30 px-5 py-5 space-y-4">
              <div className="text-[13px] text-chalk-200 leading-relaxed space-y-2">
                <p>
                  Annual financials are backward-looking by months. Quarterly trends capture what's happening now -
                  and the short-term direction can validate or challenge a long-term thesis. A great business
                  that is currently decelerating warrants more scrutiny before buying.
                </p>
                <p>
                  We use <strong className="text-chalk-50">year-on-year comparisons</strong> (same quarter last year),
                  not quarter-on-quarter, to eliminate seasonal distortions. Q1 FY25 vs Q1 FY24 is a clean
                  comparison; Q1 FY25 vs Q4 FY24 is not.
                </p>
              </div>
              <WhyBox>
                The 2-year stacked CAGR - calculated as (latest quarter / quarter 8 quarters ago)^0.5 − 1 - is
                resistant to base-effect manipulation. If a company had a terrible quarter 4 quarters ago (creating
                an easy comparison), the stacked CAGR spanning 8 quarters dilutes that. It's harder to game.
              </WhyBox>
              <div className="rounded-xl border border-ink-700/50 overflow-hidden">
                <FactorRow label="Revenue YoY + QoQ" formula="logistic(x₀=10%, hw=10pp) + logistic(x₀=0, hw=5pp)"
                  reading="YoY carries 3× the weight of QoQ. Combined: full score at ~20% YoY and positive sequential."
                  why="YoY dominates because seasonal effects make QoQ unreliable. But a strong QoQ in a seasonally flat quarter is a real signal, so it's included with lower weight." />
                <FactorRow label="Net profit YoY" formula="logistic(x₀=10%, hw=10pp)"
                  reading="Profit growing >10% YoY scores above average."
                  why="Revenue growth without profit growth could indicate deteriorating margins. This catches that." />
                <FactorRow label="PAT 2yr stacked CAGR" formula="logistic(x₀=10%, hw=12pp)"
                  reading="(latest_q / q_8ago)^0.5 − 1. Base-effect resilient. Full score at ~20% stacked CAGR."
                  why="A company with a catastrophically low base quarter 4 quarters ago shows inflated YoY growth. The 2yr stack dilutes that effect significantly." />
                <FactorRow label="EPS YoY" formula="logistic(x₀=10%, hw=10pp)"
                  reading="Per-share profit growth on a quarterly basis."
                  why="Detects dilutive equity raises in-quarter, which might be obscured in PAT-only comparisons." />
                <FactorRow label="OPM YoY delta + OLS slope" formula="logistic(Δ, x₀=0, hw=2.7pp) + logistic(slope, x₀=0)"
                  reading="Margin expansion carries more weight than margin level in this category."
                  why="The absolute OPM level is captured in Quality of Business. Here we're asking: is the operating trend accelerating or decelerating? That's a forward-looking signal." />
                <FactorRow label="Other-income quality" formula="linDown(other income / PBT, 0.10, 0.30)"
                  reading="Score 1 if other income < 10% of PBT. Zero if >30%."
                  why="Other income (dividends, asset sales, forex gains) is non-recurring and can distort profit quality. A company whose profits are 40% other income is not a strong business." />
                <FactorRow label="Profit growth streak" formula="linUp(streak, 0, 4)"
                  reading="Up to 4 pts credit for consecutive quarters of YoY profit growth."
                  why="Momentum has persistence. Four consecutive quarters of positive growth signals a genuine business cycle improvement, not a lucky base effect." />
              </div>
            </div>
          </details>

          {/* 7. Shareholding */}
          <details id="cat-shareholding" className="glass border-subtle rounded-xl overflow-hidden scroll-mt-24">
            <summary className="flex cursor-pointer items-start justify-between gap-4 px-5 py-4 hover:bg-ink-800/20 transition-colors list-none">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-[11px] font-bold mt-0.5">7</span>
                <div>
                  <p className="text-sm font-semibold text-chalk-50">Shareholding</p>
                  <p className="text-xs text-chalk-300/60 mt-0.5">Who owns it, and which direction are they moving?</p>
                </div>
              </div>
              <Chip tone="accent">8 pts</Chip>
            </summary>
            <div className="border-t border-ink-700/30 px-5 py-5 space-y-4">
              <div className="text-[13px] text-chalk-200 leading-relaxed space-y-2">
                <p>
                  Shareholding data tells you what the insiders and large institutional investors are doing with
                  information you don't have. Promoter selling - especially at a sustained pace - is often a
                  leading indicator of business deterioration. It surfaces months before it appears in financials.
                </p>
              </div>
              <WhyBox>
                The promoter trend carries 3 pts - the single highest factor weight in this category - because
                promoters have the best private information about the business. A promoter consistently reducing
                their holding (even while still owning 55%) is sending a signal that often precedes bad news.
                A promoter exit of ≥5pp over 8 quarters triggers a separate −3 pt penalty on top of this factor.
              </WhyBox>
              <div className="rounded-xl border border-ink-700/50 overflow-hidden">
                <FactorRow label="Promoter holding level" formula="linUp(25%, 60%)" learnId="promoter-holding"
                  reading="Full score at ≥60% promoter holding. Zero if <25%."
                  why="High promoter holding aligns management with shareholder interests. They can't enrich themselves at expense of others when they own most of the business." />
                <FactorRow label="Promoter trend (8Q delta)" formula="logistic(x₀=0, hw=2pp)"
                  reading="3pt weight - highest in category. Buying over 8 quarters scores well; selling scores poorly."
                  why="8 quarters is long enough that noise averages out - this is structural buying or selling, not a quarterly rebalance. Even a small but consistent reduction deserves scrutiny." />
                <FactorRow label="FII trend (8Q delta)" formula="logistic(x₀=0, hw=3pp)"
                  reading="Wider half-width than promoters - FII flows are more volatile and may reflect global risk-off rather than business-specific signals."
                  why="FIIs have strong research capacity. When they add consistently, it's a bullish signal. But because they also react to macro (dollar strength, EM flows), the weight is lower than promoters." />
                <FactorRow label="DII trend (8Q delta)" formula="logistic(x₀=0, hw=3pp)"
                  reading="Domestic institutional investors (mutual funds, insurance). Same half-width as FII."
                  why="DIIs are often the 'sticky' institutional money - they hold through FII outflows. Consistent DII buying suggests domestic conviction in the business." />
                <FactorRow label="FII + DII joint buying" formula="Binary: +0.5 if both net buyers"
                  reading="Both FII and DII adding over 8 quarters triggers a 0.5pt confirmation bonus."
                  why="Smart money confirmation: when both large institutional categories are simultaneously adding, it's a convergence signal that's hard to explain away as technical flows." />
              </div>
            </div>
          </details>

          {/* 8. Peer Composite */}
          <details id="cat-peer-composite" className="glass border-subtle rounded-xl overflow-hidden scroll-mt-24">
            <summary className="flex cursor-pointer items-start justify-between gap-4 px-5 py-4 hover:bg-ink-800/20 transition-colors list-none">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-[11px] font-bold mt-0.5">8</span>
                <div>
                  <p className="text-sm font-semibold text-chalk-50">Peer Composite</p>
                  <p className="text-xs text-chalk-300/60 mt-0.5">Is this the best company in its sector?</p>
                </div>
              </div>
              <Chip tone="accent">6 pts</Chip>
            </summary>
            <div className="border-t border-ink-700/30 px-5 py-5 space-y-4">
              <div className="text-[13px] text-chalk-200 leading-relaxed space-y-2">
                <p>
                  Every factor in this category is the company's <strong className="text-chalk-50">percentile rank</strong> among
                  its screener.in peer set - not an absolute number. This category answers purely: relative to every
                  other company in your sector, how do you rank?
                </p>
                <p>
                  If a sector is uniformly expensive (e.g. the entire defence sector trades at P/E 80+), the
                  absolute valuation category captures that. The peer composite simply identifies the relatively
                  cheaper one within that sector.
                </p>
              </div>
              <WhyBox>
                This category is skipped if fewer than 3 peers are available (not enough to rank meaningfully),
                and its 6pt weight is redistributed to the top 4 categories. It's a supplementary signal, not a
                primary one - which is why it carries only 6 pts.
              </WhyBox>
              <div className="rounded-xl border border-ink-700/50 overflow-hidden">
                <FactorRow label="P/E rank (lower = better)" formula="percentile × 1.0"
                  reading="100th percentile = cheapest P/E in peer group."
                  why="Relative cheapness within sector. If you must buy in this sector, buy the cheapest quality option." />
                <FactorRow label="ROCE rank" formula="percentile × 1.0" learnId="roce"
                  reading="100th percentile = highest ROCE in peer group."
                  why="Identifies the capital-efficiency leader within the sector." />
                <FactorRow label="OPM rank" formula="percentile × 1.0" learnId="opm"
                  reading="100th percentile = highest operating margins." />
                <FactorRow label="Quarterly profit growth rank" formula="percentile × 1.0"
                  reading="Who is growing profits fastest right now in the sector?" />
                <FactorRow label="Sales growth, Debt/MCap, Div yield, MCap" formula="percentile × 0.5 each"
                  reading="Supplementary relative factors. MCap uses log scale to reduce megacap bias." />
              </div>
            </div>
          </details>

          {/* 9. Price & Technical */}
          <details id="cat-price-technical" className="glass border-subtle rounded-xl overflow-hidden scroll-mt-24">
            <summary className="flex cursor-pointer items-start justify-between gap-4 px-5 py-4 hover:bg-ink-800/20 transition-colors list-none">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-[11px] font-bold mt-0.5">9</span>
                <div>
                  <p className="text-sm font-semibold text-chalk-50">Price &amp; Technical</p>
                  <p className="text-xs text-chalk-300/60 mt-0.5">Is price action confirming the fundamental case?</p>
                </div>
              </div>
              <Chip tone="accent">4 pts</Chip>
            </summary>
            <div className="border-t border-ink-700/30 px-5 py-5 space-y-4">
              <div className="text-[13px] text-chalk-200 leading-relaxed space-y-2">
                <p>
                  We use only 4 pts for technical analysis - not because price action is unimportant, but because
                  we are fundamentally-driven analysts. Price is a trailing signal. We want to know <em className="text-chalk-100">why</em> a
                  stock is at a price, not just where it is.
                </p>
                <p>
                  What we <em className="text-chalk-100">do</em> look at: a simple 2-signal regime detector using two DMAs and the
                  52-week range position. No fitted parameters, no complex indicators. Fully reproducible from a
                  single daily price series.
                </p>
              </div>
              <WhyBox>
                MACD, ADX, RSI, and Bollinger Bands were all considered and rejected because they require parameter
                fitting (periods, smoothing constants) that would overfit to historical patterns. The 50DMA/200DMA
                stack and 52-week position are widely understood, unfittable, and produce a clean 5-level regime
                signal from just two pieces of data.
              </WhyBox>
              <div className="rounded-xl border border-ink-700/50 overflow-hidden">
                <FactorRow label="DMA stack" formula="CMP > DMA50 > DMA200 → +1; reversed → −1" learnId="returns"
                  reading="Golden cross structure (+1) vs death cross (−1). Neutral configurations get 0."
                  why="When the short-term average is above the long-term average, the market is in a structurally upward regime. This is the most durable technical signal in equity markets." />
                <FactorRow label="52-week position" formula=">0.66 of range → +1; <0.33 of range → −1"
                  reading="Combined with DMA stack, produces a 5-level regime: from strong downtrend to strong uptrend."
                  why="A stock near its 52-week high with a positive DMA stack is in confirmed bullish momentum. A stock near its low with a death cross is in confirmed downtrend. The combination is more reliable than either alone." />
              </div>
            </div>
          </details>

          {/* 10. Size & Liquidity */}
          <details id="cat-size-liquidity" className="glass border-subtle rounded-xl overflow-hidden scroll-mt-24">
            <summary className="flex cursor-pointer items-start justify-between gap-4 px-5 py-4 hover:bg-ink-800/20 transition-colors list-none">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-[11px] font-bold mt-0.5">10</span>
                <div>
                  <p className="text-sm font-semibold text-chalk-50">Size &amp; Liquidity</p>
                  <p className="text-xs text-chalk-300/60 mt-0.5">Not quality - a practical liquidity adjustment</p>
                </div>
              </div>
              <Chip tone="accent">2 pts</Chip>
            </summary>
            <div className="border-t border-ink-700/30 px-5 py-5 space-y-4">
              <div className="text-[13px] text-chalk-200 leading-relaxed">
                <p>
                  This is the one category that is explicitly <strong className="text-chalk-50">not</strong> a judgment on
                  business quality. A micro-cap can be a phenomenal business. But it carries real practical risks
                  that a large-cap does not: thin liquidity (you can't buy or sell without moving the price), no
                  institutional coverage, wider bid-ask spreads, and higher execution risk.
                </p>
              </div>
              <WhyBox>
                The 2pt range (0.5 to 2.0) is deliberately narrow - we don't want size to be a major differentiator.
                A micro-cap scoring 85 on fundamentals but losing 1.5 pts on liquidity still scores 83.5, well within
                Invest-grade. The adjustment is real but proportionate.
              </WhyBox>
              <div className="rounded-xl border border-ink-700/50 overflow-hidden">
                <FactorRow label="Market cap tier" formula=">₹50k Cr=2; >₹10k=1.5; >₹1k=1; else=0.5" learnId="market-cap"
                  reading="Large-cap: 2pts. Mid-cap: 1.5pts. Small-cap: 1pt. Micro-cap: 0.5pts."
                  why="Purely a liquidity risk adjustment. Not a quality signal - just an honest representation of the practical risks of investing in illiquid stocks." />
              </div>
            </div>
          </details>

        </div>
      </section>

      {/* ── BONUSES ── */}
      <section className="mb-16 relative">
        <SectionAnchor id="bonuses" />
        <p className="text-[11px] font-semibold uppercase tracking-widest text-accent mb-4">Upside signals</p>
        <h2 className="text-2xl font-bold text-chalk-50 mb-3">Bonuses <span className="text-chalk-300 font-normal text-xl">(max +5 pts)</span></h2>
        <p className="text-sm text-chalk-200 leading-relaxed mb-6">
          Bonuses reward structural excellence that continuous factors partially capture but don't fully reflect.
          Each bonus has a specific multi-condition trigger - you can't game one condition to claim it.
          Bonuses stack (you can earn all five simultaneously, though that's rare).
        </p>
        <div className="rounded-xl border border-good/20 bg-good/5 divide-y divide-good/10">
          {[
            {
              label: "Net Cash Company",
              points: "+2",
              trigger: "Total debt < cash + liquid investments",
              why: "Net cash is a rare, powerful balance sheet signal. It means the business generates more cash than it needs, and the risk of financial distress is negligible. Buffett famously pays a premium for this."
            },
            {
              label: "Compounding Machine",
              points: "+2",
              trigger: "5yr avg ROE ≥ 18% AND 5yr PAT CAGR ≥ 15% AND D/E < 0.5",
              why: "This combination is the definition of a capital compounder: high returns on equity, sustained growth, without leverage. All three must be met - high ROE via leverage doesn't qualify."
            },
            {
              label: "Dividend Aristocrat",
              points: "+1",
              trigger: "Dividend paid last year AND payout ratio 20–60%",
              why: "A payout of 20–60% signals a business confident enough to return cash while retaining enough for growth. Below 20% could be growth-hungry (fine, but not a bonus). Above 60% might be unsustainable."
            },
            {
              label: "Promoter Buying",
              points: "+1",
              trigger: "Promoters added ≥1.5pp in last 4 quarters",
              why: "This is shorter-window (4Q vs the 8Q used in the category factor) and requires a meaningful size (1.5pp). It confirms the promoter trend factor with a recent, significant action."
            },
            {
              label: "Margin Expander",
              points: "+1",
              trigger: "OPM expanded +3pp AND ROCE expanded +5pp over 3 years",
              why: "Both margin and return expansion together signal a business that is simultaneously growing more profitable and deploying capital more efficiently - the ideal combination."
            },
          ].map((b) => (
            <details key={b.label} className="group">
              <summary className="flex cursor-pointer items-start justify-between px-5 py-3.5 gap-4 hover:bg-good/5 transition-colors list-none">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-good shrink-0" />
                    <p className="text-sm text-chalk-100 font-medium">{b.label}</p>
                  </div>
                  <p className="text-xs text-chalk-300/60 mt-0.5 ml-6">{b.trigger}</p>
                </div>
                <span className="num font-bold text-good shrink-0">{b.points}</span>
              </summary>
              <div className="px-5 pb-3.5 ml-6 border-t border-good/10 pt-2.5">
                <p className="text-xs text-chalk-300 leading-relaxed">{b.why}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ── PENALTIES ── */}
      <section className="mb-16 relative">
        <SectionAnchor id="penalties" />
        <p className="text-[11px] font-semibold uppercase tracking-widest text-accent mb-4">Tail-risk flags</p>
        <h2 className="text-2xl font-bold text-chalk-50 mb-3">Penalties <span className="text-chalk-300 font-normal text-xl">(max −14 pts)</span></h2>
        <p className="text-sm text-chalk-200 leading-relaxed mb-6">
          Penalties represent <strong className="text-chalk-50">threshold events</strong> - situations where a continuous
          factor cannot fully represent the severity of the signal because it's a qualitative state change.
          Each penalty is explicitly designed <em>not</em> to double-count what the category factors already
          capture - they trigger on conditions the continuous scores can only partially reflect.
        </p>
        <div className="rounded-xl border border-bad/20 bg-bad/5 divide-y divide-bad/10">
          {[
            {
              label: "Heavy Promoter Pledge",
              points: "−5",
              trigger: "Pledged shares ≥ 25%",
              why: "At 25%+ pledge, a 20% share price drop can trigger forced sales by lenders. This creates a doom loop: selling pressure → price falls → more margin calls → more selling. The continuous pledge factor covers 0–10%; the penalty covers the extreme tail."
            },
            {
              label: "Sin Business",
              points: "−4 + ceiling at 75",
              trigger: "Business is tobacco, gambling, or similar harm-generating sector",
              why: "These industries have structural ESG exclusion by major institutional investors, increasing capital cost and limiting the investor base. The ceiling at 75 is an explicit cap - we don't recommend these as 'Invest-grade' regardless of financials."
            },
            {
              label: "Earnings Quality Red Flag",
              points: "−3",
              trigger: "5yr average CFO/PAT < 0.5",
              why: "Persistently converting less than 50 paise of every rupee of profit into operating cash is a structural problem. The continuous CFO/PAT factor already captures the below-median performance; this penalty activates for sustained, severe underperformance."
            },
            {
              label: "Promoter Exit",
              points: "−3",
              trigger: "Promoter holding fell ≥5pp in last 8 quarters",
              why: "A sustained 5pp reduction is a decision, not portfolio rebalancing. At this pace, a 60% promoter is at 55% - still fine. But the direction and magnitude say something about their private assessment of the business."
            },
            {
              label: "Other-Income Dependency",
              points: "−2 to −4",
              trigger: "Other income >30% of PBT (−2); >50% of PBT (−4)",
              why: "A company whose reported profit is 40% interest income or asset sale proceeds is not a business - it's a treasury or holding company. The continuous factor already penalises the range 10–30%; this kicks in for the extreme cases."
            },
            {
              label: "Persistent FCF Deficit",
              points: "−2",
              trigger: "FCF negative in ≥4 of last 5 years",
              why: "Occasional negative FCF (due to a capex cycle) is acceptable and captured by the FCF positive years factor. Four out of five years negative means the business is structurally not generating cash after maintaining/growing assets."
            },
            {
              label: "Illiquid Free Float",
              points: "−2",
              trigger: "Free float < 15% AND mcap < ₹5,000 Cr",
              why: "A small company where insiders control 85%+ of shares has near-zero market liquidity and effectively no minority shareholder protection. Combined with small size, this is a practical exclusion."
            },
            {
              label: "Float Dominated by Retail",
              points: "−1.5",
              trigger: "Public (retail) holding > max(FII, DII, Promoter)",
              why: "When retail investors are the largest holder category, institutional ownership is very thin. That means weaker governance oversight, less analyst coverage, and typically higher volatility. This is a modest penalty for a real structural disadvantage."
            },
          ].map((p) => (
            <details key={p.label} className="group">
              <summary className="flex cursor-pointer items-start justify-between px-5 py-3.5 gap-4 hover:bg-bad/5 transition-colors list-none">
                <div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-bad shrink-0" />
                    <p className="text-sm text-chalk-100 font-medium">{p.label}</p>
                  </div>
                  <p className="text-xs text-chalk-300/60 mt-0.5 ml-6">{p.trigger}</p>
                </div>
                <span className="num font-bold text-bad shrink-0">{p.points}</span>
              </summary>
              <div className="px-5 pb-3.5 ml-6 border-t border-bad/10 pt-2.5">
                <p className="text-xs text-chalk-300 leading-relaxed">{p.why}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ── SCORE BANDS ── */}
      <section className="mb-16 relative">
        <SectionAnchor id="bands" />
        <p className="text-[11px] font-semibold uppercase tracking-widest text-accent mb-4">Reading the output</p>
        <h2 className="text-2xl font-bold text-chalk-50 mb-3">Score bands</h2>
        <p className="text-sm text-chalk-200 leading-relaxed mb-6">
          The final score maps to one of five classifications. The thresholds are calibrated against
          a 70/30 train-test split to achieve the target distribution shown below -
          not arbitrary round numbers. <LearnLink id="score-bands">Learn more about the bands</LearnLink>
        </p>

        <div className="space-y-3">
          {[
            {
              label: "Exceptional",
              range: "85+",
              tone: "good" as const,
              desc: "Top-decile business. Exceptional quality, growth, and reasonable valuation in combination. Rare - about 5% of scored companies hit this band. Size up when you find one at a reasonable entry.",
              tip: "Don't wait for the 'perfect' price on an Exceptional business. The compounding works against you if you wait years for a 10% discount.",
            },
            {
              label: "Invest-grade",
              range: "70–84",
              tone: "good" as const,
              desc: "Compounder candidate. Strong across most categories, no disqualifying red flags. Suitable as a core position. About 25% of scored companies are in this band.",
              tip: "The sweet spot for long-term investors. High enough quality that normal business cycles won't permanently impair it.",
            },
            {
              label: "Accumulate",
              range: "55–69",
              tone: "warn" as const,
              desc: "Solid business with identifiable weaknesses or one expensive dimension (usually valuation). Deploy on weakness - buy more as the price drops or as the weakness resolves.",
              tip: "Often the most interesting bucket: businesses that are genuinely good but temporarily expensive or facing a solvable issue.",
            },
            {
              label: "Watchlist",
              range: "40–54",
              tone: "warn" as const,
              desc: "Mixed signals. Either the business economics are decent but valuation is rich, or the business has a structural weakness. Put it on watch and revisit when price or business trajectory improves.",
              tip: "Many cyclical businesses live in this band at peak valuation. They may move to Accumulate/Invest-grade at the right point in the cycle.",
            },
            {
              label: "Avoid",
              range: "0–39",
              tone: "bad" as const,
              desc: "Material flaws across multiple categories - poor earnings quality, high leverage, promoter selling, expensive valuation, or some combination. The weight of evidence points against investing.",
              tip: "A low score doesn't mean the company is going bankrupt. It means the risk-reward is unfavorable given available alternatives.",
            },
          ].map((b) => (
            <div key={b.label} className={`glass rounded-xl border p-5 ${
              b.tone === "good" ? "border-good/25" : b.tone === "warn" ? "border-warn/25" : "border-bad/25"
            }`}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <Chip tone={b.tone}>{b.range}</Chip>
                  <span className={`text-sm font-bold ${
                    b.tone === "good" ? "text-good" : b.tone === "warn" ? "text-warn" : "text-bad"
                  }`}>{b.label}</span>
                </div>
              </div>
              <p className="text-[13px] text-chalk-200 leading-relaxed mb-2">{b.desc}</p>
              <p className="text-[12px] text-chalk-300/60 italic">{b.tip}</p>
            </div>
          ))}
        </div>

        {/* Distribution bar */}
        <div className="mt-6 glass border-subtle rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-chalk-300/60 mb-3">Target distribution</p>
          <div className="flex h-3 w-full overflow-hidden rounded-full">
            {[
              { pct: 10, color: "rgb(var(--bad))", label: "Avoid 10%" },
              { pct: 25, color: "rgb(var(--warn))", label: "Watchlist 25%" },
              { pct: 35, color: "rgb(var(--accent))", label: "Accumulate 35%" },
              { pct: 25, color: "rgb(var(--good) / 0.72)", label: "Invest 25%" },
              { pct: 5, color: "rgb(var(--good))", label: "Exceptional 5%" },
            ].map((s) => (
              <div key={s.label} style={{ width: `${s.pct}%`, background: s.color }} title={s.label} />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5">
            {[
              { label: "Avoid", pct: "10%", tone: "bad" as const },
              { label: "Watchlist", pct: "25%", tone: "warn" as const },
              { label: "Accumulate", pct: "35%", tone: "neutral" as const },
              { label: "Invest-grade", pct: "25%", tone: "good" as const },
              { label: "Exceptional", pct: "5%", tone: "good" as const },
            ].map((s) => (
              <span key={s.label} className="text-[11px] text-chalk-300/60">
                <span className={s.tone === "bad" ? "text-bad" : s.tone === "warn" ? "text-warn" : s.tone === "good" ? "text-good" : "text-accent"}>
                  {s.label}
                </span>{" "}{s.pct}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIMITATIONS ── */}
      <section className="mb-16 relative">
        <SectionAnchor id="limits" />
        <p className="text-[11px] font-semibold uppercase tracking-widest text-accent mb-4">What this model does not do</p>
        <h2 className="text-2xl font-bold text-chalk-50 mb-6">Limitations & what to do about them</h2>
        <div className="space-y-3">
          {[
            {
              issue: "Backward-looking by definition",
              detail: "All inputs come from screener.in's historical financial data. The model has no visibility into management guidance, regulatory changes, new product launches, or competitive disruption. A company that transforms itself in the last 6 months won't show that in its scores yet.",
              action: "Read the latest concall transcript and annual report before investing. The score is a shortlist tool, not a buy button.",
            },
            {
              issue: "Sectors with unusual accounting (financials, insurance, real estate)",
              detail: "Banks and NBFCs report Net Interest Margin instead of OPM. Insurance uses embedded value. Real estate uses percentage completion. These don't map cleanly onto our framework, so the quality and cash flow scores are less reliable for these.",
              action: "Use the score as a relative ranking within the sector, not an absolute judgment. The peer composite and growth factors remain useful.",
            },
            {
              issue: "Data quality from screener.in",
              detail: "Screener.in occasionally has missing data, restated numbers, or parsing inconsistencies. Every missing-field assumption is logged in the Factor Breakdown tab on each company page under 'assumptions[]'.",
              action: "For any company where you see many 'assumed 0' or 'missing' entries in the breakdown, verify those inputs from the company's investor relations page directly.",
            },
            {
              issue: "No qualitative factors",
              detail: "Management quality, brand strength, competitive moats, regulatory risk, and capital allocation philosophy are not captured in any quantitative metric. A technically great score doesn't mean the management is aligned or honest.",
              action: "Treat the score as a first filter. Qualitative assessment - reading ARs, listening to concalls - should follow any high-scoring company.",
            },
          ].map((l) => (
            <div key={l.issue} className="glass border-subtle rounded-xl p-5">
              <p className="text-sm font-semibold text-chalk-50 mb-1.5">{l.issue}</p>
              <p className="text-[13px] text-chalk-200 leading-relaxed mb-2">{l.detail}</p>
              <div className="flex gap-2 text-xs text-accent">
                <Shield className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{l.action}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <div className="border-t border-ink-700/50 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div>
          <p className="text-sm text-chalk-200">
            <strong className="text-chalk-50">Not investment advice.</strong> The score is one quantitative
            input. Read the annual report, listen to the concall, and form your own view before committing capital.
          </p>
          <p className="text-xs text-chalk-300/50 mt-1">
            Questions or disagreements with the methodology? Use the Feedback button on any company page.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
          <Link
            href="/learn"
            className="inline-flex items-center gap-1.5 rounded-xl border border-ink-700 px-4 py-2 text-sm text-chalk-200 hover:text-chalk-50 transition-colors"
          >
            <BookOpen className="h-4 w-4" /> Learn the metrics
          </Link>
          <Link
            href="/sectors"
            className="inline-flex items-center gap-1.5 rounded-xl border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent hover:bg-accent/18 transition-colors"
          >
            Browse companies <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

    </div>
  );
}
