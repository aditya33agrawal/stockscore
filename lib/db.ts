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

  // Auth: users
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id            BIGSERIAL PRIMARY KEY,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name          TEXT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  // Auth: sessions (opaque token in httpOnly cookie)
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      token       TEXT PRIMARY KEY,
      user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at  TIMESTAMPTZ NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id)`;

  // Bookmarks
  await sql`
    CREATE TABLE IF NOT EXISTS bookmarks (
      user_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      sector_slug    TEXT NOT NULL,
      company_slug   TEXT NOT NULL,
      company_ticker TEXT,
      company_name   TEXT,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, sector_slug, company_slug)
    )
  `;
  // Score snapshot columns (added in bookmark-score-tracking feature)
  await sql`ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS score_snapshot    JSONB`;
  await sql`ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS snapshot_taken_at TIMESTAMPTZ`;
  await sql`ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS is_backfilled     BOOLEAN NOT NULL DEFAULT false`;

  // Feedback / contact form submissions
  await sql`
    CREATE TABLE IF NOT EXISTS feedback (
      id          BIGSERIAL PRIMARY KEY,
      type        TEXT NOT NULL,
      message     TEXT NOT NULL,
      email       TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}
