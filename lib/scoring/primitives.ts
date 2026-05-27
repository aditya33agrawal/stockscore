/**
 * lib/scoring/primitives.ts — StockScore v2 universal scoring primitives.
 *
 * All functions return [0, 1]. Multiply by weight to get points.
 * The same four shapes cover every factor; this makes the system auditable,
 * monotone where claimed, cliff-free, and analytically differentiable.
 */

// ─── Core shapes ─────────────────────────────────────────────────────────────

export function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

/** More is better, bounded. Score = 0 at lo, 1 at hi. */
export function linUp(x: number, lo: number, hi: number): number {
  if (hi === lo) return x >= hi ? 1 : 0;
  return clamp((x - lo) / (hi - lo), 0, 1);
}

/** Less is better, bounded. Score = 1 at lo, 0 at hi. */
export function linDown(x: number, lo: number, hi: number): number {
  if (hi === lo) return x <= lo ? 1 : 0;
  return clamp((hi - x) / (hi - lo), 0, 1);
}

/**
 * Goldilocks zone. Half-open boundaries: [a, b), [b, c], (c, d].
 * Score = 0 outside [a, d], ramps to 1 on [a,b), holds 1 on [b,c],
 * ramps back to 0 on (c,d].
 */
export function band(x: number, a: number, b: number, c: number, d: number): number {
  if (x < a || x > d) return 0;
  if (x >= b && x <= c) return 1;
  if (x < b && b > a) return (x - a) / (b - a);
  if (x > c && d > c) return (d - x) / (d - c);
  return 0;
}

/**
 * Smooth saturating curve — logistic with economically interpretable params.
 *
 * x0         = midpoint (score = 0.5)
 * half_width = distance from x0 at which score reaches 0.9 (or 0.1)
 *
 * Derivation: 0.9 = 1/(1+exp(−k·hw)) ⇒ k = ln(9)/hw ≈ 2.197/hw
 *
 * Example: logistic(roce, 18, 8.8) means:
 *   midpoint at 18%, score 0.9 at ~26.8%, score 0.1 at ~9.2%
 */
export function logistic(x: number, x0: number, half_width: number): number {
  const k = Math.log(9) / Math.max(half_width, 0.001);
  return 1 / (1 + Math.exp(-k * (x - x0)));
}

// ─── Statistical helpers ──────────────────────────────────────────────────────

/** Coefficient of variation (std / |mean|). Returns 0 if insufficient data. */
export function cv(arr: number[]): number {
  const finite = arr.filter(isFinite);
  const n = finite.length;
  if (n < 2) return 0;
  const mean = finite.reduce((s, v) => s + v, 0) / n;
  if (mean === 0) return 0;
  const variance = finite.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1);
  return Math.sqrt(variance) / Math.abs(mean);
}

/** Ordinary least squares slope (change per index step). */
export function olsSlope(arr: number[]): number {
  const finite = arr.filter(isFinite);
  const n = finite.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = finite.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (finite[i] - yMean);
    den += (i - xMean) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

/**
 * Percentile rank of value within arr.
 * Returns 0..1 where 1 = best.
 * higherIsBetter: true → higher value = higher rank.
 */
export function percentileRank(
  value: number,
  arr: number[],
  higherIsBetter: boolean,
): number {
  const valid = arr.filter((v) => isFinite(v) && v !== 0);
  if (valid.length === 0) return 0.5;
  const below = valid.filter((v) =>
    higherIsBetter ? v < value : v > value,
  ).length;
  return below / valid.length;
}

/** Winsorise at lo/hi quantiles (0..1). Clips outliers at those percentiles. */
export function winsorize(arr: number[], lo: number, hi: number): number[] {
  if (arr.length === 0) return [];
  const sorted = [...arr].sort((a, b) => a - b);
  const n = sorted.length;
  const loVal = sorted[Math.floor(lo * n)] ?? sorted[0];
  const hiVal = sorted[Math.min(Math.ceil(hi * n), n - 1)] ?? sorted[n - 1];
  return arr.map((v) => Math.max(loVal, Math.min(hiVal, v)));
}

/**
 * Compound annual growth rate, returned as a percentage (e.g. 12 = 12%).
 * Clamped to [−50, 200] to prevent extreme values from distorting logistic curves.
 */
export function cagr(start: number, end: number, years: number): number {
  if (start <= 0 || years <= 0) return 0;
  const raw = (Math.pow(Math.abs(end) / start, 1 / years) - 1) * 100;
  const signed = end >= 0 ? raw : -raw;
  return clamp(signed, -50, 200);
}

/** Last element of an array, or 0 if empty. */
export function last<T>(arr: T[]): T | 0 {
  return arr.length ? arr[arr.length - 1] : 0;
}

/** Mean of an array, or 0 if empty. */
export function mean(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/** Days between two dates. */
export function daysBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
}
