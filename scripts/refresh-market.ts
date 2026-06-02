import { config } from "dotenv";
config({ path: ".env.local" });

import { log } from "../lib/logger";

const force = process.argv.includes("--force");

async function main() {
  const t0 = Date.now();
  log.info("script.start", { script: "refresh-market", force });
  const { runMarketPipeline } = await import("../lib/market-pipeline");
  await runMarketPipeline((msg) => console.log(msg), force);
  log.info("script.end", { script: "refresh-market", duration_ms: Date.now() - t0 });
}

main().then(() => process.exit(0)).catch((err) => {
  log.error("script.failed", {
    script: "refresh-market",
    error: err instanceof Error ? err.message : String(err),
  });
  if (err instanceof Error && err.stack) console.error(err.stack);
  process.exit(1);
});
