import { config } from "dotenv";
config({ path: ".env.local" });

import * as fs from "fs/promises";
import * as path from "path";
import { log } from "../lib/logger";

const args = process.argv.slice(2);
const force = args.includes("--force");
const concurrency = 4;
const explicitSymbols = args.filter((a) => !a.startsWith("--"));

interface SectorConfig {
  slug: string;
  companies: string[];
}

async function loadSymbols(): Promise<string[]> {
  if (explicitSymbols.length) return explicitSymbols;
  const raw = await fs.readFile(path.join(process.cwd(), "sectors_config.json"), "utf-8");
  const cfg = JSON.parse(raw) as { sectors: SectorConfig[] };
  const set = new Set<string>();
  for (const s of cfg.sectors) for (const c of s.companies) set.add(c);
  return Array.from(set);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const t0 = Date.now();
  log.info("script.start", { script: "refresh-charts", force });
  const { refreshSymbol } = await import("../lib/charts/pipeline");
  const { ensureTables } = await import("../lib/db");
  await ensureTables();

  const symbols = await loadSymbols();
  console.log(`[charts] refreshing ${symbols.length} symbols (force=${force})`);

  const queue = [...symbols];
  let saved = 0,
    skipped = 0,
    errored = 0;

  const defaulters: { ticker: string; reason: string }[] = [];

  async function worker(id: number) {
    while (queue.length) {
      const ticker = queue.shift();
      if (!ticker) return;
      const t0 = Date.now();
      try {
        const res = await refreshSymbol(ticker, (m) => console.log(`  [w${id}] ${m}`), force);
        const ms = Date.now() - t0;
        if (res.status === "saved") {
          saved++;
          console.log(
            `  [w${id}] ${ticker} ✓ ${res.source} (${res.candleCount} candles, ${ms}ms)`
          );
        } else if (res.status === "skipped") {
          skipped++;
          console.log(`  [w${id}] ${ticker} — up to date, skip`);
        } else {
          errored++;
          defaulters.push({ ticker, reason: "no data" });
          console.log(`  [w${id}] ${ticker} ✗ no data`);
        }
      } catch (err) {
        errored++;
        defaulters.push({ ticker, reason: String(err) });
        console.log(`  [w${id}] ${ticker} ✗ ERROR: ${String(err)}`);
      }
      await sleep(250);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, (_, i) => worker(i + 1)));

  console.log(
    `\n[charts] done — saved=${saved} skipped=${skipped} errored=${errored} total=${symbols.length}`
  );

  if (defaulters.length > 0) {
    console.log(`\n[charts] ⚠️  defaulters (${defaulters.length}):`);
    for (const { ticker, reason } of defaulters) {
      console.log(`  • ${ticker.padEnd(20)} ${reason}`);
    }
  }

  log.info("script.end", {
    script: "refresh-charts",
    duration_ms: Date.now() - t0,
    saved,
    skipped,
    errored,
    total: symbols.length,
  });
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    log.error("script.failed", {
      script: "refresh-charts",
      error: err instanceof Error ? err.message : String(err),
    });
    if (err instanceof Error && err.stack) console.error(err.stack);
    process.exit(1);
  });
