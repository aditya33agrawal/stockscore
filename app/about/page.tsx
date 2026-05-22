import Link from "next/link";
import { Mail, Linkedin, Github, BookOpen, MapPin } from "lucide-react";

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
      "Saving rate matters more than returns in the early years. Lump sum > DCA mathematically, but DCA wins behaviourally.",
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
    body: "Price is a vote. Earnings are the weighing machine. I anchor every position on five-year financials before I look at a chart.",
  },
  {
    title: "Sector context, always",
    body: "A 15% ROE is brilliant in cement and average in private banks. Comparison is the analyst's first job.",
  },
  {
    title: "Behaviour > prediction",
    body: "I don't know what the market does next week. I do know I won't sell in a panic if I understood why I bought.",
  },
  {
    title: "Accessibility matters",
    body: "Good advice shouldn't be reserved for ₹1 cr+ clients. The seven friends I've guided through their first SIPs are the proof.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* Header */}
      <header className="flex items-start gap-6 mb-10">
        <div
          className="h-20 w-20 shrink-0 rounded-full bg-gradient-to-br from-accent/80 to-accent/30 ring-2 ring-accent/40 flex items-center justify-center text-2xl font-bold text-ink-950"
          aria-label="Avatar"
        >
          AA
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-chalk-50">
            Hi, I'm Aditya.
          </h1>
          <p className="mt-2 text-chalk-300 serif text-lg leading-relaxed">
            Full-stack developer by training, self-taught investor since 2021,
            transitioning into wealth management and investment advisory.
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs text-chalk-300/80">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> Bengaluru, India
            </span>
          </div>
        </div>
      </header>

      {/* Story */}
      <section className="mb-12 space-y-4 text-chalk-200 serif text-lg leading-relaxed">
        <h2 className="font-sans text-xl font-semibold text-chalk-50 not-italic">
          The story
        </h2>
        <p>
          I invested my first ₹ in 2021 — my final-year B.Tech internship
          stipend, parked into direct equities because I wanted to learn by
          having skin in the game. The first year, I read nothing but P&L
          statements, balance sheets, and cash flow reports.
        </p>
        <p>
          Over time, the equity-only approach grew into multi-asset portfolio
          management: equity mutual funds, debt funds, gold and silver ETFs,
          all stitched together with asset-allocation principles. Books like{" "}
          <em>The Warren Buffett Way</em>, <em>Coffee Can Investing</em>, and{" "}
          <em>Just Keep Buying</em> shaped how I think about risk, time, and
          temperament.
        </p>
        <p>
          Along the way, seven friends and family members asked for help with
          their own investing. Goal setting, SIP planning, fund selection,
          basic risk profiling — explained in plain language. That experience
          convinced me I want to do this for a living.
        </p>
        <p>
          This website is the proof of work for that pivot. The scoring engine
          underneath is Python; the analytical opinions are mine.
        </p>
      </section>

      {/* Philosophy */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-chalk-50 mb-4">
          My investing philosophy
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {PHILOSOPHY.map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-5"
            >
              <h3 className="font-semibold text-chalk-50">{p.title}</h3>
              <p className="mt-2 text-sm text-chalk-300 serif leading-relaxed">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Books */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-4 w-4 text-accent" />
          <h2 className="text-xl font-semibold text-chalk-50">
            Books that shaped me
          </h2>
        </div>
        <ul className="divide-y divide-ink-700/40 rounded-xl border border-ink-700/60 bg-ink-900/40">
          {BOOKS.map((b) => (
            <li key={b.title} className="px-5 py-4">
              <p className="font-semibold text-chalk-50">{b.title}</p>
              <p className="text-xs text-chalk-300/70 mt-0.5">{b.author}</p>
              <p className="text-sm text-chalk-300 serif mt-2 leading-relaxed">
                {b.takeaway}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* What now */}
      <section className="mb-12 space-y-3 text-chalk-200 serif text-lg leading-relaxed">
        <h2 className="font-sans text-xl font-semibold text-chalk-50 not-italic">
          What I'm doing now
        </h2>
        <p>
          I cleared the CAT in November 2025 at the 95.83 percentile and I'm
          actively looking for wealth-management and investment-advisory roles
          at fintechs and AMCs. I keep building this project on the side — new
          sectors, deeper rubric, better visualisations.
        </p>
      </section>

      {/* CTA */}
      <section className="rounded-xl border border-accent/30 bg-accent/5 p-6">
        <h2 className="text-xl font-semibold text-chalk-50">
          Let's talk
        </h2>
        <p className="mt-2 text-chalk-300 text-sm">
          If you're hiring, building something in this space, or just want to
          chat about investing — I'd love to hear from you.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="mailto:aditya33agrawal@gmail.com"
            className="inline-flex items-center gap-2 rounded-lg bg-accent text-ink-950 px-4 py-2 text-sm font-semibold hover:bg-accent/90"
          >
            <Mail className="h-4 w-4" /> Email me
          </a>
          <a
            href="https://www.linkedin.com/in/aditya33agrawal/"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 rounded-lg border border-ink-700/60 px-4 py-2 text-sm hover:bg-ink-800/60"
          >
            <Linkedin className="h-4 w-4" /> LinkedIn
          </a>
          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 rounded-lg border border-ink-700/60 px-4 py-2 text-sm hover:bg-ink-800/60"
          >
            <Github className="h-4 w-4" /> GitHub
          </a>
          <Link
            href="/resume"
            className="inline-flex items-center gap-2 rounded-lg border border-ink-700/60 px-4 py-2 text-sm hover:bg-ink-800/60"
          >
            View resume
          </Link>
        </div>
      </section>
    </div>
  );
}
