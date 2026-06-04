import { config } from "dotenv";
config({ path: ".env.local" });

import { log } from "../lib/logger";

const args = process.argv.slice(2);
const force = args.includes("--force");
const explicitSymbols = args.filter((a) => !a.startsWith("--"));

async function main() {
  const t0 = Date.now();
  log.info("script.start", { script: "refresh-charts", force });

  const { runChartsRefresh } = await import("../lib/charts/runner");
  const result = await runChartsRefresh((m) => console.log(m), {
    force,
    symbols: explicitSymbols.length ? explicitSymbols : undefined,
  });

  log.info("script.end", {
    script: "refresh-charts",
    duration_ms: Date.now() - t0,
    ...result,
    errored: result.errored,
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
