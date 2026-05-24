import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type { SectorData, SectorIndexEntry } from "./types";
import type { CompanyDetail } from "./company-data";
import sql from "./db";

function withTimeout<T>(promise: Promise<T>, ms = 10000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("DB query timed out")), ms)
    ),
  ]);
}

export { scoreColor, scoreBg, pointsColor, formatDate } from "./format";

export async function loadSectorIndex(): Promise<SectorIndexEntry[]> {
  try {
    const rows = await withTimeout(
      sql<
        {
          slug: string;
          name: string;
          companies_count: number;
          refreshed_at: string;
          description: string;
          top_company: string | null;
          top_ticker: string | null;
          top_score: number | null;
        }[]
      >`
        SELECT slug, name, companies_count, refreshed_at, description, top_company, top_ticker, top_score
        FROM sectors
        ORDER BY name
      `
    );
    return rows.map((r) => ({
      slug: r.slug,
      name: r.name,
      companies_count: r.companies_count,
      refreshed_at: r.refreshed_at,
      description: r.description,
      top_company: r.top_company ?? undefined,
      top_ticker: r.top_ticker ?? undefined,
      top_score: r.top_score != null ? Number(r.top_score) : undefined,
    }));
  } catch (err) {
    console.error("[data] loadSectorIndex failed:", err);
    return [];
  }
}

export interface SectorConfigEntry {
  slug: string;
  name: string;
  description: string;
  analyst_note?: string;
  companies: string[];
}

export async function loadSectorsConfig(): Promise<SectorConfigEntry[]> {
  const raw = await fs.readFile(
    path.join(process.cwd(), "sectors_config.json"),
    "utf8"
  );
  const config = JSON.parse(raw) as { sectors: SectorConfigEntry[] };
  return config.sectors;
}

export async function loadSector(slug: string): Promise<SectorData | null> {
  const rows = await withTimeout(
    sql<
      {
        slug: string;
        name: string;
        refreshed_at: string;
        companies_count: number;
        description: string;
        analyst_note: string | null;
        sector_stats: unknown;
        companies: unknown;
      }[]
    >`
      SELECT slug, name, refreshed_at, companies_count, description, analyst_note, sector_stats, companies
      FROM sectors
      WHERE slug = ${slug}
      LIMIT 1
    `
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    slug: r.slug,
    name: r.name,
    refreshed_at: r.refreshed_at,
    companies_count: r.companies_count,
    description: r.description,
    analyst_note: r.analyst_note ?? undefined,
    sector_stats: r.sector_stats as SectorData["sector_stats"],
    companies: r.companies as SectorData["companies"],
  };
}

export interface CompanyIndexEntry {
  name: string;
  ticker: string;
  slug: string;
  sector_slug: string;
  sector_name: string;
  final_score: number;
}

export async function loadCompaniesIndex(): Promise<CompanyIndexEntry[]> {
  try {
    const rows = await withTimeout(
      sql<{ slug: string; name: string; companies: unknown }[]>`
        SELECT slug, name, companies FROM sectors
      `
    );
    const out: CompanyIndexEntry[] = [];
    for (const r of rows) {
      const cos = (r.companies as { slug: string; name: string; ticker: string; final_score: number }[]) ?? [];
      for (const c of cos) {
        out.push({
          name: c.name,
          ticker: c.ticker,
          slug: c.slug,
          sector_slug: r.slug,
          sector_name: r.name,
          final_score: c.final_score,
        });
      }
    }
    return out;
  } catch (err) {
    console.error("[data] loadCompaniesIndex failed:", err);
    return [];
  }
}

export async function allSectorSlugs(): Promise<string[]> {
  const idx = await loadSectorIndex();
  return idx.map((s) => s.slug);
}

export async function loadCompanyDetail(
  symbol: string
): Promise<CompanyDetail | null> {
  const rows = await withTimeout(
    sql<{ data: unknown }[]>`
      SELECT data FROM companies WHERE symbol = ${symbol} LIMIT 1
    `
  );
  if (rows.length === 0) return null;
  return rows[0].data as CompanyDetail;
}
