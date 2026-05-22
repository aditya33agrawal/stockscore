import * as fs from "fs/promises";
import * as path from "path";
import { login } from "./scraper/auth";
import { findCompanyUrl } from "./scraper/search";
import { parseCompanyPage } from "./scraper/parser";
import {
  fetchAnnouncements,
  // fetchAllChartData,
  fetchQuickRatios,
  fetchPeersCsv,
} from "./scraper/api";
import { scoreCompany } from "./scorer";
import type { SectorData, Company } from "./types";
import type { RawCompanyData } from "./scraper/types";
import sql, { ensureTables } from "./db";

type Log = (msg: string) => void;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

interface SectorConfig {
  slug: string;
  name: string;
  description: string;
  analyst_note?: string;
  companies: string[];
}

async function loadConfig(): Promise<{ sectors: SectorConfig[] }> {
  const configPath = path.join(process.cwd(), "sectors_config.json");
  const raw = await fs.readFile(configPath, "utf-8");
  return JSON.parse(raw);
}

function computeSectorStats(companies: Company[]) {
  const median = (arr: number[]) => {
    const s = [...arr].filter((n) => n > 0).sort((a, b) => a - b);
    if (!s.length) return undefined;
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  };
  return {
    median_pe: median(companies.map((c) => c.raw.pe ?? 0)),
    median_roce: median(companies.map((c) => c.raw.roce ?? 0)),
    median_opm: median(companies.map((c) => c.raw.opm ?? 0)),
    median_de: median(companies.map((c) => c.raw.debt_to_equity ?? 0)),
    median_dividend_yield: median(companies.map((c) => c.raw.dividend_yield ?? 0)),
  };
}

async function scrapeCompany(
  session: { cookies: string; csrfToken: string },
  companyName: string,
  log: Log
): Promise<{ rawData: RawCompanyData; url: string; symbol: string } | null> {
  const url = await findCompanyUrl(session, companyName);
  if (!url) {
    log(`  [company] ${companyName} — not found, skipping`);
    return null;
  }
  log(`  [company] ${companyName} → ${url}`);

  await sleep(2000);
  const pageRes = await fetch(url, {
    headers: { Cookie: session.cookies, "User-Agent": UA },
  });
  if (!pageRes.ok) {
    log(`  [company] ${companyName} — page fetch failed ${pageRes.status}`);
    return null;
  }
  const html = await pageRes.text();

  const urlParts = url.split("/").filter(Boolean);
  const symbol = urlParts[urlParts.length - 2] ?? companyName;

  const rawData = parseCompanyPage(html, symbol);
  log(`  [company] ${companyName} — parsed HTML`);

  if (rawData.warehouseId) {
    await sleep(2000);
    const quickRatios = await fetchQuickRatios(session, rawData.warehouseId, url, rawData.consolidated);
    Object.assign(rawData.ratios, quickRatios);

    await sleep(2000);
    const peersCsv = await fetchPeersCsv(session, rawData.warehouseId, url, rawData.consolidated);
    if (peersCsv) rawData.peers = peersCsv;
    log(`  [company] ${companyName} — fetched quick ratios + peers`);
  }

  if (rawData.companyId) {
    await sleep(2000);
    rawData.announcementsImportant = await fetchAnnouncements(session, rawData.companyId, "important");
    await sleep(2000);
    rawData.announcementsRecent = await fetchAnnouncements(session, rawData.companyId, "recent");
    log(`  [company] ${companyName} — fetched announcements`);
  }

  return { rawData, url, symbol };
}

function buildCompanyData(
  rawData: RawCompanyData,
  score: Omit<Company, "rank"> & { rank: number },
  refreshedAt: string
) {
  return {
    name: rawData.name,
    symbol: rawData.symbol,
    current_price: rawData.currentPrice,
    refreshed_at: refreshedAt,
    ratios: rawData.ratios,
    about: rawData.about,
    key_points: rawData.keyPoints,
    pros_cons: rawData.prosCons,
    growth_tables: rawData.growthTables,
    financial_tables: {
      quarters: rawData.quarters,
      profit_loss: rawData.profitLoss,
      balance_sheet: rawData.balanceSheet,
      cash_flow: rawData.cashFlow,
      ratios: rawData.ratiosTable,
      shareholding: rawData.shareholding,
      peers: rawData.peers,
    },
    chart_data: rawData.chartData,
    documents: rawData.documents,
    announcements: {
      important: rawData.announcementsImportant,
      recent: rawData.announcementsRecent,
    },
    score,
  };
}

