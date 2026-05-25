// Override map for tickers in sectors_config.json that don't map cleanly to
// Yahoo's `<TICKER>.NS` convention.
const YAHOO_OVERRIDES: Record<string, string> = {
  "M&M": "M%26M.NS",
  "BAJAJ-AUTO": "BAJAJ-AUTO.NS",
  "NAM-INDIA": "NAM-INDIA.NS",
  "VA TECH": "VATECHWAB.NS",
};

export function toYahooSymbol(ticker: string): string {
  if (YAHOO_OVERRIDES[ticker]) return YAHOO_OVERRIDES[ticker];
  return `${ticker}.NS`;
}

export function toNseSymbol(ticker: string): string {
  // NSE expects the raw symbol; strip spaces just in case.
  return ticker.replace(/\s+/g, "");
}
