"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, BarChart3, TrendingUp, Shield } from "lucide-react";

export function HeroGuestOverlay() {
  const pathname = usePathname();
  const [status, setStatus] = useState<"loading" | "guest" | "user">("loading");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setStatus(d?.user ? "user" : "guest"); })
      .catch(() => { if (!cancelled) setStatus("guest"); });
    return () => { cancelled = true; };
  }, [pathname]);

  if (status !== "guest") return null;

  return (
    <div className="absolute inset-0 z-10 flex items-end justify-center pb-10 sm:pb-14">
      {/* Gradient veil - heavier at bottom where CTA lives */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, rgb(var(--ink-950) / 0.35) 40%, rgb(var(--ink-950) / 0.88) 70%, rgb(var(--ink-950)) 100%)",
        }}
      />

      {/* CTA card */}
      <div className="relative w-full max-w-lg mx-4 glass border-subtle rounded-2xl px-6 py-6 text-center shadow-2xl">
        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-5">
          {[
            { icon: BarChart3, label: "10 score categories" },
            { icon: TrendingUp, label: "500+ companies" },
            { icon: Shield,    label: "No black boxes" },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/8 px-3 py-1 text-[11px] font-semibold text-accent tracking-wide"
            >
              <Icon className="h-3 w-3" />
              {label}
            </span>
          ))}
        </div>

        <h2 className="text-xl font-bold text-chalk-50 leading-snug mb-2">
          Sign in to explore every score
        </h2>
        <p className="text-sm text-chalk-200 leading-relaxed mb-6">
          Free access to sector leaderboards, per-company breakdowns, and the full scoring rationale behind every number.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-ink-950 hover:opacity-90 transition-opacity"
          >
            Create free account <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink-700 px-5 py-2.5 text-sm font-medium text-chalk-200 hover:text-chalk-50 hover:border-ink-600 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
