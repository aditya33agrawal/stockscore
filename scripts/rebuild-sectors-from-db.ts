import { config } from "dotenv";
config({ path: ".env.local" });

import * as fs from "fs/promises";
import * as path from "path";

// ---------------------------------------------------------------------------
// scripts/rebuild-sectors-from-db.ts
//
// Rebuilds the `sectors` table and fixes `companies.sector_slug` to match the
// cleaned sectors_config.json - WITHOUT re-scraping screener.in. Uses the
// company scores already stored in `companies.data.score`.
//
// This is the fast fix for the live "company shown in multiple sectors" bug:
//   * each company lands in exactly its one config sector
//   * stale sector rows (slugs no longer in config) are deleted
//   * sector aggregate stats / top company are recomputed
//
//   npx tsx scripts/rebuild-sectors-from-db.ts            # report only
//   npx tsx scripts/rebuild-sectors-from-db.ts --apply    # write changes
// ---------------------------------------------------------------------------

const APPLY = process.argv.includes("--apply");
const ROOT = process.cwd();

interface SectorConfig {
  slug: string;
  name: string;
  description: string;
  analyst_note?: string;
  cyclical?: boolean;
  companies: string[];
}

type Company = {
  ticker: string;
  final_score: number;
  name?: string;
  rank?: number;
  raw?: {
    pe?: number;
    roce?: number;
    opm?: number;
    debt_to_equity?: number;
    dividend_yield?: number;
  };
};

function median(arr: number[]): number | undefined {
  const s = arr.filter((n) => n > 0).sort((a, b) => a - b);
  if (!s.length) return undefined;
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function computeSectorStats(cs: Company[]) {
  return {
    median_pe: median(cs.map((c) => c.raw?.pe ?? 0)),
    median_roce: median(cs.map((c) => c.raw?.roce ?? 0)),
    median_opm: median(cs.map((c) => c.raw?.opm ?? 0)),
    median_de: median(cs.map((c) => c.raw?.debt_to_equity ?? 0)),
    median_dividend_yield: median(cs.map((c) => c.raw?.dividend_yield ?? 0)),
  };
}

async function main() {
  const { default: sql } = await import("../lib/db");

  const cfg = JSON.parse(
    await fs.readFile(path.join(ROOT, "sectors_config.json"), "utf-8"),
  ) as { sectors: SectorConfig[] };

  // Pull every stored company score keyed by symbol.
  const rows = await sql<{ symbol: string; data: { score?: Company } }[]>`
    SELECT symbol, data FROM companies
  `;
  const scoreBySymbol = new Map<string, Company>();
  for (const r of rows) {
    if (r.data?.score) scoreBySymbol.set(r.symbol.toUpperCase(), r.data.score);
  }

  const configSlugs = new Set(cfg.sectors.map((s) => s.slug));
  const missing: Array<{ sector: string; symbol: string }> = [];
  const refreshedAt = new Date().toISOString();

  const staleRows = await sql<{ slug: string }[]>`
    SELECT slug FROM sectors WHERE slug <> ALL(${[...configSlugs]})
  `;

  console.log("──────────── REBUILD SECTORS FROM DB ────────────");
  console.log(`Stored company scores: ${scoreBySymbol.size}`);
  console.log(`Config sectors: ${cfg.sectors.length}`);
  console.log(
    `Stale sector rows to delete: ${staleRows.length}${staleRows.length ? ` (${staleRows.map((s) => s.slug).join(", ")})` : ""}`,
  );

  let rebuilt = 0;
  let companiesPlaced = 0;

  for (const sec of cfg.sectors) {
    const members: Company[] = [];
    for (const rawSym of sec.companies) {
      const sym = rawSym.toUpperCase();
      const score = scoreBySymbol.get(sym);
      if (score) members.push({ ...score });
      else missing.push({ sector: sec.slug, symbol: sym });
    }
    members.sort((a, b) => b.final_score - a.final_score);
    members.forEach((c, i) => (c.rank = i + 1));
    companiesPlaced += members.length;

    if (APPLY) {
      const top = members[0];
      const stats = computeSectorStats(members);
      await sql`
        INSERT INTO sectors (slug, name, refreshed_at, companies_count, description, analyst_note, sector_stats, companies, top_company, top_ticker, top_score)
        VALUES (
          ${sec.slug}, ${sec.name}, ${refreshedAt}::timestamptz, ${members.length},
          ${sec.description}, ${sec.analyst_note ?? null},
          ${sql.json(stats as never)}, ${sql.json(members as never)},
          ${top?.name ?? null}, ${top?.ticker ?? null}, ${top?.final_score ?? null}
        )
        ON CONFLICT (slug) DO UPDATE SET
          name=EXCLUDED.name, refreshed_at=EXCLUDED.refreshed_at,
          companies_count=EXCLUDED.companies_count, description=EXCLUDED.description,
          analyst_note=EXCLUDED.analyst_note, sector_stats=EXCLUDED.sector_stats,
          companies=EXCLUDED.companies, top_company=EXCLUDED.top_company,
          top_ticker=EXCLUDED.top_ticker, top_score=EXCLUDED.top_score
      `;
      // fix sector_slug on the company rows that exist
      const present = members.map((c) => c.ticker);
      if (present.length) {
        await sql`UPDATE companies SET sector_slug=${sec.slug} WHERE symbol = ANY(${present})`;
      }
    }
    rebuilt++;
  }

  if (APPLY && staleRows.length) {
    await sql`DELETE FROM sectors WHERE slug <> ALL(${[...configSlugs]})`;
  }

  console.log(
    `\n${APPLY ? "✅ Rebuilt" : "Would rebuild"} ${rebuilt} sectors, placing ${companiesPlaced} company rows.`,
  );
  if (missing.length) {
    console.log(
      `\n⚠️  ${missing.length} config companies have no stored score yet (will populate on next refresh):`,
    );
    const bySec = new Map<string, string[]>();
    for (const m of missing) {
      const a = bySec.get(m.sector) ?? [];
      a.push(m.symbol);
      bySec.set(m.sector, a);
    }
    for (const [s, syms] of bySec) console.log(`   ${s}: ${syms.join(", ")}`);
  }
  if (!APPLY) console.log("\nDry run - re-run with --apply to write.");

  await sql.end();
}

main().catch((err) => {
  console.error("rebuild-sectors-from-db crashed:", err);
  process.exit(1);
});
