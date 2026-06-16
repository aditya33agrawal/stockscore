import { config } from "dotenv";
config({ path: ".env.local" });

import * as fs from "fs/promises";
import * as path from "path";

// ---------------------------------------------------------------------------
// scripts/reconcile-db.ts  -  makes the DB agree with sectors_config.json.
//
// Checks / fixes (dry-run by default; pass --apply to mutate):
//   1. Orphan company rows  : companies whose symbol isn't in any config sector,
//                             or whose sector_slug != its config sector.
//   2. Sector-array dedupe  : no symbol may appear in two sectors' JSONB arrays.
//   3. Cross-table agreement: every companies.sector_slug == the sector whose
//                             JSONB array contains it.
//
//   npx tsx scripts/reconcile-db.ts            # report only
//   npx tsx scripts/reconcile-db.ts --apply    # delete orphans / fix sector_slug
// ---------------------------------------------------------------------------

const APPLY = process.argv.includes("--apply");
const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, "sectors_config.json");

interface SectorConfig {
  slug: string;
  companies: string[];
}

async function main() {
  const { default: sql } = await import("../lib/db");

  const cfg = JSON.parse(await fs.readFile(CONFIG_PATH, "utf-8")) as {
    sectors: SectorConfig[];
  };

  // symbol -> the ONE sector slug it belongs to (per config)
  const symbolToSector = new Map<string, string>();
  for (const s of cfg.sectors) {
    for (const c of s.companies) symbolToSector.set(c.toUpperCase(), s.slug);
  }

  let problems = 0;

  // --- 1) companies table: orphans + wrong sector_slug -----------------------
  const compRows = await sql<{ symbol: string; sector_slug: string | null }[]>`
    SELECT symbol, sector_slug FROM companies
  `;

  const orphans: string[] = [];
  const misfiled: Array<{ symbol: string; from: string | null; to: string }> =
    [];
  for (const row of compRows) {
    const sym = row.symbol.toUpperCase();
    const want = symbolToSector.get(sym);
    if (!want) {
      orphans.push(row.symbol);
    } else if (row.sector_slug !== want) {
      misfiled.push({ symbol: row.symbol, from: row.sector_slug, to: want });
    }
  }

  console.log("──────────── RECONCILE DB ────────────");
  console.log(`companies rows: ${compRows.length}`);
  console.log(`  orphans (not in any config sector): ${orphans.length}`);
  console.log(`  wrong sector_slug:                  ${misfiled.length}`);
  problems += orphans.length + misfiled.length;

  if (orphans.length) console.log(`   orphans: ${orphans.join(", ")}`);
  for (const m of misfiled)
    console.log(`   misfiled: ${m.symbol}  ${m.from} -> ${m.to}`);

  // --- 2) sectors table: a symbol appearing in two sector arrays -------------
  const secRows = await sql<{ slug: string; companies: unknown }[]>`
    SELECT slug, companies FROM sectors
  `;
  const symbolInSectorArrays = new Map<string, string[]>();
  for (const row of secRows) {
    const arr = Array.isArray(row.companies) ? row.companies : [];
    for (const c of arr as Array<{ ticker?: string }>) {
      const t = (c.ticker ?? "").toUpperCase();
      if (!t) continue;
      const list = symbolInSectorArrays.get(t) ?? [];
      list.push(row.slug);
      symbolInSectorArrays.set(t, list);
    }
  }
  const arrayDups = [...symbolInSectorArrays.entries()].filter(
    ([, s]) => s.length > 1,
  );
  const arrayMisfiled = [...symbolInSectorArrays.entries()].filter(
    ([sym, slugs]) => {
      const want = symbolToSector.get(sym);
      return want && slugs.length === 1 && slugs[0] !== want;
    },
  );
  console.log(`\nsectors rows: ${secRows.length}`);
  console.log(`  symbols embedded in >1 sector array: ${arrayDups.length}`);
  for (const [sym, slugs] of arrayDups)
    console.log(`   ${sym}: ${slugs.join(", ")}`);
  console.log(`  symbols in the wrong sector array:   ${arrayMisfiled.length}`);
  for (const [sym, slugs] of arrayMisfiled)
    console.log(`   ${sym}: in ${slugs[0]}, want ${symbolToSector.get(sym)}`);
  problems += arrayDups.length + arrayMisfiled.length;

  // --- apply fixes -----------------------------------------------------------
  if (APPLY) {
    if (orphans.length) {
      await sql`DELETE FROM companies WHERE symbol = ANY(${orphans})`;
      console.log(`\n🗑️  Deleted ${orphans.length} orphan company rows.`);
    }
    for (const m of misfiled) {
      await sql`UPDATE companies SET sector_slug = ${m.to} WHERE symbol = ${m.symbol}`;
    }
    if (misfiled.length)
      console.log(`🔧 Fixed sector_slug on ${misfiled.length} rows.`);
    if (arrayDups.length || arrayMisfiled.length) {
      console.log(
        "\n⚠️  Sector JSONB arrays still contain stale/duplicate companies. " +
          "Run `npm run refresh:sector` (or refresh:all:force) to rebuild them from the clean config.",
      );
    }
  } else {
    console.log(
      `\n${problems === 0 ? "✅ Clean - nothing to reconcile." : `Found ${problems} issue(s). Re-run with --apply to fix companies-table issues.`}`,
    );
    if (arrayDups.length || arrayMisfiled.length) {
      console.log(
        "Note: sector-array issues are fixed by re-running the pipeline (refresh:sector), not by --apply.",
      );
    }
  }

  await sql.end();
}

main().catch((err) => {
  console.error("reconcile-db crashed:", err);
  process.exit(1);
});