async function upsertCompanyDb(
  rawData: RawCompanyData,
  score: Omit<Company, "rank"> & { rank: number },
  sectorSlug: string,
  refreshedAt: string
): Promise<void> {
  const data = buildCompanyData(rawData, score, refreshedAt);
  await sql`
    INSERT INTO companies (symbol, name, sector_slug, refreshed_at, data)
    VALUES (${rawData.symbol}, ${rawData.name}, ${sectorSlug}, ${refreshedAt}::timestamptz, ${sql.json(data as never)})
    ON CONFLICT (symbol) DO UPDATE
      SET name         = EXCLUDED.name,
          sector_slug  = EXCLUDED.sector_slug,
          refreshed_at = EXCLUDED.refreshed_at,
          data         = EXCLUDED.data
  `;
}

async function upsertSectorDb(sectorData: SectorData, topCompany: Company | undefined): Promise<void> {
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
}

export async function runPipeline(log: Log, targetSectorSlug?: string): Promise<void> {
  log("[pipeline] Loading config …");
  const config = await loadConfig();

  log("[pipeline] Ensuring DB tables …");
  await ensureTables();
  log("[pipeline] DB ready ✓");

  const sectorsToRun = targetSectorSlug
    ? config.sectors.filter((s) => s.slug === targetSectorSlug)
    : config.sectors;

  if (targetSectorSlug && sectorsToRun.length === 0) {
    throw new Error(`Sector "${targetSectorSlug}" not found in sectors_config.json`);
  }

  const email = process.env.SCREENER_EMAIL;
  const password = process.env.SCREENER_PASSWORD;
  if (!email || !password) {
    throw new Error("SCREENER_EMAIL and SCREENER_PASSWORD must be set in .env.local");
  }

  log("[pipeline] Logging in to screener.in …");
  const session = await login(email, password);
  log("[pipeline] Authenticated ✓");

  for (const sector of sectorsToRun) {
    const scored: Company[] = [];
    const rawDataMap: Map<string, RawCompanyData> = new Map();

    log(`\n[sector] ${sector.name} (${sector.companies.length} companies)`);

    for (const companyName of sector.companies) {
      log(`  [company] ${companyName} — searching …`);
      try {
        const result = await scrapeCompany(session, companyName, log);
        if (!result) continue;

        const { rawData } = result;
        rawDataMap.set(rawData.symbol, rawData);

        const scoreResult = scoreCompany(rawData);
        const company: Company = { ...scoreResult, rank: 0 };
        scored.push(company);
        log(`  [company] ${companyName} — score: ${scoreResult.final_score}/100 (${scoreResult.classification})`);
      } catch (err) {
        log(`  [company] ${companyName} — ERROR: ${String(err)}`);
      }
      await sleep(2000);
    }

    scored.sort((a, b) => b.final_score - a.final_score);
    scored.forEach((c, i) => (c.rank = i + 1));

    const refreshedAt = new Date().toISOString();

    for (const company of scored) {
      const rawData = rawDataMap.get(company.ticker);
      if (rawData) {
        try {
          await upsertCompanyDb(rawData, company, sector.slug, refreshedAt);
          log(`  [company] ${company.ticker} — saved to DB`);
        } catch (err) {
          log(`  [company] ${company.ticker} — DB write failed: ${String(err)}`);
        }
      }
    }

    const sectorStats = computeSectorStats(scored);
    const topCompany = scored[0];

    const sectorData: SectorData = {
      slug: sector.slug,
      name: sector.name,
      refreshed_at: refreshedAt,
      companies_count: scored.length,
      description: sector.description,
      analyst_note: sector.analyst_note,
      sector_stats: sectorStats,
      companies: scored,
    };

    try {
      await upsertSectorDb(sectorData, topCompany);
      log(`[sector] ${sector.name} — saved to DB`);
    } catch (err) {
      log(`[sector] ${sector.name} — DB write failed: ${String(err)}`);
    }
  }

  log(`\n[pipeline] Done ✓`);
}
