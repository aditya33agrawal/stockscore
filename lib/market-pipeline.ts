import { login } from "./scraper/auth";
import { fetchMarketPage } from "./sector-scraper/fetch";
import { parseMarketPage } from "./sector-scraper/parser";
import sql, { ensureTables } from "./db";

type Log = (msg: string) => void;

const FRESH_DAYS = 7;
const FRESH_MS = FRESH_DAYS * 24 * 60 * 60 * 1000;

export async function runMarketPipeline(
  log: Log,
  force = false,
): Promise<void> {
  log("[market-pipeline] Ensuring DB tables …");
  await ensureTables();

  if (!force) {
    const meta = await sql<{ last_full_refresh: string | null }[]>`
      SELECT last_full_refresh FROM market_sectors_meta WHERE id = 1
    `;
    const lastRefresh = meta[0]?.last_full_refresh;
    if (lastRefresh) {
      const age = Date.now() - new Date(lastRefresh).getTime();
      if (age < FRESH_MS) {
        const days = (age / (24 * 3600 * 1000)).toFixed(1);
        log(
          `[market-pipeline] Data is ${days}d old (< 7d). Use --force to override.`,
        );
        return;
      }
    }
  }

  const email = process.env.SCREENER_EMAIL;
  const password = process.env.SCREENER_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "SCREENER_EMAIL and SCREENER_PASSWORD must be set in .env.local",
    );
  }

  log("[market-pipeline] Logging in to screener.in …");
  const session = await login(email, password);
  log("[market-pipeline] Authenticated ✓");

  log("[market-pipeline] Fetching market overview page …");
  const html = await fetchMarketPage(session);
  log("[market-pipeline] Page fetched ✓");

  log("[market-pipeline] Parsing sector rows …");
  const rows = parseMarketPage(html);
  log(`[market-pipeline] Parsed ${rows.length} sector rows`);

  if (rows.length === 0) {
    throw new Error(
      "Parser returned 0 rows - check if the page structure changed",
    );
  }

  const refreshedAt = new Date().toISOString();

  await sql.begin(async (tx) => {
    for (const row of rows) {
      await tx`
        INSERT INTO market_sectors (slug, name, refreshed_at, metrics)
        VALUES (${row.slug}, ${row.name}, ${refreshedAt}::timestamptz, ${tx.json(row as never)})
        ON CONFLICT (slug) DO UPDATE
          SET name         = EXCLUDED.name,
              refreshed_at = EXCLUDED.refreshed_at,
              metrics      = EXCLUDED.metrics
      `;
    }

    await tx`
      INSERT INTO market_sectors_meta (id, last_full_refresh)
      VALUES (1, ${refreshedAt}::timestamptz)
      ON CONFLICT (id) DO UPDATE SET last_full_refresh = EXCLUDED.last_full_refresh
    `;
  });

  log(`[market-pipeline] Saved ${rows.length} rows to DB ✓`);
  log("[market-pipeline] Done ✓");
}
