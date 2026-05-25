import type { Candle } from "./types";
import { toYahooSymbol } from "./symbol-map";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

interface YahooChartResponse {
  chart: {
    result?: Array<{
      timestamp?: number[];
      indicators: {
        quote?: Array<{
          open?: (number | null)[];
          high?: (number | null)[];
          low?: (number | null)[];
          close?: (number | null)[];
          volume?: (number | null)[];
        }>;
        adjclose?: Array<{ adjclose?: (number | null)[] }>;
      };
    }>;
    error?: { code: string; description: string } | null;
  };
}

function toISODate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString().slice(0, 10);
}

export async function fetchYahooCandles(
  ticker: string,
  opts: { range?: string; period1?: number } = {}
): Promise<Candle[]> {
  const symbol = toYahooSymbol(ticker);
  const base = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
  const params = new URLSearchParams({
    interval: "1d",
    events: "div,splits",
    includeAdjustedClose: "true",
  });
  if (opts.period1) {
    params.set("period1", String(opts.period1));
    params.set("period2", String(Math.floor(Date.now() / 1000)));
  } else {
    params.set("range", opts.range ?? "10y");
  }

  const res = await fetch(`${base}?${params.toString()}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Yahoo ${res.status} for ${symbol}`);
  }
  const json = (await res.json()) as YahooChartResponse;
  const result = json.chart.result?.[0];
  if (!result || !result.timestamp || !result.indicators.quote?.[0]) {
    return [];
  }

  const ts = result.timestamp;
  const q = result.indicators.quote[0];
  const adj = result.indicators.adjclose?.[0]?.adjclose;

  const candles: Candle[] = [];
  for (let i = 0; i < ts.length; i++) {
    const o = q.open?.[i];
    const h = q.high?.[i];
    const l = q.low?.[i];
    const c = adj?.[i] ?? q.close?.[i];
    const v = q.volume?.[i];
    if (o == null || h == null || l == null || c == null) continue;
    candles.push({
      t: toISODate(ts[i]),
      o: Number(o.toFixed(4)),
      h: Number(h.toFixed(4)),
      l: Number(l.toFixed(4)),
      c: Number(c.toFixed(4)),
      v: v ?? 0,
    });
  }
  return candles;
}
