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

  // Watchlist (formerly "bookmarks" — rebranded). Rename the legacy table in
  // place so existing saved rows carry over. Guarded so it is a no-op on a
  // fresh DB, an already-migrated DB, or the (unexpected) both-exist edge.
  await sql`
    DO $$ BEGIN
      IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'bookmarks')
         AND NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'watchlist') THEN
        ALTER TABLE bookmarks RENAME TO watchlist;
      END IF;
    END $$;
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS watchlist (
      user_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      sector_slug    TEXT NOT NULL,
      company_slug   TEXT NOT NULL,
      company_ticker TEXT,
      company_name   TEXT,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, sector_slug, company_slug)
    )
  `;
  // Score snapshot columns (added in watchlist-score-tracking feature)
  await sql`ALTER TABLE watchlist ADD COLUMN IF NOT EXISTS score_snapshot    JSONB`;
  await sql`ALTER TABLE watchlist ADD COLUMN IF NOT EXISTS snapshot_taken_at TIMESTAMPTZ`;
  await sql`ALTER TABLE watchlist ADD COLUMN IF NOT EXISTS is_backfilled     BOOLEAN NOT NULL DEFAULT false`;

  // Feedback / contact form submissions
  await sql`
    CREATE TABLE IF NOT EXISTS feedback (
      id          BIGSERIAL PRIMARY KEY,
      type        TEXT NOT NULL,
      message     TEXT NOT NULL,
      email       TEXT,
      -- request context
      ip          TEXT,
      user_agent  TEXT,
      referer     TEXT,
      request_id  TEXT,
      country     TEXT,
      -- session context (null for anonymous submitters)
      user_id     BIGINT REFERENCES users(id) ON DELETE SET NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS ip          TEXT`;
  await sql`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS user_agent  TEXT`;
  await sql`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS referer     TEXT`;
  await sql`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS request_id  TEXT`;
  await sql`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS country     TEXT`;
  await sql`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS user_id     BIGINT REFERENCES users(id) ON DELETE SET NULL`;

  // Admin refresh audit log
  await sql`
    CREATE TABLE IF NOT EXISTS refresh_runs (
      id           BIGSERIAL PRIMARY KEY,
      started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      finished_at  TIMESTAMPTZ,
      requested_by TEXT,
      request      JSONB NOT NULL,
      summary      JSONB,
      ok           BOOLEAN
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS refresh_errors (
      id        BIGSERIAL PRIMARY KEY,
      run_id    BIGINT REFERENCES refresh_runs(id) ON DELETE CASCADE,
      ts        TIMESTAMPTZ NOT NULL DEFAULT now(),
      phase     TEXT NOT NULL,
      scope     TEXT,
      item      TEXT,
      reason    TEXT,
      message   TEXT NOT NULL,
      stack     TEXT
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS refresh_errors_run_idx ON refresh_errors(run_id)`;

  // Asset allocation history - saved computations per user
  await sql`
    CREATE TABLE IF NOT EXISTS allocation_history (
      id          BIGSERIAL PRIMARY KEY,
      user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mode        TEXT NOT NULL,
      input       JSONB NOT NULL,
      result      JSONB NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS allocation_history_user_idx ON allocation_history(user_id, created_at DESC)`;
}
