// Maps the 1..100 horizon scale to a real time duration. Monotonic, roughly
// log-shaped so the slider spends more resolution on the "years" range where
// most decisions actually live.
const STOPS: { at: number; years: number; label: string }[] = [
  { at: 1, years: 0.003, label: "1 day" },
  { at: 5, years: 0.02, label: "1 week" },
  { at: 12, years: 0.08, label: "1 month" },
  { at: 22, years: 0.5, label: "6 months" },
  { at: 32, years: 1, label: "1 year" },
  { at: 45, years: 3, label: "3 years" },
  { at: 60, years: 7, label: "7 years" },
  { at: 75, years: 15, label: "15 years" },
  { at: 90, years: 30, label: "30 years" },
  { at: 100, years: 50, label: "Lifetime" },
];

export function horizonYears(scale: number): number {
  const s = Math.max(1, Math.min(100, scale));
  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i];
    const b = STOPS[i + 1];
    if (s >= a.at && s <= b.at) {
      const t = b.at === a.at ? 0 : (s - a.at) / (b.at - a.at);
      // log-interpolate so small scale changes near the short end still move
      // the (tiny) year value meaningfully
      const logA = Math.log(Math.max(a.years, 0.001));
      const logB = Math.log(Math.max(b.years, 0.001));
      return Math.exp(logA + (logB - logA) * t);
    }
  }
  return STOPS[STOPS.length - 1].years;
}

export function horizonNorm(scale: number): number {
  const s = Math.max(1, Math.min(100, scale));
  return (s - 1) / 99;
}

export function horizonLabel(scale: number): string {
  const s = Math.max(1, Math.min(100, scale));
  let nearest = STOPS[0];
  for (const stop of STOPS) {
    if (Math.abs(stop.at - s) < Math.abs(nearest.at - s)) nearest = stop;
  }
  return nearest.label;
}

export const HORIZON_TICKS = STOPS.map((s) => ({ at: s.at, label: s.label }));
