import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { unstable_cache } from "next/cache";
import type { SectorData, SectorIndexEntry } from "./types";
import type { CompanyDetail } from "./company-data";
import sql from "./db";

function withTimeout<T>(promise: Promise<T>, ms = 10000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("DB query timed out")), ms),
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
      `,
    );
    const seen = new Set<string>();
    return rows
      .filter((r) => {
        if (seen.has(r.slug)) return false;
        seen.add(r.slug);
        return true;
      })
      .map((r) => ({
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
  cyclical?: boolean;
  companies: string[];
}

export async function loadSectorsConfig(): Promise<SectorConfigEntry[]> {
  // Try DB first - populated by `npm run sync:config`
  try {
    const rows = await withTimeout(
      sql<
        {
          slug: string;
          name: string;
          description: string | null;
          analyst_note: string | null;
          cyclical: boolean;
          companies: unknown;
        }[]
      >`
        SELECT slug, name, description, analyst_note, cyclical, companies
        FROM sector_config
        ORDER BY name
      `,
    );
    if (rows.length > 0) {
      return rows.map((r) => ({
        slug: r.slug,
        name: r.name,
        description: r.description ?? "",
        analyst_note: r.analyst_note ?? undefined,
        cyclical: r.cyclical,
        companies: r.companies as string[],
      }));
    }
  } catch (err) {
    console.error(
      "[data] loadSectorsConfig from DB failed, falling back to JSON:",
      err,
    );
  }

  // Fallback: read directly from sectors_config.json
  const raw = await fs.readFile(
    path.join(process.cwd(), "sectors_config.json"),
    "utf8",
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
    `,
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  const rawCompanies = (r.companies as SectorData["companies"]) ?? [];
  const seenCo = new Set<string>();
  const companies = rawCompanies.filter((c: any) => {
    const key = (c.ticker ?? c.slug ?? c.name ?? "").toString().toLowerCase();
    if (!key || seenCo.has(key)) return false;
    seenCo.add(key);
    return true;
  });
  return {
    slug: r.slug,
    name: r.name,
    refreshed_at: r.refreshed_at,
    companies_count: companies.length || r.companies_count,
    description: r.description,
    analyst_note: r.analyst_note ?? undefined,
    sector_stats: r.sector_stats as SectorData["sector_stats"],
    companies,
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
      `,
    );
    const out: CompanyIndexEntry[] = [];
    const seen = new Set<string>();
    for (const r of rows) {
      const cos =
        (r.companies as {
          slug: string;
          name: string;
          ticker: string;
          final_score: number;
        }[]) ?? [];
      for (const c of cos) {
        const key = `${r.slug}:${(c.ticker ?? c.slug ?? c.name).toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
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

// ── Hero radar + tier distribution ──────────────────────────────────────────
// Short axis labels keyed to the scorer's category names (lib/scorer.ts).
const HERO_AXIS_LABELS: Record<string, string> = {
  "Quality of Business": "Quality",
  Growth: "Growth",
  Valuation: "Value",
  "Balance Sheet": "Balance",
  "Cash Flow": "Cash",
  "Quarterly Momentum": "Momentum",
  Shareholding: "Holders",
  "Peer Composite": "Peers",
  "Price & Technical": "Technical",
  "Size & Liquidity": "Size",
};

export interface HeroCompany {
  ticker: string;
  name: string;
  score: number;
  classification: string;
  /** % of max per category, aligned to the returned `labels` order. */
  axes: number[];
}

export type Tier =
  | "Exceptional"
  | "Invest-grade"
  | "Accumulate"
  | "Watchlist"
  | "Avoid";
export interface TierCount {
  tier: Tier;
  min: number;
  count: number;
}

/** Maps a final score to its classification tier (cutoffs from lib/scorer.ts). */
export function scoreTier(score: number): Tier {
  if (score < 40) return "Avoid";
  if (score < 55) return "Watchlist";
  if (score < 70) return "Accumulate";
  if (score < 85) return "Invest-grade";
  return "Exceptional";
}

// Nifty 50 constituents - screener.in canonical tickers. Anything not present in
// the DB is simply skipped, so an occasional index reshuffle degrades gracefully.
const NIFTY_50 = [
  "ADANIENT",
  "ADANIPORTS",
  "APOLLOHOSP",
  "ASIANPAINT",
  "AXISBANK",
  "BAJAJ-AUTO",
  "BAJFINANCE",
  "BAJAJFINSV",
  "BEL",
  "BHARTIARTL",
  "BPCL",
  "BRITANNIA",
  "CIPLA",
  "COALINDIA",
  "DRREDDY",
  "EICHERMOT",
  "GRASIM",
  "HCLTECH",
  "HDFCBANK",
  "HDFCLIFE",
  "HEROMOTOCO",
  "HINDALCO",
  "HINDUNILVR",
  "ICICIBANK",
  "ITC",
  "INDUSINDBK",
  "INFY",
  "JSWSTEEL",
  "KOTAKBANK",
  "LT",
  "LTIM",
  "M&M",
  "MARUTI",
  "NESTLEIND",
  "NTPC",
  "ONGC",
  "POWERGRID",
  "RELIANCE",
  "SBILIFE",
  "SBIN",
  "SHRIRAMFIN",
  "SUNPHARMA",
  "TCS",
  "TATACONSUM",
  "TATAMOTORS",
  "TATASTEEL",
  "TECHM",
  "TITAN",
  "TRENT",
  "ULTRACEMCO",
  "WIPRO",
];

const TIER_ORDER: Tier[] = [
  "Exceptional",
  "Invest-grade",
  "Accumulate",
  "Watchlist",
  "Avoid",
];
const TIER_MIN: Record<Tier, number> = {
  Exceptional: 85,
  "Invest-grade": 70,
  Accumulate: 55,
  Watchlist: 40,
  Avoid: 0,
};

export interface HeroData {
  companies: HeroCompany[];
  labels: string[];
  tiers: TierCount[];
}

/** Fallback hero data for when the DB read fails - used as a per-request
 *  catch so a transient error doesn't get baked into the shared cache. */
export function emptyHeroData(): HeroData {
  return {
    companies: [],
    labels: [],
    tiers: TIER_ORDER.map((tier) => ({ tier, min: TIER_MIN[tier], count: 0 })),
  };
}

async function _loadHeroData(): Promise<HeroData> {
  const counts: Record<Tier, number> = {
    Exceptional: 0,
    "Invest-grade": 0,
    Accumulate: 0,
    Watchlist: 0,
    Avoid: 0,
  };

  try {
    // 1) Tier distribution over ALL companies - Postgres extracts just the score,
    //    so we never transfer the heavy per-company JSONB blobs over the wire.
    const scoreRows = await withTimeout(
      sql<{ score: number }[]>`
        SELECT (c->>'final_score')::float AS score
        FROM sectors s, jsonb_array_elements(s.companies) AS c
      `,
      15000,
    );
    for (const r of scoreRows) {
      if (r.score == null || Number.isNaN(r.score)) continue;
      counts[scoreTier(r.score)]++;
    }

    // 2) Radar data for the Nifty 50 only - filtered + projected in SQL, so we
    //    pull ~50 rows with just their category breakdown, not every company.
    const radarRows = await withTimeout(
      sql<
        {
          ticker: string;
          name: string;
          score: number;
          categories: { name: string; earned: number; max: number }[];
        }[]
      >`
        SELECT c->>'ticker'        AS ticker,
               c->>'name'          AS name,
               (c->>'final_score')::float AS score,
               c->'categories'     AS categories
        FROM sectors s, jsonb_array_elements(s.companies) AS c
        WHERE c->>'ticker' = ANY(${NIFTY_50})
      `,
      15000,
    );

    let labels: string[] = [];
    const companies: HeroCompany[] = [];
    const seen = new Set<string>();

    // Helper to parse radarRows into HeroCompany list
    const parseRows = (
      rows: { ticker: string; name: string; score: number; categories: { name: string; earned: number; max: number }[] }[],
    ) => {
      const result: HeroCompany[] = [];
      let lbls: string[] = [];
      for (const r of rows) {
        const ticker = r.ticker ?? "";
        if (!ticker || seen.has(ticker)) continue;
        const cats = r.categories ?? [];
        if (cats.length < 6) continue;
        seen.add(ticker);
        if (lbls.length === 0)
          lbls = cats.map((cat) => HERO_AXIS_LABELS[cat.name] ?? cat.name);
        result.push({
          ticker,
          name: r.name,
          score: r.score ?? 0,
          classification: scoreTier(r.score ?? 0),
          axes: cats.map((cat) =>
            cat.max > 0 ? Math.round((cat.earned / cat.max) * 100) : 0,
          ),
        });
      }
      return { companies: result, labels: lbls };
    };

    const parsed = parseRows(radarRows);
    companies.push(...parsed.companies);
    if (parsed.labels.length > 0) labels = parsed.labels;

    // Fallback: if no Nifty 50 companies found in DB, use top-scoring companies
    if (companies.length === 0) {
      const fallbackRows = await withTimeout(
        sql<{ ticker: string; name: string; score: number; categories: { name: string; earned: number; max: number }[] }[]>`
          SELECT c->>'ticker'        AS ticker,
                 c->>'name'          AS name,
                 (c->>'final_score')::float AS score,
                 c->'categories'     AS categories
          FROM sectors s, jsonb_array_elements(s.companies) AS c
          WHERE (c->>'final_score')::float IS NOT NULL
          ORDER BY (c->>'final_score')::float DESC
          LIMIT 60
        `,
        15000,
      );
      const fb = parseRows(fallbackRows);
      companies.push(...fb.companies);
      if (fb.labels.length > 0) labels = fb.labels;
    }

    // Keep only companies whose axis count matches the canonical label set, and
    // sort best-first so reduced-motion / first frame shows a strong profile.
    const aligned = companies
      .filter((c) => c.axes.length === labels.length)
      .sort((a, b) => b.score - a.score);

    return {
      companies: aligned,
      labels,
      tiers: TIER_ORDER.map((tier) => ({
        tier,
        min: TIER_MIN[tier],
        count: counts[tier],
      })),
    };
  } catch (err) {
    console.error("[data] loadHeroData failed:", err);
    // Re-throw (rather than returning an empty fallback) so unstable_cache does
    // NOT memoize a failed/empty result for the full revalidate window - a
    // transient DB timeout (e.g. during build) would otherwise bake an empty
    // hero radar into the static page for hours. Callers should catch this and
    // fall back to emptyHeroData() for that single render.
    throw err;
  }
}

// Fetched once, then served from cache (revalidated every 6h). Data only changes
// on the weekly refresh, so the hero never re-hits the DB on ordinary requests.
export const loadHeroData = unstable_cache(_loadHeroData, ["hero-data-v2"], {
  revalidate: 21600,
});

export async function allSectorSlugs(): Promise<string[]> {
  const idx = await loadSectorIndex();
  return idx.map((s) => s.slug);
}

export async function loadCompanyDetail(
  symbol: string,
): Promise<CompanyDetail | null> {
  const rows = await withTimeout(
    sql<{ data: unknown }[]>`
      SELECT data FROM companies WHERE symbol = ${symbol} LIMIT 1
    `,
  );
  if (rows.length === 0) return null;
  return rows[0].data as CompanyDetail;
}
