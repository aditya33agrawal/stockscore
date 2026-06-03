// Score → Tailwind text-color class
export function scoreColor(score: number): string {
  if (score >= 70) return "text-accent";       // cyan  #00D2FF
  if (score >= 50) return "text-warn";         // amber #F59E0B
  return "text-bad";                           // red   #F87171
}

// Score → Tailwind bg + border classes (for badge-style containers)
export function scoreBg(score: number): string {
  if (score >= 70) return "bg-accent/10 border-accent/30";
  if (score >= 50) return "bg-warn/10 border-warn/30";
  return "bg-bad/10 border-bad/30";
}

// Points → Tailwind text-color class
export function pointsColor(points: number): string {
  if (points > 0) return "text-accent";        // cyan
  if (points < 0) return "text-bad";           // red
  return "text-chalk-300";
}

// Score → flat progress bar fill (kept name for backwards compat; gradients removed).
export function scoreGradient(score: number): string {
  if (score >= 70) return "#5B8DEF";
  if (score >= 50) return "#C9962B";
  return "#D96A6A";
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
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
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
