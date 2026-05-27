import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var _pgClient: ReturnType<typeof postgres> | undefined;
}

function createClient() {
  const connStr = process.env.DB_CONNECTION_STRING;
  if (!connStr) throw new Error("DB_CONNECTION_STRING is not set");
  return postgres(connStr, {
    ssl: "require",
    max: 5,
    idle_timeout: 30,
    max_lifetime: 1800,
    connect_timeout: 15,
    prepare: false,
  });
}

// Reuse across hot-reloads in dev
const sql = globalThis._pgClient ?? createClient();
if (process.env.NODE_ENV !== "production") globalThis._pgClient = sql;

export default sql;

export async function ensureTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS companies (
      symbol      TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      sector_slug TEXT,
      refreshed_at TIMESTAMPTZ,
      data        JSONB NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sectors (
      slug            TEXT PRIMARY KEY,
      name            TEXT NOT NULL,
      refreshed_at    TIMESTAMPTZ,
      companies_count INT,
      description     TEXT,
      analyst_note    TEXT,
      sector_stats    JSONB,
      companies       JSONB,
      top_company     TEXT,
      top_ticker      TEXT,
      top_score       NUMERIC
    )
  `;
  await sql`ALTER TABLE sectors ADD COLUMN IF NOT EXISTS top_ticker TEXT`;

  await sql`
    CREATE TABLE IF NOT EXISTS market_sectors (
      slug          TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      refreshed_at  TIMESTAMPTZ NOT NULL,
      metrics       JSONB NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS market_sectors_meta (
      id                  INT PRIMARY KEY DEFAULT 1,
      last_full_refresh   TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS chart_data (
      symbol            TEXT PRIMARY KEY,
      fetched_at        TIMESTAMPTZ NOT NULL,
      last_candle_date  DATE NOT NULL,
      source            TEXT NOT NULL,
      range_years       INT NOT NULL DEFAULT 10,
      payload           JSONB NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sector_config (
      slug         TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      description  TEXT,
      analyst_note TEXT,
      cyclical     BOOLEAN NOT NULL DEFAULT false,
      companies    JSONB NOT NULL,
      synced_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}
