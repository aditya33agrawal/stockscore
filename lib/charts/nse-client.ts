import type { Candle } from "./types";
import { toNseSymbol } from "./symbol-map";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

interface NseRow {
  CH_TIMESTAMP: string; // YYYY-MM-DD
  CH_OPENING_PRICE: number;
  CH_TRADE_HIGH_PRICE: number;
  CH_TRADE_LOW_PRICE: number;
  CH_CLOSING_PRICE: number;
  CH_TOT_TRADED_QTY: number;
}

interface NseResponse {
  data?: NseRow[];
}

let cookieCache: { value: string; ts: number } | null = null;
const COOKIE_TTL_MS = 10 * 60 * 1000;

async function warmCookies(): Promise<string> {
  if (cookieCache && Date.now() - cookieCache.ts < COOKIE_TTL_MS) {
    return cookieCache.value;
  }
  const res = await fetch("https://www.nseindia.com/", {
    headers: {
      "User-Agent": UA,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  const raw = res.headers.get("set-cookie") ?? "";
  // The combined set-cookie header has cookies separated by ", " — preserve only key=value pairs.
  const cookies = raw
    .split(/,(?=[^;]+?=)/)
    .map((c) => c.split(";")[0].trim())
    .filter(Boolean)
    .join("; ");
  cookieCache = { value: cookies, ts: Date.now() };
  return cookies;
}

export function clearNseCookies() {
  cookieCache = null;
}

function fmtDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export async function fetchNseCandles1Y(ticker: string): Promise<Candle[]> {
  const symbol = toNseSymbol(ticker);
  const to = new Date();
  const from = new Date();
  from.setFullYear(from.getFullYear() - 1);

  const cookies = await warmCookies();
  const url = new URL("https://www.nseindia.com/api/historical/cm/equity");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("series", '["EQ"]');
  url.searchParams.set("from", fmtDate(from));
  url.searchParams.set("to", fmtDate(to));

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": UA,
      Accept: "application/json",
      Referer: `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(symbol)}`,
      Cookie: cookies,
    },
  });
  if (!res.ok) {
    clearNseCookies();
    throw new Error(`NSE ${res.status} for ${symbol}`);
  }
  const json = (await res.json()) as NseResponse;
  const rows = json.data ?? [];
  // NSE returns latest-first — flip to chronological.
  return rows
    .map((r) => ({
      t: r.CH_TIMESTAMP,
      o: r.CH_OPENING_PRICE,
      h: r.CH_TRADE_HIGH_PRICE,
      l: r.CH_TRADE_LOW_PRICE,
      c: r.CH_CLOSING_PRICE,
      v: r.CH_TOT_TRADED_QTY,
    }))
    .sort((a, b) => a.t.localeCompare(b.t));
}
