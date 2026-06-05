// Override map for tickers in sectors_config.json that don't map cleanly to
// Yahoo's `<TICKER>.NS` convention.
const YAHOO_OVERRIDES: Record<string, string> = {
  "M&M": "M%26M.NS",
  "BAJAJ-AUTO": "BAJAJ-AUTO.NS",
  "NAM-INDIA": "NAM-INDIA.NS",
  "VA TECH": "VATECHWAB.NS",
  // Live LTIMindtree; screener serves it under MINDTREE, Yahoo only via BSE 540005.
  MINDTREE: "540005.BO",
  // BSE-only / unreliable-NSE listings — no usable NSE feed on Yahoo.
  JAGAJITIND: "JAGAJITIND.BO",
  SPICEJET: "SPICEJET.BO",
  SPICELEC: "517385.BO",
};

export function toYahooSymbol(ticker: string): string {
  if (YAHOO_OVERRIDES[ticker]) return YAHOO_OVERRIDES[ticker];
  return `${ticker}.NS`;
}

export function toNseSymbol(ticker: string): string {
  // NSE expects the raw symbol; strip spaces just in case.
  return ticker.replace(/\s+/g, "");
}
