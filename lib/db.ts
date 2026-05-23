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
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
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
}
