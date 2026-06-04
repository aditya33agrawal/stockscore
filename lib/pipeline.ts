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

const FRESH_DAYS = 7;
const FRESH_MS = FRESH_DAYS * 24 * 60 * 60 * 1000;

async function findFreshCompany(
  companyName: string,
  sectorSlug: string,
): Promise<{ symbol: string; data: unknown; refreshed_at: string } | null> {
  try {
    const cutoff = new Date(Date.now() - FRESH_MS).toISOString();
    const rows = await sql<
      { symbol: string; data: unknown; refreshed_at: string }[]
    >`
      SELECT symbol, data, refreshed_at::text AS refreshed_at
      FROM companies
      WHERE sector_slug = ${sectorSlug}
        AND (name ILIKE ${companyName} OR symbol ILIKE ${companyName})
        AND refreshed_at > ${cutoff}::timestamptz
      LIMIT 1
    `;
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

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
  cyclical?: boolean;
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

type Defaulter = {
  sector: string;
  company: string;
  reason: "scrape_failed" | "not_found" | "error" | "missing_critical_fields";
  detail?: string;
  missing?: string[];
};

const CRITICAL_RATIO_KEYS: Array<[string, string[]]> = [
  ["pe", ["Stock P/E", "P/E"]],
  ["roe", ["ROE"]],
  ["roce", ["ROCE"]],
  ["currentRatio", ["Current Ratio"]],
];

function hasNumeric(v: string | undefined | null): boolean {
  if (v == null) return false;
  const s = String(v).replace(/[,%₹\s]/g, "");
  if (!s || s === "-" || s.toLowerCase() === "nan") return false;
  const n = parseFloat(s);
  return Number.isFinite(n);
}

function checkMissingFields(raw: RawCompanyData): string[] {
  const missing: string[] = [];
  const ratios = (raw.ratios ?? {}) as Record<string, string>;
  for (const [label, keys] of CRITICAL_RATIO_KEYS) {
    const present = keys.some((k) => hasNumeric(ratios[k]));
    if (!present) missing.push(label);
  }
  // Promoter holding lives in the shareholding CSV — flag if missing entirely
  if (!raw.shareholding || raw.shareholding.length < 20) {
    missing.push("promoterHolding");
  }
  return missing;
}

async function writeDefaultersLog(defaulters: Defaulter[], totalCompanies: number): Promise<string | null> {
  if (defaulters.length === 0) return null;
  try {
    const dir = path.join(process.cwd(), "logs");
    await fs.mkdir(dir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const file = path.join(dir, `refresh-defaulters-${ts}.json`);
    await fs.writeFile(file, JSON.stringify({
      generated_at: new Date().toISOString(),
      total_companies: totalCompanies,
      defaulter_count: defaulters.length,
      defaulters,
    }, null, 2));
    return file;
  } catch {
    return null;
  }
}

function printDefaultersReport(log: Log, defaulters: Defaulter[], totalCompanies: number, logFile: string | null): void {
  log("");
  log("────────────────────────────────────────────────────");
  log("DEFAULTERS REPORT");
  log("────────────────────────────────────────────────────");
  if (defaulters.length === 0) {
    log("✓ No defaulters — every company scraped and parsed cleanly.");
    return;
  }
  const bySector = new Map<string, Defaulter[]>();
  for (const d of defaulters) {
    const arr = bySector.get(d.sector) ?? [];
    arr.push(d);
    bySector.set(d.sector, arr);
  }
  for (const [sectorName, arr] of bySector) {
    log(`Sector: ${sectorName}`);
    for (const d of arr) {
      if (d.reason === "missing_critical_fields") {
        log(`  ✗ ${d.company.padEnd(28)} missing: ${(d.missing ?? []).join(", ")}`);
      } else if (d.reason === "not_found") {
        log(`  ✗ ${d.company.padEnd(28)} not found on Screener`);
      } else if (d.reason === "scrape_failed") {
        log(`  ✗ ${d.company.padEnd(28)} scrape failed${d.detail ? ` (${d.detail})` : ""}`);
      } else {
        log(`  ✗ ${d.company.padEnd(28)} error${d.detail ? `: ${d.detail}` : ""}`);
      }
    }
  }
  const pct = totalCompanies > 0 ? ((defaulters.length / totalCompanies) * 100).toFixed(1) : "0.0";
  log("────────────────────────────────────────────────────");
  log(`Total defaulters: ${defaulters.length} of ${totalCompanies} (${pct}%)`);
  if (logFile) log(`Log: ${logFile}`);
}

export async function runPipeline(log: Log, targetSectorSlug?: string, force = false): Promise<Defaulter[]> {
  log("[pipeline] Validating config …");
  const { validateConfig } = await import("./config-validate");
  const configErrors = await validateConfig();
  if (configErrors.length > 0) {
    log(`[pipeline] ✗ Config invalid — ${configErrors.length} issue(s):`);
    for (const e of configErrors) log(`  • ${e}`);
    throw new Error(
      `sectors_config.json failed validation (${configErrors.length} issue(s)). ` +
        `Run \`npm run standardize:config\` then \`npm run validate:config\`.`,
    );
  }
  log("[pipeline] Config valid ✓");

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

  const defaulters: Defaulter[] = [];
  let totalCompanies = 0;

  for (const sector of sectorsToRun) {
    const scored: Company[] = [];
    const rawDataMap: Map<string, RawCompanyData> = new Map();
    const skippedSymbols = new Set<string>();

    log(`\n[sector] ${sector.name} (${sector.companies.length} companies)`);

    for (const companyName of sector.companies) {
      totalCompanies += 1;
      if (!force) {
        const fresh = await findFreshCompany(companyName, sector.slug);
        if (fresh) {
          const ageDays = Math.floor(
            (Date.now() - new Date(fresh.refreshed_at).getTime()) / (24 * 3600 * 1000),
          );
          const cachedScore = (fresh.data as { score?: Company })?.score;
          if (cachedScore) {
            scored.push({ ...cachedScore, rank: 0 });
            skippedSymbols.add(fresh.symbol);
            log(`  [company] ${companyName} — fresh (${ageDays}d old), skip ✓`);
            continue;
          }
        }
      }

      log(`  [company] ${companyName} — searching …`);
      try {
        const result = await scrapeCompany(session, companyName, log);
        if (!result) {
          defaulters.push({ sector: sector.name, company: companyName, reason: "not_found" });
          continue;
        }

        const { rawData } = result;
        rawDataMap.set(rawData.symbol, rawData);

        const missing = checkMissingFields(rawData);
        if (missing.length > 0) {
          defaulters.push({
            sector: sector.name,
            company: companyName,
            reason: "missing_critical_fields",
            missing,
          });
        }

        const scoreResult = scoreCompany(rawData, {
          cyclical: sector.cyclical ?? false,
          sectorSlug: sector.slug,
        });
        const company: Company = { ...scoreResult, rank: 0 };
        scored.push(company);
        log(`  [company] ${companyName} — score: ${scoreResult.final_score}/100 (${scoreResult.classification})`);
      } catch (err) {
        log(`  [company] ${companyName} — ERROR: ${String(err)}`);
        defaulters.push({
          sector: sector.name,
          company: companyName,
          reason: "error",
          detail: err instanceof Error ? err.message : String(err),
        });
      }
      await sleep(2000);
    }

    scored.sort((a, b) => b.final_score - a.final_score);
    scored.forEach((c, i) => (c.rank = i + 1));

    const refreshedAt = new Date().toISOString();

    for (const company of scored) {
      if (skippedSymbols.has(company.ticker)) continue;
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

  const logFile = await writeDefaultersLog(defaulters, totalCompanies);
  printDefaultersReport(log, defaulters, totalCompanies, logFile);

  log(`\n[pipeline] Done ✓`);
  return defaulters;
}
