import { fetchYahooCandles } from "./yahoo-client";
import { fetchNseCandles1Y } from "./nse-client";
import { computeIndicators } from "./indicators";
import { getChartRow, upsertChartRow } from "./store";
import type { Candle, ChartPayload } from "./types";

type Log = (msg: string) => void;

const TEN_YEARS_MS = 10 * 365.25 * 24 * 3600 * 1000;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function trimToTenYears(candles: Candle[]): Candle[] {
  const cutoff = new Date(Date.now() - TEN_YEARS_MS).toISOString().slice(0, 10);
  return candles.filter((c) => c.t >= cutoff);
}

function mergeCandles(existing: Candle[], incoming: Candle[]): Candle[] {
  if (!existing.length) return incoming;
  const map = new Map<string, Candle>();
  for (const c of existing) map.set(c.t, c);
  for (const c of incoming) map.set(c.t, c); // incoming wins on duplicate date
  return Array.from(map.values()).sort((a, b) => a.t.localeCompare(b.t));
}

async function fetchFresh(
  ticker: string,
  log: Log,
): Promise<{
  candles: Candle[];
  source: "yahoo" | "nse";
  range: string;
} | null> {
  // Try Yahoo (10y) first
  try {
    const candles = await fetchYahooCandles(ticker, { range: "10y" });
    if (candles.length) {
      return { candles, source: "yahoo", range: "10y" };
    }
    log(`    yahoo returned no candles for ${ticker}, falling back to NSE`);
  } catch (err) {
    log(`    yahoo failed for ${ticker}: ${String(err)} - falling back to NSE`);
  }

  // Fallback: NSE 1y only
  try {
    const candles = await fetchNseCandles1Y(ticker);
    if (candles.length) {
      return { candles, source: "nse", range: "1y" };
    }
    log(`    nse returned no candles for ${ticker}`);
  } catch (err) {
    log(`    nse failed for ${ticker}: ${String(err)}`);
  }
  return null;
}

async function fetchIncremental(
  ticker: string,
  fromDate: string,
  log: Log,
): Promise<{ candles: Candle[]; source: "yahoo" | "nse" } | null> {
  // Yahoo supports period1 (unix seconds) for arbitrary start
  try {
    const period1 = Math.floor(new Date(fromDate).getTime() / 1000);
    const candles = await fetchYahooCandles(ticker, { period1 });
    if (candles.length) {
      return {
        candles: candles.filter((c) => c.t >= fromDate),
        source: "yahoo",
      };
    }
  } catch (err) {
    log(`    yahoo incremental failed for ${ticker}: ${String(err)}`);
  }
  // For NSE-sourced rows, just re-fetch 1y and let merge handle it.
  try {
    const candles = await fetchNseCandles1Y(ticker);
    if (candles.length) {
      return { candles: candles.filter((c) => c.t >= fromDate), source: "nse" };
    }
  } catch (err) {
    log(`    nse incremental failed for ${ticker}: ${String(err)}`);
  }
  return null;
}

export async function refreshSymbol(
  ticker: string,
  log: Log,
  force = false,
): Promise<{
  status: "saved" | "skipped" | "errored";
  source?: string;
  candleCount?: number;
}> {
  const existing = force ? null : await getChartRow(ticker);
  const today = todayISO();

  if (existing && existing.last_candle_date >= today) {
    return { status: "skipped" };
  }

  let candles: Candle[];
  let source: "yahoo" | "nse";
  let range: string;

  if (existing && existing.payload.candles.length > 0) {
    // Incremental
    const fromDate = nextDay(existing.last_candle_date);
    const delta = await fetchIncremental(ticker, fromDate, log);
    if (!delta) {
      return { status: "errored" };
    }
    candles = trimToTenYears(
      mergeCandles(existing.payload.candles, delta.candles),
    );
    source = delta.source;
    range = existing.payload.range; // preserve original range label
  } else {
    // First-time fetch (or force)
    const fresh = await fetchFresh(ticker, log);
    if (!fresh) {
      return { status: "errored" };
    }
    candles = trimToTenYears(fresh.candles);
    source = fresh.source;
    range = fresh.range;
  }

  if (!candles.length) {
    return { status: "errored" };
  }

  const indicators = computeIndicators(candles);
  const payload: ChartPayload = {
    symbol: ticker,
    fetched_at: new Date().toISOString(),
    source,
    range,
    candles,
    indicators,
  };

  await upsertChartRow({
    symbol: ticker,
    fetched_at: payload.fetched_at,
    last_candle_date: candles[candles.length - 1].t,
    source,
    range_years: range === "10y" ? 10 : 1,
    payload,
  });

  return { status: "saved", source, candleCount: candles.length };
}

function nextDay(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
