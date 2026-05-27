import * as fs from "fs/promises";
import * as path from "path";
import sql, { ensureTables } from "./db";

type Log = (msg: string) => void;

const FRESH_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface SectorConfigEntry {
  slug: string;
  name: string;
  description: string;
  analyst_note?: string;
  cyclical?: boolean;
  companies: string[];
}

async function loadConfigFile(): Promise<{ sectors: SectorConfigEntry[] }> {
  const configPath = path.join(process.cwd(), "sectors_config.json");
  const raw = await fs.readFile(configPath, "utf-8");
  return JSON.parse(raw);
}

export async function syncSectorsConfig(log: Log, force = false): Promise<void> {
  log("[config] Reading sectors_config.json …");
  const config = await loadConfigFile();

  log("[config] Ensuring DB tables …");
  await ensureTables();
  log("[config] DB ready ✓");

  const sectors = config.sectors;
  log(`[config] ${sectors.length} sectors found in config file`);

  // Load all existing synced_at timestamps in one query
  const existing = await sql<{ slug: string; synced_at: string }[]>`
    SELECT slug, synced_at::text AS synced_at FROM sector_config
  `;
  const syncedMap = new Map(existing.map((r) => [r.slug, new Date(r.synced_at)]));

  const cutoff = new Date(Date.now() - FRESH_MS);
  let synced = 0;
  let skipped = 0;

  for (const sector of sectors) {
    const lastSync = syncedMap.get(sector.slug);

    if (!force && lastSync && lastSync > cutoff) {
      const ageDays = Math.floor((Date.now() - lastSync.getTime()) / (24 * 3600 * 1000));
      log(`  [sector] ${sector.name} — already fresh (${ageDays}d old), skipping`);
      skipped++;
      continue;
    }

    try {
      await sql`
        INSERT INTO sector_config (slug, name, description, analyst_note, cyclical, companies, synced_at)
        VALUES (
          ${sector.slug},
          ${sector.name},
          ${sector.description ?? null},
          ${sector.analyst_note ?? null},
          ${sector.cyclical ?? false},
          ${sql.json(sector.companies as never)},
          now()
        )
        ON CONFLICT (slug) DO UPDATE
          SET name         = EXCLUDED.name,
              description  = EXCLUDED.description,
              analyst_note = EXCLUDED.analyst_note,
              cyclical     = EXCLUDED.cyclical,
              companies    = EXCLUDED.companies,
              synced_at    = EXCLUDED.synced_at
      `;
      const action = lastSync ? "updated" : "inserted";
      log(`  [sector] ${sector.name} — ${action} (${sector.companies.length} companies) ✓`);
      synced++;
    } catch (err) {
      log(`  [sector] ${sector.name} — ERROR: ${String(err)}`);
    }
  }

  // Remove slugs that no longer exist in the config file
  const configSlugs = sectors.map((s) => s.slug);
  const dbSlugs = [...syncedMap.keys()];
  const stale = dbSlugs.filter((slug) => !configSlugs.includes(slug));
  if (stale.length > 0) {
    for (const slug of stale) {
      await sql`DELETE FROM sector_config WHERE slug = ${slug}`;
      log(`  [sector] ${slug} — removed (no longer in config)`);
    }
  }

  log(
    `\n[config] Done — ${synced} synced, ${skipped} skipped${stale.length ? `, ${stale.length} removed` : ""} ✓`
  );
}
