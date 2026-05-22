import { type NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import sql, { ensureTables } from "@/lib/db";
import type { SectorData, SectorIndexEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

const DATA_DIR = path.join(process.cwd(), "public", "data");

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const providedPassword: string = body?.password ?? "";
  const expectedPassword = process.env.REFRESH_PASSWORD;

  if (expectedPassword && providedPassword !== expectedPassword) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const results: string[] = [];
  const log = (msg: string) => results.push(msg);

  try {
    log("Creating tables…");
    await ensureTables();
    log("Tables ready ✓");

    // Backfill top_ticker from companies JSONB for any rows missing it
    const backfilled = await sql`
      UPDATE sectors
      SET top_ticker = companies->0->>'ticker'
      WHERE top_ticker IS NULL AND companies IS NOT NULL AND jsonb_array_length(companies) > 0
    `;
    log(`Backfilled top_ticker for ${backfilled.count} sector(s) ✓`);

    // Seed sectors from JSON files
    const sectorsDir = path.join(DATA_DIR, "sectors");
    let sectorFiles: string[] = [];
    try {
      sectorFiles = (await fs.readdir(sectorsDir)).filter((f) => f.endsWith(".json"));
    } catch {
      log("No sectors directory found, skipping sector seed");
    }

    for (const file of sectorFiles) {
      const slug = file.replace(".json", "");
      try {
        const raw = await fs.readFile(path.join(sectorsDir, file), "utf-8");
        const sectorData = JSON.parse(raw) as SectorData;
        const topCompany = sectorData.companies?.[0];

        await sql`
          INSERT INTO sectors (slug, name, refreshed_at, companies_count, description, analyst_note, sector_stats, companies, top_company, top_ticker, top_score)
          VALUES (
            ${sectorData.slug},
            ${sectorData.name},
            ${sectorData.refreshed_at}::timestamptz,
            ${sectorData.companies_count},
            ${sectorData.description},
            ${sectorData.analyst_note ?? null},
            ${sql.json(sectorData.sector_stats as never)},
            ${sql.json(sectorData.companies as never)},
            ${topCompany?.name ?? null},
            ${topCompany?.ticker ?? null},
            ${topCompany?.final_score ?? null}
          )
          ON CONFLICT (slug) DO UPDATE
            SET name            = EXCLUDED.name,
                refreshed_at    = EXCLUDED.refreshed_at,
                companies_count = EXCLUDED.companies_count,
                description     = EXCLUDED.description,
                analyst_note    = EXCLUDED.analyst_note,
                sector_stats    = EXCLUDED.sector_stats,
                companies       = EXCLUDED.companies,
                top_company     = EXCLUDED.top_company,
                top_ticker      = EXCLUDED.top_ticker,
                top_score       = EXCLUDED.top_score
        `;
        log(`Seeded sector: ${slug} (${sectorData.companies_count} companies)`);
      } catch (err) {
        log(`Failed sector ${slug}: ${String(err)}`);
      }
    }

    // Seed companies from JSON files
    const companiesDir = path.join(DATA_DIR, "companies");
    let companyFiles: string[] = [];
    try {
      companyFiles = (await fs.readdir(companiesDir)).filter((f) => f.endsWith(".json"));
    } catch {
      log("No companies directory found, skipping company seed");
    }

    // Build symbol→sector_slug map from sector data
    const symbolToSector: Record<string, string> = {};
    for (const file of sectorFiles) {
      try {
        const raw = await fs.readFile(path.join(sectorsDir, file), "utf-8");
        const sectorData = JSON.parse(raw) as SectorData;
        for (const co of sectorData.companies ?? []) {
          symbolToSector[co.ticker] = sectorData.slug;
        }
      } catch {
        // ignore
      }
    }

    let seededCompanies = 0;
    for (const file of companyFiles) {
      const symbol = file.replace(".json", "");
      try {
        const raw = await fs.readFile(path.join(companiesDir, file), "utf-8");
        const data = JSON.parse(raw);
        const name: string = data.name ?? symbol;
        const refreshedAt: string = data.refreshed_at ?? new Date().toISOString();
        const sectorSlug: string | null = symbolToSector[symbol] ?? null;

        await sql`
          INSERT INTO companies (symbol, name, sector_slug, refreshed_at, data)
          VALUES (${symbol}, ${name}, ${sectorSlug}, ${refreshedAt}::timestamptz, ${sql.json(data as never)})
          ON CONFLICT (symbol) DO UPDATE
            SET name         = EXCLUDED.name,
                sector_slug  = EXCLUDED.sector_slug,
                refreshed_at = EXCLUDED.refreshed_at,
                data         = EXCLUDED.data
        `;
        seededCompanies++;
      } catch (err) {
        log(`Failed company ${symbol}: ${String(err)}`);
      }
    }
    log(`Seeded ${seededCompanies} companies ✓`);

    return NextResponse.json({ ok: true, log: results });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err), log: results }, { status: 500 });
  }
}
