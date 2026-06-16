import { config } from "dotenv";
config({ path: ".env.local" });

import * as fs from "fs/promises";
import * as path from "path";
import { login } from "../lib/scraper/auth";
import type { Session } from "../lib/scraper/types";

// ---------------------------------------------------------------------------
// scripts/standardize-config.ts
//
// Resolves every symbol in sectors_config.json against screener.in, collapses
// aliases to their canonical ticker, enforces one-symbol-one-sector using
// sector_overrides.json, and emits a cleaned config + a full report.
//
//   npx tsx scripts/standardize-config.ts            # dry run -> .proposed.json + report
//   npx tsx scripts/standardize-config.ts --force    # ignore resolution cache
//   npx tsx scripts/standardize-config.ts --write     # overwrite sectors_config.json
//
// Resolutions are cached to data/symbol-resolution.json so re-runs are cheap
// and reproducible.
// ---------------------------------------------------------------------------

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, "sectors_config.json");
const OVERRIDES_PATH = path.join(ROOT, "sector_overrides.json");
const CACHE_PATH = path.join(ROOT, "data", "symbol-resolution.json");
const PROPOSED_PATH = path.join(ROOT, "sectors_config.proposed.json");
const REPORT_PATH = path.join(ROOT, "logs", "config-standardize-report.json");

const SEARCH_API = "https://www.screener.in/api/company/search/";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const FORCE = process.argv.includes("--force");
const WRITE = process.argv.includes("--write");

