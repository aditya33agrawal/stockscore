import type { Candle, IndicatorPoint } from "./types";

export function sma(candles: Candle[], period: number): IndicatorPoint[] {
  const out: IndicatorPoint[] = [];
  if (candles.length < period) return out;
  let sum = 0;
  for (let i = 0; i < candles.length; i++) {
    sum += candles[i].c;
    if (i >= period) sum -= candles[i - period].c;
    if (i >= period - 1) {
      out.push({ t: candles[i].t, v: sum / period });
    }
  }
  return out;
}

export function rsi(candles: Candle[], period = 14): IndicatorPoint[] {
  const out: IndicatorPoint[] = [];
  if (candles.length <= period) return out;
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = candles[i].c - candles[i - 1].c;
    if (diff >= 0) avgGain += diff;
    else avgLoss -= diff;
  }
  avgGain /= period;
  avgLoss /= period;
  const firstRs = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  out.push({ t: candles[period].t, v: firstRs });

  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].c - candles[i - 1].c;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rs = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    out.push({ t: candles[i].t, v: rs });
  }
  return out;
}

export function computeIndicators(candles: Candle[]) {
  return {
    sma_50: sma(candles, 50),
    sma_200: sma(candles, 200),
    rsi_14: rsi(candles, 14),
  };
}
