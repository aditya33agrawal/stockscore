import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, BookOpen, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms & Educational Disclaimer",
  description:
    "This site is a learning tool for fundamental analysis — not a stock recommendation platform. Understand the approach and its limitations.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      {/* Header */}
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          Terms & Educational Disclaimer
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-chalk-50">
          This is not investment advice.
        </h1>
        <p className="mt-4 text-chalk-300 text-lg leading-relaxed serif">
          Before you use any score, ranking, or chart on this site to make a
          financial decision — please read this page. It will take three
          minutes and save you from a potentially costly misunderstanding.
        </p>
      </header>

      {/* Disclaimer box */}
      <section className="mb-12 rounded-xl border border-amber-500/40 bg-amber-500/5 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-semibold text-amber-300 text-lg">
              Plain-language disclaimer
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-chalk-200 leading-relaxed">
              <li>
                <strong className="text-chalk-50">Not a SEBI-registered entity.</strong>{" "}
                I am not a registered investment advisor, research analyst, or
                portfolio manager under SEBI regulations.
              </li>
              <li>
                <strong className="text-chalk-50">No buy / sell / hold recommendations.</strong>{" "}
                Nothing on this site — scores, rankings, analyst notes, or any
                other content — constitutes a recommendation to buy, sell, or
                hold any security.
              </li>
              <li>
                <strong className="text-chalk-50">Data may be stale or wrong.</strong>{" "}
                Financials are sourced from screener.in and processed by an
                automated pipeline. Errors in scraping, TTM vs FY mismatches,
                one-off charges, and filing lags can all distort scores.
              </li>
              <li>
                <strong className="text-chalk-50">Past scores ≠ future returns.</strong>{" "}
                A high fundamental score does not guarantee outperformance. A
                low score does not guarantee underperformance.
              </li>
              <li>
                <strong className="text-chalk-50">Your decisions, your responsibility.</strong>{" "}
                Any investment decision made based on content from this site is
                entirely your own. Consult a qualified financial advisor before
                investing.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* What this site IS */}
      <section className="mb-12 space-y-4 text-chalk-200 serif text-lg leading-relaxed">
        <h2 className="font-sans text-2xl font-semibold text-chalk-50 not-italic">
          What this site actually is
        </h2>
        <p>
          This is a personal learning project. I built it to develop and
          document my own understanding of fundamental analysis — and to share
          that process transparently with anyone who wants to see it.
        </p>
        <p>
          Every score on this site is the output of a rule-based rubric I
          designed. The rules reflect my current understanding of what makes a
          company fundamentally sound. That understanding will evolve. The
          rubric will change. The scores are a snapshot, not a verdict.
        </p>
        <p>
          Think of it as a structured checklist made visible — not a black-box
          rating or an authoritative ranking. The value is in the breakdown,
          not the final number.
        </p>
      </section>

      {/* My understanding of fundamental analysis */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="h-5 w-5 text-accent" />
          <h2 className="text-2xl font-semibold text-chalk-50">
            My understanding of fundamental analysis
          </h2>
        </div>

        <div className="space-y-8">
          <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-5">
            <h3 className="font-semibold text-chalk-50 text-lg">
              1. Businesses first, stocks second
            </h3>
            <p className="mt-2 text-chalk-300 text-sm serif leading-relaxed">
              A stock is a fractional ownership of a real business. Fundamental
              analysis starts by asking: is this a good business? That means
              reading annual reports, understanding how the company earns money,
              who its customers are, what its competitive advantages are, and
              whether management allocates capital well. The score is a
              quantitative shortcut — it cannot replace reading the actual
              report.
            </p>
          </div>

          <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-5">
            <h3 className="font-semibold text-chalk-50 text-lg">
              2. Sector context is non-negotiable
            </h3>
            <p className="mt-2 text-chalk-300 text-sm serif leading-relaxed">
              An OPM of 8% is exceptional in oil refining (where 6% is median)
              and poor in specialty chemicals (where 20% is typical). A D/E of
              2x is fine for an NBFC and alarming for a consumer goods company.
              Evaluating any metric in isolation, without understanding the
              sector's structural economics, leads to wrong conclusions. This is
              why every score on this site is computed relative to the peer group
              — not against a universal absolute.
            </p>
          </div>

          <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-5">
            <h3 className="font-semibold text-chalk-50 text-lg">
              3. Five-year trends beat single-year snapshots
            </h3>
            <p className="mt-2 text-chalk-300 text-sm serif leading-relaxed">
              One good year can be luck, a commodity cycle, or accounting
              adjustment. Five years of consistent revenue growth, expanding
              margins, improving returns on capital, and positive free cash flow
              is much harder to fake. I weight multi-year trends heavily. A
              company that looked great last year but has been eroding for four
              years before that scores poorly — and rightfully so.
            </p>
          </div>

          <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-5">
            <h3 className="font-semibold text-chalk-50 text-lg">
              4. Cash flow quality matters more than reported profit
            </h3>
            <p className="mt-2 text-chalk-300 text-sm serif leading-relaxed">
              Net profit is an opinion; cash flow is a fact. A company that
              reports ₹500 Cr profit but only converts ₹200 Cr to operating
              cash flow deserves scrutiny — the rest may be stuck in working
              capital, receivables that may never be collected, or accounting
              entries with no cash backing. I look at CFO-to-operating-profit
              conversion and whether free cash flow has been consistently
              positive.
            </p>
          </div>

          <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-5">
            <h3 className="font-semibold text-chalk-50 text-lg">
              5. Promoter skin-in-the-game signals alignment
            </h3>
            <p className="mt-2 text-chalk-300 text-sm serif leading-relaxed">
              I pay close attention to shareholding patterns. A promoter who is
              steadily buying shares signals confidence. One who is pledging
              shares signals financial stress. Consistent FII and DII buying
              suggests institutional validation — though institutions are wrong
              too. Pledging above 30% is an explicit risk flag in my rubric
              because it means promoters have borrowed against their equity,
              creating downside pressure if the stock falls.
            </p>
          </div>

          <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-5">
            <h3 className="font-semibold text-chalk-50 text-lg">
              6. Valuation: margin of safety is the anchor
            </h3>
            <p className="mt-2 text-chalk-300 text-sm serif leading-relaxed">
              A great business at a terrible price is a bad investment. I look
              at P/E relative to the sector median, P/BV, an estimated intrinsic
              value range, and PEG. None of these alone is definitive —
              together, they give a sense of whether the market is pricing in
              excessive optimism. I give the most points when a stock trades at
              a meaningful discount to my estimate of intrinsic value: the
              "margin of safety" principle from Benjamin Graham that Warren
              Buffett built on.
            </p>
          </div>

          <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-5">
            <h3 className="font-semibold text-chalk-50 text-lg">
              7. The score is a starting point, not a finish line
            </h3>
            <p className="mt-2 text-chalk-300 text-sm serif leading-relaxed">
              A high score tells you a company looks fundamentally healthy
              relative to peers on a set of quantitative metrics. It does not
              tell you about management quality, competitive moat durability,
              regulatory risk, macro headwinds, the pipeline of new products, or
              a dozen other qualitative factors that drive long-term returns.
              Use the score to shortlist; use reading and research to decide.
            </p>
          </div>
        </div>
      </section>

      {/* How to use this tool */}
      <section className="mb-12 space-y-4 text-chalk-200 serif text-lg leading-relaxed">
        <h2 className="font-sans text-2xl font-semibold text-chalk-50 not-italic">
          How I suggest using this tool
        </h2>
        <p>
          Use the sector leaderboard to identify which companies in a sector
          score well across fundamentals. Then click into the breakdown and ask
          yourself: do I agree with what the data says? Where does the company
          score poorly — and is that a temporary issue or a structural problem?
        </p>
        <p>
          Use the radar overlay to compare two companies head-to-head across
          categories. It's a useful way to see where Company A beats Company B
          and vice versa — and to decide which trade-off you're comfortable with.
        </p>
        <p>
          Use this site to build intuition about what good fundamentals look
          like — not to find "the stock to buy this week." The best investors I
          know use quantitative tools to generate questions, not answers.
        </p>
      </section>

      {/* Final note */}
      <section className="mb-12 rounded-xl border border-ink-700/60 bg-ink-900/40 p-6 space-y-3 text-chalk-300 text-sm leading-relaxed">
        <p>
          <strong className="text-chalk-50">A note on limitations:</strong> This
          rubric reflects my personal model of what makes a stock fundamentally
          attractive. It is not the only valid model. Value investors, growth
          investors, GARP investors, and quality investors all weight factors
          differently — and all have periods of outperformance. My rubric skews
          toward quality-at-reasonable-value with a tilt toward capital
          efficiency and cash flow conversion. That may not match your
          investment style.
        </p>
        <p>
          If you disagree with how I weight something — good. Disagreement is
          where thinking happens. I'd genuinely love to hear your perspective.{" "}
          <a
            href="mailto:aditya33agrawal@gmail.com"
            className="text-accent hover:underline"
          >
            Email me
          </a>{" "}
          or find me on{" "}
          <a
            href="https://www.linkedin.com/in/adi33/"
            target="_blank"
            rel="noreferrer noopener"
            className="text-accent hover:underline"
          >
            LinkedIn
          </a>
          .
        </p>
      </section>

      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-lg bg-accent text-ink-950 px-4 py-2 text-sm font-semibold hover:bg-accent/90"
      >
        Explore the sectors <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
