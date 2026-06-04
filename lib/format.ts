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

/** Human-readable elapsed duration from milliseconds, e.g. "820ms", "12.3s", "1m 04s". */
export function formatDuration(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const totalSec = ms / 1000;
  if (totalSec < 60) return `${totalSec.toFixed(1)}s`;
  const mins = Math.floor(totalSec / 60);
  const secs = Math.round(totalSec % 60);
  return `${mins}m ${String(secs).padStart(2, "0")}s`;
}

/** Compact relative time, e.g. "just now", "5m ago", "3h ago", "2d ago", else a date. */
export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "never";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "—";
  const diff = Date.now() - then;
  const sec = Math.round(diff / 1000);
  if (sec < 45) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return formatDate(iso);
}
