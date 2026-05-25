export interface Candle {
  t: string; // YYYY-MM-DD
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface IndicatorPoint {
  t: string;
  v: number;
}

export interface ChartPayload {
  symbol: string;
  fetched_at: string;
  source: "yahoo" | "nse";
  range: string; // e.g. "10y" or "1y"
  candles: Candle[];
  indicators: {
    sma_50: IndicatorPoint[];
    sma_200: IndicatorPoint[];
    rsi_14: IndicatorPoint[];
  };
}
