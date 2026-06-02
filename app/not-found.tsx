import Link from "next/link";
import { ArrowRight, Compass, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 hero-grid pointer-events-none" />
      <div
        className="absolute top-[-160px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,210,255,0.1) 0%, transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-xl px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/8 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent mb-8">
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent" />
          404 · Page not found
        </div>

        <h1 className="text-[clamp(40px,7vw,72px)] font-bold leading-[1.05] tracking-tight text-chalk-50 mb-5">
          We couldn&apos;t find <span className="gradient-text">that page</span>.
        </h1>

        <p className="text-[15px] text-chalk-300/70 leading-relaxed mb-10">
          The link may be broken, or the sector/company isn&apos;t in our dataset yet.
        </p>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl border border-accent/25 bg-accent/10 px-5 py-2.5 text-sm font-semibold text-accent hover:bg-accent/15 hover:border-accent/40 transition-all"
          >
            <Home className="h-4 w-4" /> Home
          </Link>
          <Link
            href="/sectors"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(255,255,255,0.08)] px-5 py-2.5 text-sm font-medium text-chalk-300 hover:text-chalk-50 hover:border-[rgba(255,255,255,0.18)] transition-all"
          >
            <Compass className="h-4 w-4" /> Browse sectors <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          {[
            { href: "/sectors", label: "All Sectors", desc: "Browse every scored sector" },
            { href: "/methodology", label: "Methodology", desc: "How we score companies" },
            { href: "/asset-allocation", label: "Asset Allocation", desc: "Plan your portfolio mix" },
          ].map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="glass border-subtle rounded-2xl p-4 hover:border-[rgba(0,210,255,0.2)] hover:-translate-y-0.5 transition-all"
            >
              <p className="text-sm font-semibold text-chalk-50 mb-1">{c.label}</p>
              <p className="text-xs text-chalk-300/60 leading-relaxed">{c.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
