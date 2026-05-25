import sql from "../db";
import type { ChartPayload } from "./types";

export interface ChartRow {
  symbol: string;
  fetched_at: string;
  last_candle_date: string;
  source: string;
  range_years: number;
  payload: ChartPayload;
}

export async function getChartRow(symbol: string): Promise<ChartRow | null> {
  const rows = await sql<ChartRow[]>`
    SELECT symbol,
           fetched_at::text AS fetched_at,
           last_candle_date::text AS last_candle_date,
           source,
           range_years,
           payload
    FROM chart_data
    WHERE symbol = ${symbol}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function upsertChartRow(row: {
  symbol: string;
  fetched_at: string;
  last_candle_date: string;
  source: string;
  range_years: number;
  payload: ChartPayload;
}): Promise<void> {
  await sql`
    INSERT INTO chart_data (symbol, fetched_at, last_candle_date, source, range_years, payload)
    VALUES (
      ${row.symbol},
      ${row.fetched_at}::timestamptz,
      ${row.last_candle_date}::date,
      ${row.source},
      ${row.range_years},
      ${sql.json(row.payload as never)}
    )
    ON CONFLICT (symbol) DO UPDATE
      SET fetched_at       = EXCLUDED.fetched_at,
          last_candle_date = EXCLUDED.last_candle_date,
          source           = EXCLUDED.source,
          range_years      = EXCLUDED.range_years,
          payload          = EXCLUDED.payload
  `;
}