interface SectorConfig {
  slug: string;
  name: string;
  description: string;
  analyst_note?: string;
  cyclical?: boolean;
  companies: string[];
}
interface ConfigFile {
  sectors: SectorConfig[];
}
interface Overrides {
  primary_sector: Record<string, string>;
  merge_sectors: Record<string, string>;
  alias: Record<string, string>;
  manual: Record<string, string>;
  drop: string[];
}
interface Resolution {
  raw: string;
  canonical: string | null; // null = unresolved / not a listed NSE symbol
  name: string | null;
  url: string | null;
  resolvedAt: string;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function readJson<T>(p: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(p, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function tickerFromUrl(url: string): string | null {
  // /company/INFY/ or /company/INFY/consolidated/ -> INFY ; numeric -> unlisted
  const parts = url.split("/").filter(Boolean);
  const idx = parts.indexOf("company");
  const seg = idx >= 0 ? parts[idx + 1] : parts[parts.length - 1];
  if (!seg) return null;
  if (/^\d+$/.test(seg)) return null; // warehouse id => not an NSE-listed symbol
  return seg.toUpperCase();
}

// fetch with retry/backoff on 429 (rate limit) and transient network errors.
async function fetchRetry(
  url: string,
  session: Session,
): Promise<Response | null> {
  const waits = [4000, 8000, 16000, 30000];
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          Cookie: session.cookies,
          "User-Agent": UA,
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      if (res.status === 429 && attempt < waits.length) {
        await sleep(waits[attempt]);
        continue;
      }
      return res;
    } catch {
      if (attempt < waits.length) {
        await sleep(waits[attempt]);
        continue;
      }
      return null;
    }
  }
}

// Verify a candidate ticker has a live company page (200), with 429 backoff.
async function pageExists(session: Session, ticker: string): Promise<boolean> {
  const res = await fetchRetry(
    `https://www.screener.in/company/${ticker}/`,
    session,
  );
  return !!res && res.ok;
}

async function resolveSymbol(
  session: Session,
  raw: string,
  manual: Record<string, string>,
): Promise<Resolution> {
  const now = () => new Date().toISOString();
  const rawU = raw.toUpperCase();

  // 1) Manual override - trust only if the page actually exists.
  if (manual[rawU]) {
    const cand = manual[rawU];
    if (await pageExists(session, cand)) {
      return {
        raw,
        canonical: cand,
        name: null,
        url: `/company/${cand}/`,
        resolvedAt: now(),
      };
    }
    return { raw, canonical: null, name: null, url: null, resolvedAt: now() };
  }

  // 2) Search API by the raw symbol. NEVER take a fuzzy non-exact guess -
  //    screener's search is fuzzy (e.g. "GATI" -> Jain Irrigation). Only accept
  //    a result whose ticker exactly matches the raw symbol, OR the sole result
  //    when its ticker page also verifies (single unambiguous hit).
  const res = await fetchRetry(
    `${SEARCH_API}?q=${encodeURIComponent(raw)}&v=3`,
    session,
  );
  if (res && res.ok) {
    const results = (await res.json()) as Array<{
      name?: string;
      url?: string;
    }>;
    if (Array.isArray(results) && results.length > 0) {
      const exact = results.find((r) => r.url && tickerFromUrl(r.url) === rawU);
      if (exact && exact.url) {
        return {
          raw,
          canonical: tickerFromUrl(exact.url),
          name: exact.name ?? null,
          url: exact.url,
          resolvedAt: now(),
        };
      }
    }
  }

  // 3) Fallback: the raw string may itself be a valid screener code that the
  //    search API can't match (hyphens/ampersands, e.g. BAJAJ-AUTO, NAM-INDIA).
  if (await pageExists(session, raw)) {
    return {
      raw,
      canonical: rawU,
      name: null,
      url: `/company/${raw}/`,
      resolvedAt: now(),
    };
  }

  // Unresolved - reported, never guessed.
  return { raw, canonical: null, name: null, url: null, resolvedAt: now() };
}

async function main() {
  const cfg = await readJson<ConfigFile>(CONFIG_PATH, { sectors: [] });
  const ov = await readJson<Overrides>(OVERRIDES_PATH, {
    primary_sector: {},
    merge_sectors: {},
    alias: {},
    manual: {},
    drop: [],
  });
  const cache = await readJson<Record<string, Resolution>>(CACHE_PATH, {});

  const aliasMap: Record<string, string> = {};
  for (const [k, v] of Object.entries(ov.alias ?? {})) {
    if (k.startsWith("_")) continue;
    aliasMap[k.toUpperCase()] = v.toUpperCase();
  }
  const manualMap: Record<string, string> = {};
  for (const [k, v] of Object.entries(ov.manual ?? {})) {
    if (k.startsWith("_")) continue;
    manualMap[k.toUpperCase()] = v.toUpperCase();
  }
  const dropSet = new Set((ov.drop ?? []).map((s) => s.toUpperCase()));

  // 1) Gather every unique raw symbol (after applying the explicit alias map).
  const rawSymbols = new Set<string>();
  for (const s of cfg.sectors) {
    for (const c of s.companies) {
      const u = c.toUpperCase();
      rawSymbols.add(aliasMap[u] ?? u);
    }
  }

  // 2) Resolve (using cache unless --force).
  console.log(
    `Resolving ${rawSymbols.size} unique symbols against screener.in …`,
  );
  const email = process.env.SCREENER_EMAIL;
  const password = process.env.SCREENER_PASSWORD;
  const toResolve = [...rawSymbols].filter(
    (s) =>
      !dropSet.has(s) && (FORCE || !cache[s] || cache[s].canonical === null),
  );

  if (toResolve.length > 0) {
    if (!email || !password) {
      throw new Error(
        "SCREENER_EMAIL and SCREENER_PASSWORD must be set in .env.local",
      );
    }
    console.log(`Logging in to screener.in (${toResolve.length} to resolve) …`);
    const session = await login(email, password);
    let i = 0;
    for (const raw of toResolve) {
      i++;
      try {
        const r = await resolveSymbol(session, raw, manualMap);
        cache[raw] = r;
        const tag = r.canonical
          ? r.canonical === raw
            ? "ok"
            : `-> ${r.canonical}`
          : "UNRESOLVED";
        console.log(`  [${i}/${toResolve.length}] ${raw.padEnd(16)} ${tag}`);
      } catch (err) {
        console.log(
          `  [${i}/${toResolve.length}] ${raw.padEnd(16)} ERROR ${String(err)}`,
        );
        cache[raw] = {
          raw,
          canonical: null,
          name: null,
          url: null,
          resolvedAt: new Date().toISOString(),
        };
      }
      await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true });
      await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2));
      await sleep(2500);
    }
  } else {
    console.log("All symbols already cached. Use --force to re-resolve.");
  }

  // canonical lookup for a raw config string
  const canonicalOf = (configSymbol: string): string | null => {
    const u =
      aliasMap[configSymbol.toUpperCase()] ?? configSymbol.toUpperCase();
    return cache[u]?.canonical ?? null;
  };

  // 3) Build sector -> canonical symbol set, applying merge_sectors.
  const mergeMap: Record<string, string> = {};
  for (const [from, to] of Object.entries(ov.merge_sectors ?? {}))
    mergeMap[from] = to;

  const report = {
    generated_at: new Date().toISOString(),
    unresolved: [] as Array<{ symbol: string; sectors: string[] }>,
    dropped: [] as string[],
    rewritten: [] as Array<{ from: string; to: string }>,
    merged_sectors: mergeMap,
    cross_sector_resolved: [] as Array<{
      symbol: string;
      kept: string;
      removedFrom: string[];
    }>,
    cross_sector_undecided: [] as Array<{ symbol: string; sectors: string[] }>,
  };

  // sectorBySymbol: canonical symbol -> set of sector slugs it lands in
  const sectorBySymbol = new Map<string, Set<string>>();
  const sectorMeta = new Map<string, SectorConfig>();
  const rewrittenSeen = new Set<string>();

  for (const sec of cfg.sectors) {
    const targetSlug = mergeMap[sec.slug] ?? sec.slug;
    if (!sectorMeta.has(targetSlug)) {
      // prefer the surviving (non-merged-away) sector's metadata
      const meta = cfg.sectors.find((s) => s.slug === targetSlug) ?? sec;
      sectorMeta.set(targetSlug, { ...meta, companies: [] });
    }
    for (const rawC of sec.companies) {
      const upper = rawC.toUpperCase();
      if (dropSet.has(upper)) {
        report.dropped.push(`${rawC} (explicit drop, ${sec.slug})`);
        continue;
      }
      const canon = canonicalOf(rawC);
      if (!canon) {
        const entry = report.unresolved.find((u) => u.symbol === upper);
        if (entry) entry.sectors.push(sec.slug);
        else report.unresolved.push({ symbol: upper, sectors: [sec.slug] });
        continue; // unresolved symbols are dropped from output
      }
      if (canon !== upper && !rewrittenSeen.has(`${upper}->${canon}`)) {
        report.rewritten.push({ from: rawC, to: canon });
        rewrittenSeen.add(`${upper}->${canon}`);
      }
      if (!sectorBySymbol.has(canon)) sectorBySymbol.set(canon, new Set());
      sectorBySymbol.get(canon)!.add(targetSlug);
    }
  }

  // 4) Resolve cross-sector duplicates via primary_sector overrides.
  const primary = ov.primary_sector ?? {};
  const finalSectorSymbols = new Map<string, string[]>(); // slug -> symbols
  for (const slug of sectorMeta.keys()) finalSectorSymbols.set(slug, []);

  for (const [symbol, slugs] of sectorBySymbol) {
    if (slugs.size === 1) {
      const only = [...slugs][0];
      finalSectorSymbols.get(only)!.push(symbol);
      continue;
    }
    const chosen = primary[symbol];
    if (!chosen) {
      report.cross_sector_undecided.push({ symbol, sectors: [...slugs] });
      continue; // hard error later
    }
    if (!slugs.has(chosen)) {
      // primary points somewhere this symbol isn't currently in - still honour it
      report.cross_sector_undecided.push({
        symbol,
        sectors: [...slugs, `(primary=${chosen} not present)`],
      });
      continue;
    }
    finalSectorSymbols.get(chosen)!.push(symbol);
    report.cross_sector_resolved.push({
      symbol,
      kept: chosen,
      removedFrom: [...slugs].filter((s) => s !== chosen),
    });
  }

  // 5) Assemble proposed config (sorted, de-duped).
  const proposed: ConfigFile = {
    sectors: [...sectorMeta.values()]
      .map((meta) => ({
        ...meta,
        companies: [...new Set(finalSectorSymbols.get(meta.slug) ?? [])].sort(),
      }))
      .filter((s) => s.companies.length > 0)
      .sort((a, b) => a.slug.localeCompare(b.slug)),
  };

  // 6) Reports & output.
  await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log("\n──────────── STANDARDIZE REPORT ────────────");
  console.log(`Sectors: ${cfg.sectors.length} -> ${proposed.sectors.length}`);
  console.log(`Symbols rewritten to canonical: ${report.rewritten.length}`);
  console.log(
    `Cross-sector dups auto-resolved: ${report.cross_sector_resolved.length}`,
  );
  console.log(`Unresolved symbols (dropped):    ${report.unresolved.length}`);
  console.log(`Explicit drops:                  ${report.dropped.length}`);
  console.log(
    `UNDECIDED cross-sector dups:     ${report.cross_sector_undecided.length}`,
  );

  if (report.rewritten.length) {
    console.log("\nRewrites:");
    for (const r of report.rewritten) console.log(`  ${r.from} -> ${r.to}`);
  }
  if (report.unresolved.length) {
    console.log(
      "\nUnresolved (verify or add to sector_overrides.drop / alias):",
    );
    for (const u of report.unresolved)
      console.log(`  ${u.symbol}  [${u.sectors.join(", ")}]`);
  }
  if (report.cross_sector_undecided.length) {
    console.log("\n⚠️  UNDECIDED - add a primary_sector entry for each:");
    for (const d of report.cross_sector_undecided) {
      console.log(
        `  "${d.symbol}": "?"   // currently in: ${d.sectors.join(", ")}`,
      );
    }
  }
  console.log(`\nReport: ${REPORT_PATH}`);

  if (report.cross_sector_undecided.length > 0) {
    console.log(
      "\n❌ Refusing to finalize - resolve the undecided dups in sector_overrides.json.",
    );
    if (WRITE) {
      console.log("   (--write ignored.)");
    }
    await fs.writeFile(PROPOSED_PATH, JSON.stringify(proposed, null, 2) + "\n");
    console.log(`   Proposed (for inspection only): ${PROPOSED_PATH}`);
    process.exit(2);
  }

  if (WRITE) {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(proposed, null, 2) + "\n");
    console.log(`\n✅ Wrote cleaned config to ${CONFIG_PATH}`);
    // remove any stale proposed file
    await fs.rm(PROPOSED_PATH, { force: true });
  } else {
    await fs.writeFile(PROPOSED_PATH, JSON.stringify(proposed, null, 2) + "\n");
    console.log(
      `\n✅ Dry run. Review ${PROPOSED_PATH}, then re-run with --write.`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ standardize-config failed:", err);
    process.exit(1);
  });
