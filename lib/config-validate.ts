import * as fs from "fs/promises";
import * as path from "path";

// Offline validation of sectors_config.json against the resolution cache.
// Returns a list of human-readable error strings (empty = valid).

interface SectorConfig {
  slug: string;
  name: string;
  description: string;
  companies: string[];
}
interface Resolution {
  canonical: string | null;
}

async function readJson<T>(p: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(p, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

export async function validateConfig(): Promise<string[]> {
  const root = process.cwd();
  const cfg = await readJson<{ sectors: SectorConfig[] }>(
    path.join(root, "sectors_config.json"),
    { sectors: [] },
  );
  const cache = await readJson<Record<string, Resolution>>(
    path.join(root, "data", "symbol-resolution.json"),
    {},
  );

  const errors: string[] = [];

  const slugSeen = new Set<string>();
  for (const s of cfg.sectors) {
    if (!s.slug || !s.name || !s.description) {
      errors.push(`Sector "${s.slug ?? s.name ?? "?"}" missing slug/name/description.`);
    }
    if (slugSeen.has(s.slug)) errors.push(`Duplicate sector slug: ${s.slug}`);
    slugSeen.add(s.slug);
    if (!s.companies || s.companies.length === 0) {
      errors.push(`Sector "${s.slug}" has no companies.`);
    }
    const seen = new Set<string>();
    for (const c of s.companies ?? []) {
      const u = c.toUpperCase();
      if (seen.has(u)) errors.push(`Sector "${s.slug}": duplicate company ${u}.`);
      seen.add(u);
    }
  }

  const symbolSectors = new Map<string, string[]>();
  for (const s of cfg.sectors) {
    for (const c of s.companies ?? []) {
      const u = c.toUpperCase();
      const arr = symbolSectors.get(u) ?? [];
      arr.push(s.slug);
      symbolSectors.set(u, arr);
    }
  }
  for (const [sym, slugs] of symbolSectors) {
    if (slugs.length > 1) {
      errors.push(`Symbol ${sym} appears in ${slugs.length} sectors: ${slugs.join(", ")}`);
    }
  }

  if (Object.keys(cache).length === 0) {
    errors.push(
      "No data/symbol-resolution.json — run `npm run standardize:config` first to verify symbols.",
    );
  } else {
    // A config symbol is valid iff it is the canonical form of some resolved
    // entry (the config stores canonical symbols, which appear as cache values).
    const canonicalSet = new Set<string>();
    for (const r of Object.values(cache)) {
      if (r.canonical) canonicalSet.add(r.canonical.toUpperCase());
    }
    for (const sym of symbolSectors.keys()) {
      if (!canonicalSet.has(sym)) {
        errors.push(`Symbol ${sym} is not a verified canonical screener symbol (run standardize:config).`);
      }
    }
  }

  return errors;
}
