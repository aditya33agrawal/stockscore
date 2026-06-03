// Score → Tailwind text-color class (green = good verdict)
export function scoreColor(score: number): string {
  if (score >= 70) return "text-good";         // green #3F7A52
  if (score >= 50) return "text-warn";         // amber #B8862B
  return "text-bad";                           // red   #B0524E
}

// Score → Tailwind bg + border classes (for badge-style containers)
export function scoreBg(score: number): string {
  if (score >= 70) return "bg-good/10 border-good/30";
  if (score >= 50) return "bg-warn/10 border-warn/30";
  return "bg-bad/10 border-bad/30";
}

// Points → Tailwind text-color class
export function pointsColor(points: number): string {
  if (points > 0) return "text-good";          // green
  if (points < 0) return "text-bad";           // red
  return "text-chalk-300";
}

// Score → flat progress bar fill (kept name for backwards compat; gradients removed).
export function scoreGradient(score: number): string {
  if (score >= 70) return "#3F7A52";
  if (score >= 50) return "#B8862B";
  return "#B0524E";
}

// Classification label → display text
export function classificationLabel(c: string): string {
  const map: Record<string, string> = {
    "exceptional":    "Exceptional",
    "invest-grade":   "Invest-grade",
    "accumulate":     "Accumulate",
    "watchlist":      "Watchlist",
    "avoid":          "Avoid",
  };
  return map[c?.toLowerCase()] ?? c ?? "—";
}

// Classification → Tailwind color + bg classes for pill badges
export function classificationStyle(c: string): string {
  const key = c?.toLowerCase();
  if (key === "exceptional" || key === "invest-grade")
    return "bg-good/10 text-good border-good/20";
  if (key === "accumulate")
    return "bg-accent/10 text-accent border-accent/20";
  if (key === "watchlist")
    return "bg-warn/10 text-warn border-warn/20";
  return "bg-bad/10 text-bad border-bad/20";
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
