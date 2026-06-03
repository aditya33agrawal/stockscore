import Link from "next/link";
import { Linkedin, Mail } from "lucide-react";

const FOOTER_LINKS = [
  { href: "/sectors",          label: "Sectors" },
  { href: "/learn",            label: "Learn" },
  { href: "/methodology",      label: "Methodology" },
  { href: "/asset-allocation", label: "Asset Allocation" },
  { href: "/blog",             label: "Blog" },
  { href: "/about",            label: "About" },
  { href: "/contact",          label: "Feedback" },
  { href: "/terms",            label: "Terms" },
];

function WaveformIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-[rgb(var(--chalk-100)_/_0.05)] bg-ink-950">
      {/* Upper section */}
      <div className="mx-auto max-w-7xl px-6 pt-12 pb-8">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">

          {/* Brand + description */}
          <div className="max-w-xs">
            <Link href="/" className="inline-flex items-center gap-2.5 group mb-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent">
                <WaveformIcon />
              </span>
              <span className="text-[15px] font-bold tracking-tight text-chalk-50">
                Stock<span className="text-accent">score</span>
              </span>
            </Link>
            <p className="text-sm text-chalk-300/80 leading-relaxed">
              Transparent, rule-based fundamental analysis of Indian equities — scored sector by sector.
            </p>

            {/* Social links */}
            <div className="mt-5 flex items-center gap-3">
              <a
                href="mailto:aditya33agrawal@gmail.com"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-700 text-chalk-300/70 hover:border-accent/30 hover:text-accent transition-all"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href="https://www.linkedin.com/in/aditya33agrawal/"
                target="_blank"
                rel="noreferrer noopener"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-700 text-chalk-300/70 hover:border-accent/30 hover:text-accent transition-all"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Nav links */}
          <nav className="grid grid-cols-2 gap-x-16 gap-y-2 sm:grid-cols-3">
            {FOOTER_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-chalk-300/70 hover:text-accent transition-colors py-1"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[rgb(var(--chalk-100)_/_0.04)]">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-6 py-4 md:flex-row md:items-center">
          <p className="text-xs text-chalk-300/55">
            © {new Date().getFullYear()} Stockscore · Built with Next.js
          </p>
          <p className="text-xs text-chalk-300/55">
            Data from{" "}
            <Link href="https://www.screener.in" className="hover:text-accent transition-colors underline underline-offset-2">
              screener.in
            </Link>
            {" · "}
            <Link href="/terms" className="hover:text-accent transition-colors underline underline-offset-2">
              Not investment advice
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
