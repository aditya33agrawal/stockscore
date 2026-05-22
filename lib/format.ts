export function scoreColor(score: number): string {
  if (score >= 70) return "text-accent";
  if (score >= 50) return "text-warn";
  return "text-bad";
}

export function scoreBg(score: number): string {
  if (score >= 70) return "bg-accent/10 border-accent/30";
  if (score >= 50) return "bg-warn/10 border-warn/30";
  return "bg-bad/10 border-bad/30";
}

export function pointsColor(points: number): string {
  if (points > 0) return "text-accent";
  if (points < 0) return "text-bad";
  return "text-chalk-300";
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
