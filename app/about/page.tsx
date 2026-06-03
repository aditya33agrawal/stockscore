import { ArrowRight, BookOpen, FileText } from "lucide-react";

const RESUME_URL =
  process.env.NEXT_PUBLIC_RESUME_URL ?? "https://aditya33agrawal.github.io/resume.pdf";

const BOOKS = [
  {
    title: "The Warren Buffett Way",
    author: "Robert Hagstrom",
    takeaway:
      "Reading 10-Ks is the work. There's no shortcut around understanding the business.",
  },
  {
    title: "Coffee Can Investing",
    author: "Saurabh Mukherjea",
    takeaway:
      "Concentrate in 10-15 quality companies. Sit on them for a decade. Most damage is self-inflicted churn.",
  },
  {
    title: "Just Keep Buying",
    author: "Nick Maggiulli",
    takeaway:
      "Saving rate matters more than returns in the early years. Lump sum beats DCA mathematically, but DCA wins behaviourally.",
  },
  {
    title: "Psychology of Money",
    author: "Morgan Housel",
    takeaway:
      "Personal finance is more 'personal' than 'finance'. Behaviour beats spreadsheets.",
  },
];

const PHILOSOPHY = [
  {
    title: "Fundamentals first",
    body: "Price is a vote. Earnings are the weighing machine. Every position is anchored on five-year financials before the chart is opened.",
  },
  {
    title: "Sector context, always",
    body: "A 15% ROE is brilliant in cement and average in private banks. Comparison is the analyst's first job.",
  },
  {
    title: "Behaviour over prediction",
    body: "Nobody knows what the market does next week. The edge is in not selling when conviction is clear.",
  },
  {
    title: "Accessibility matters",
    body: "Good analysis should not be reserved for large portfolios. The methodology here is fully documented so any reader can audit it.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">
          About this project
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-chalk-50">
          A transparent, rule-based view of Indian equities.
        </h1>
        <p className="mt-4 text-chalk-300 text-lg leading-relaxed">
          Stockscore breaks down every company across ten fundamental
          categories, with every plus and minus traceable to a documented
          rule. No black boxes, no proprietary scores — just published
          financials, scored consistently.
        </p>
      </header>

      <section className="mb-12">
        <h2 className="text-xl font-semibold text-chalk-50 mb-4">
          Investing philosophy
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {PHILOSOPHY.map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-5"
            >
              <h3 className="font-semibold text-chalk-50">{p.title}</h3>
              <p className="mt-2 text-sm text-chalk-300 leading-relaxed">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-4 w-4 text-accent" />
          <h2 className="text-xl font-semibold text-chalk-50">
            Books that shaped the approach
          </h2>
        </div>
        <ul className="divide-y divide-ink-700/40 rounded-xl border border-ink-700/60 bg-ink-900/40">
          {BOOKS.map((b) => (
            <li key={b.title} className="px-5 py-4">
              <p className="font-semibold text-chalk-50">{b.title}</p>
              <p className="text-xs text-chalk-300/70 mt-0.5">{b.author}</p>
              <p className="text-sm text-chalk-300 mt-2 leading-relaxed">
                {b.takeaway}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-accent/30 bg-accent/5 p-6">
        <h2 className="text-xl font-semibold text-chalk-50">Resume</h2>
        <p className="mt-2 text-chalk-300 text-sm">
          For background on the person behind this project.
        </p>
        <a
          href={RESUME_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent text-ink-950 px-4 py-2 text-sm font-semibold hover:bg-accent/90"
        >
          <FileText className="h-4 w-4" /> View resume <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </section>
    </div>
  );
}
