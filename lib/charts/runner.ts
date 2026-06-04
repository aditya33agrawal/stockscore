import * as fs from "fs/promises";
import * as path from "path";
import { refreshSymbol } from "./pipeline";
import { ensureTables } from "@/lib/db";

type Log = (msg: string) => void;

interface SectorConfig {
  slug: string;
  companies: string[];
}

export interface ChartsRunnerError {
  ticker: string;
  reason: string;
  stack?: string;
}

export interface ChartsRunnerResult {
  saved: number;
  skipped: number;
  errored: number;
  total: number;
  errors: ChartsRunnerError[];
}

async function loadSymbolsFromConfig(sectors?: string[]): Promise<string[]> {
  const raw = await fs.readFile(path.join(process.cwd(), "sectors_config.json"), "utf-8");
  const cfg = JSON.parse(raw) as { sectors: SectorConfig[] };
  const set = new Set<string>();
  const sectorsToScan = sectors?.length
    ? cfg.sectors.filter((s) => sectors.includes(s.slug))
    : cfg.sectors;
  for (const s of sectorsToScan) for (const c of s.companies) set.add(c);
  return Array.from(set);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runChartsRefresh(
  log: Log,
  opts: { force?: boolean; symbols?: string[]; sectors?: string[] } = {}
): Promise<ChartsRunnerResult> {
  const { force = false, symbols: explicitSymbols, sectors } = opts;

  await ensureTables();

  const symbols = explicitSymbols?.length
    ? explicitSymbols
    : await loadSymbolsFromConfig(sectors);

  log(`[charts] refreshing ${symbols.length} symbols (force=${force})`);

  const queue = [...symbols];
  let saved = 0, skipped = 0, errored = 0;
  const errors: ChartsRunnerError[] = [];
  const concurrency = 4;

  async function worker(id: number) {
    while (queue.length) {
      const ticker = queue.shift();
      if (!ticker) return;
      const t0 = Date.now();
      try {
        const res = await refreshSymbol(ticker, (m) => log(`  [w${id}] ${m}`), force);
        const ms = Date.now() - t0;
        if (res.status === "saved") {
          saved++;
          log(`  [w${id}] ${ticker} ✓ ${res.source} (${res.candleCount} candles, ${ms}ms)`);
        } else if (res.status === "skipped") {
          skipped++;
          log(`  [w${id}] ${ticker} — up to date, skip`);
        } else {
          errored++;
          errors.push({ ticker, reason: "no data" });
          log(`  [w${id}] ${ticker} ✗ no data`);
        }
      } catch (err) {
        errored++;
        const reason = err instanceof Error ? err.message : String(err);
        const stack = err instanceof Error ? err.stack : undefined;
        errors.push({ ticker, reason, stack });
        log(`  [w${id}] ${ticker} ✗ ERROR: ${reason}`);
      }
      await sleep(250);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, (_, i) => worker(i + 1)));

  log(`\n[charts] done — saved=${saved} skipped=${skipped} errored=${errored} total=${symbols.length}`);

  if (errors.length > 0) {
    log(`\n[charts] defaulters (${errors.length}):`);
    for (const { ticker, reason } of errors) {
      log(`  • ${ticker.padEnd(20)} ${reason}`);
    }
  }

  return { saved, skipped, errored, total: symbols.length, errors };
}
