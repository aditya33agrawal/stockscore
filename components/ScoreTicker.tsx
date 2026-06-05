"use client";

import type { HeroCompany } from "@/lib/data";
import { heroBands, heroColor } from "@/lib/hero-colors";

/** A slim, continuously scrolling tape of Nifty-50 scores. Pure CSS animation
 *  (no canvas / JS loop) so it costs almost nothing; pauses on hover and for
 *  users who prefer reduced motion. */
export function ScoreTicker({ companies }: { companies: HeroCompany[] }) {
  if (companies.length === 0) return null;

  const bands = heroBands(companies.map((c) => c.score));
  const list = [...companies].sort((a, b) => a.ticker.localeCompare(b.ticker));
  const seq = [...list, ...list]; // duplicated for a seamless loop

  return (
    <div
      className="score-ticker relative w-full overflow-hidden border-y border-subtle bg-ink-900/40"
      aria-hidden="true"
      style={{
        maskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
      }}
    >
      <div className="score-ticker-track flex w-max items-center gap-7 py-2">
        {seq.map((c, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: heroColor(c.score, bands) }} />
            <span className="text-[11px] font-semibold tracking-wide text-chalk-200">{c.ticker}</span>
            <span className="num text-[11px] font-bold" style={{ color: heroColor(c.score, bands) }}>
              {c.score.toFixed(1)}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
