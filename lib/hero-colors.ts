// Relative-strength shading for the Nifty-50 hero widgets (score tape + radar
// caption). The fundamental scorer is deliberately strict - no Nifty name
// reaches the app's absolute ≥70 "Invest-grade" green - so the hero shades each
// name by where it stands *within the Nifty cohort* (tertiles): top third green,
// middle amber, bottom third red. This reads like a market gainers/losers tape
// and guarantees green is present. The literal score is always shown alongside,
// so nothing about the absolute number is hidden.

export interface HeroBands {
  lo: number;
  hi: number;
}

/** Tertile cut-points (≈33rd / 67th percentile) of the cohort's scores. */
export function heroBands(scores: number[]): HeroBands {
  const s = [...scores].sort((a, b) => a - b);
  if (s.length === 0) return { lo: 0, hi: 0 };
  const at = (p: number) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  return { lo: at(0.34), hi: at(0.67) };
}

/** CSS color for a score given the cohort bands. */
export function heroColor(score: number, b: HeroBands): string {
  if (score >= b.hi) return "rgb(var(--good))";
  if (score >= b.lo) return "rgb(var(--warn))";
  return "rgb(var(--bad))";
}
