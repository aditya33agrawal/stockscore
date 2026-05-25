import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Learn the Metrics",
  description: "Plain-English explainer for every financial metric used in Stockscore — what it means, how to read it, and what to watch out for.",
};

interface MetricCard {
  id: string;
  term: string;
  tagline: string;
  meaning: string;
  howToRead: { label: string; desc: string }[];
  traps: string[];
  range?: { bad: string; ok: string; good: string };
}

const metrics: MetricCard[] = [
  {
    id: "pe",
    term: "P/E Ratio",
    tagline: "How much are you paying for ₹1 of earnings?",
    meaning:
      "Price-to-Earnings ratio = Current share price ÷ Earnings per share. If a stock trades at ₹100 and earns ₹5 per share, the P/E is 20x. You're paying ₹20 for every ₹1 the company earns today.",
    howToRead: [
      { label: "Low P/E", desc: "Could be cheap — or could mean the market expects earnings to fall. Always check why." },
      { label: "High P/E", desc: "Market believes earnings will grow strongly. You're paying upfront for future profits." },
      { label: "vs Industry P/E", desc: "The most useful comparison. A P/E of 15x in banking is expensive; in IT it's a bargain." },
    ],
    traps: [
      "In cyclical sectors (metals, cement), a low P/E near the top of the cycle is a warning, not a bargain — earnings are temporarily high.",
      "Loss-making companies have no P/E. Don't compare them to profitable peers.",
    ],
    range: { bad: "< 5 (distressed) or > 80 (speculative)", ok: "Industry median ± 20%", good: "20–30% below industry median with improving earnings" },
  },
  {
    id: "roce",
    term: "ROCE",
    tagline: "How well does the business use every rupee deployed?",
    meaning:
      "Return on Capital Employed = EBIT ÷ Capital Employed. Capital employed is essentially all the money working in the business (equity + debt). ROCE asks: for every ₹100 put to work, how much does the business earn before interest and tax?",
    howToRead: [
      { label: "ROCE > 20%", desc: "Excellent — business has a strong competitive advantage or pricing power." },
      { label: "ROCE > 12%", desc: "Decent — earning above cost of capital. Business is creating value." },
      { label: "ROCE < 10%", desc: "Potentially destroying value if cost of capital is higher. Investigate why." },
    ],
    traps: [
      "Capital-light businesses (software, financials) naturally show very high ROCE — compare within sectors only.",
      "A new factory or acquisition can temporarily tank ROCE before it starts contributing. Look at the trend.",
    ],
  },
  {
    id: "roe",
    term: "ROE",
    tagline: "How much does the company earn on shareholders' money?",
    meaning:
      "Return on Equity = Net Profit ÷ Shareholders' Equity. If you put ₹100 into a business and it earns ₹18 net profit, ROE is 18%. It measures how efficiently management uses equity capital.",
    howToRead: [
      { label: "ROE > 20%", desc: "Strong — management consistently delivers high returns to shareholders." },
      { label: "ROE 12–20%", desc: "Solid. The business earns meaningfully above bank FD rates." },
      { label: "ROE < 10%", desc: "Weak. Management may be destroying value; compare to ROCE to understand why." },
    ],
    traps: [
      "High debt artificially inflates ROE (financial leverage). Always check ROE alongside D/E.",
      "One-time gains can spike ROE in a year. Look at 5-year average ROE, not a single year.",
    ],
  },
  {
    id: "opm",
    term: "OPM (Operating Profit Margin)",
    tagline: "What fraction of every rupee of revenue is actual operating profit?",
    meaning:
      "OPM = EBIT ÷ Revenue × 100. If a company earns ₹15 operating profit on ₹100 of sales, OPM is 15%. It strips out interest and tax to show the core business profitability.",
    howToRead: [
      { label: "High OPM", desc: "Company has pricing power or cost advantages. Harder for competitors to undercut." },
      { label: "Rising OPM trend", desc: "Margins are expanding — scale is kicking in or raw material costs are falling." },
      { label: "Falling OPM", desc: "Competition intensifying, or costs rising faster than revenue. Red flag if sustained." },
    ],
    traps: [
      "A 5% OPM in oil refining is excellent; the same in software is terrible. Always context-dependent.",
      "OPM ignores depreciation policy differences between companies. Use EBITDA margin for capital-heavy businesses.",
    ],
  },
  {
    id: "de",
    term: "Debt to Equity (D/E)",
    tagline: "How much has the company borrowed relative to what its owners own?",
    meaning:
      "D/E = Total Debt ÷ Shareholders' Equity. A D/E of 0.5 means ₹50 of debt for every ₹100 of equity — fairly conservative. A D/E of 3 means ₹300 of debt per ₹100 of equity — high leverage.",
    howToRead: [
      { label: "D/E < 0.5", desc: "Low leverage. Company can absorb shocks and doesn't depend on borrowed money." },
      { label: "D/E 0.5–1.5", desc: "Moderate. Normal for most manufacturing businesses. Not a concern on its own." },
      { label: "D/E > 2", desc: "High. Fine for infrastructure or banking (where it's structural) — a warning in consumer businesses." },
    ],
    traps: [
      "Some industries (banking, NBFCs, infra) operate with inherently high D/E. Never compare across sectors.",
      "Off-balance-sheet obligations (operating leases, contingent liabilities) can make D/E look artificially low.",
    ],
  },
  {
    id: "market-cap",
    term: "Market Cap",
    tagline: "What is the entire business worth at today's share price?",
    meaning:
      "Market Cap = Share Price × Total Shares Outstanding. It is the market's current estimate of a company's total value. Large-cap (> ₹20,000 Cr) are more stable; mid-cap (₹5,000–20,000 Cr) offer growth; small-cap (< ₹5,000 Cr) are riskier but can be multi-baggers.",
    howToRead: [
      { label: "Large-cap", desc: "Institutional coverage, liquidity, slower but steadier growth." },
      { label: "Mid-cap", desc: "Sweet spot for growth investors — less crowded than large-caps." },
      { label: "Small-cap", desc: "Illiquid, less researched — higher risk and higher potential reward." },
    ],
    traps: [
      "Market cap can grow purely by share price increase without any fundamental improvement.",
      "Don't confuse market cap with enterprise value — EV includes debt and is a better measure for acquisition math.",
    ],
  },
  {
    id: "sales-growth",
    term: "Revenue / Sales Growth",
    tagline: "Is the business actually getting bigger?",
    meaning:
      "Revenue growth (and its 5/10-year CAGR) tells you whether the company is expanding its market reach, gaining customers, or just keeping pace with inflation. Compounded Annual Growth Rate (CAGR) smooths out single-year spikes.",
    howToRead: [
      { label: "Sales CAGR > 15%", desc: "Fast-growing business. Check if it's sustainable and not margin-dilutive." },
      { label: "Sales CAGR 8–15%", desc: "Steady compounder — growing above GDP, probably gaining market share." },
      { label: "Sales CAGR < 5%", desc: "Slow. Could be a mature business in a low-growth sector — or stagnating." },
    ],
    traps: [
      "Revenue growth without profit growth is usually a bad sign — the company may be buying revenue with low-margin contracts.",
      "Accounting changes (GST transition, Ind-AS) can create artificial discontinuities in the revenue line.",
    ],
  },
  {
    id: "returns",
    term: "Stock Returns",
    tagline: "What has the share price done over a given period?",
    meaning:
      "Price return measures how the stock has moved. 1-year return is useful for momentum. 5-year return reflects whether the business created value for shareholders over a full cycle.",
    howToRead: [
      { label: "Strong 1Y + weak 5Y", desc: "Recent rerating, not long-term value creation. Be cautious." },
      { label: "Weak 1Y + strong 5Y", desc: "Short-term dip in a compounding story — potentially interesting entry point." },
      { label: "Sector returns", desc: "Median 1Y return for the whole industry tells you if the re-rating is stock-specific or sector-wide." },
    ],
    traps: [
      "Past returns are not a guarantee of future returns. Use them for context, not prediction.",
      "A stock that's down 40% is not automatically cheap — it may still be overvalued after the fall.",
    ],
  },
  {
    id: "company-count",
    term: "Number of Companies",
    tagline: "How crowded is this industry?",
    meaning:
      "A larger company count means more competition and more data points for comparison. A sector with 3 listed companies versus one with 50 will behave very differently.",
    howToRead: [
      { label: "Few companies (< 5)", desc: "Oligopoly or niche. Leaders often have pricing power but fewer comparison benchmarks." },
      { label: "Moderate (5–20)", desc: "Competitive but structured. Leaders are usually well-established." },
      { label: "Many (> 20)", desc: "Fragmented sector. Margin pressure from competition is higher." },
    ],
    traps: [
      "Listed company count ≠ total industry players. SME/unlisted competition can be intense in fragmented sectors.",
    ],
  },
];

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-14">
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Stockscore</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-chalk-50">
          Learn the Metrics
        </h1>
        <p className="mt-4 text-chalk-300 max-w-2xl text-base leading-relaxed">
          Every number you see on this site, explained in plain English. Not just what it is, but how to read it and what traps to avoid.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {metrics.map((m) => (
            <a
              key={m.id}
              href={`#${m.id}`}
              className="rounded-md border border-ink-700/60 bg-ink-900/40 px-3 py-1 text-xs text-chalk-300 hover:border-accent/40 hover:text-accent transition-colors"
            >
              {m.term}
            </a>
          ))}
        </div>
      </header>

      <div className="space-y-12">
        {metrics.map((m) => (
          <section key={m.id} id={m.id} className="scroll-mt-16">
            <div className="rounded-2xl border border-ink-700/60 bg-ink-900/40 p-6 sm:p-8">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-1">Metric</p>
                <h2 className="text-2xl font-bold text-chalk-50">{m.term}</h2>
                <p className="mt-1 text-chalk-300/80 italic">{m.tagline}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-chalk-300/60 mb-2">What it means</h3>
                <p className="text-sm text-chalk-200 leading-relaxed">{m.meaning}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-chalk-300/60 mb-3">How to read it</h3>
                <div className="space-y-2">
                  {m.howToRead.map((h, i) => (
                    <div key={i} className="flex gap-3 items-start text-sm">
                      <span className="shrink-0 mt-0.5 rounded border border-accent/30 bg-accent/10 text-accent text-xs px-1.5 py-0.5 font-medium">
                        {h.label}
                      </span>
                      <span className="text-chalk-300 leading-relaxed">{h.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {m.range && (
                <div className="mb-6 grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-bad/20 bg-bad/5 p-3">
                    <p className="text-xs font-semibold text-bad mb-1">Watch out</p>
                    <p className="text-xs text-chalk-300">{m.range.bad}</p>
                  </div>
                  <div className="rounded-lg border border-warn/20 bg-warn/5 p-3">
                    <p className="text-xs font-semibold text-warn mb-1">Acceptable</p>
                    <p className="text-xs text-chalk-300">{m.range.ok}</p>
                  </div>
                  <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
                    <p className="text-xs font-semibold text-accent mb-1">Ideal</p>
                    <p className="text-xs text-chalk-300">{m.range.good}</p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-chalk-300/60 mb-3">Common traps</h3>
                <ul className="space-y-2">
                  {m.traps.map((t, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="shrink-0 text-warn mt-0.5">⚠</span>
                      <span className="text-chalk-300 leading-relaxed">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-ink-700/60 bg-ink-900/40 p-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-chalk-50">Ready to apply this?</p>
          <p className="text-xs text-chalk-300 mt-1">Compare sectors or dig into a specific company.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/sectors/compare" className="inline-flex items-center gap-1.5 rounded-md border border-ink-700/60 bg-ink-900 px-3 py-1.5 text-xs text-chalk-100 hover:bg-ink-800 transition-colors">
            Compare Sectors <ArrowRight className="h-3 w-3" />
          </Link>
          <Link href="/sectors" className="inline-flex items-center gap-1.5 rounded-md border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs text-accent hover:bg-accent/20 transition-colors">
            Browse Companies <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
