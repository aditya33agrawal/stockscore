import { config } from "dotenv";
config({ path: ".env.local" });

import { log } from "../lib/logger";

const args = process.argv.slice(2);
const force = args.includes("--force");
const sector = args.find((a) => !a.startsWith("--"));

async function main() {
  const t0 = Date.now();
  log.info("script.start", { script: "refresh", sector: sector ?? null, force });
  const { runPipeline } = await import("../lib/pipeline");
  await runPipeline((msg) => console.log(msg), sector, force);
  log.info("script.end", { script: "refresh", duration_ms: Date.now() - t0 });
}

main().then(() => process.exit(0)).catch((err) => {
  log.error("script.failed", {
    script: "refresh",
    error: err instanceof Error ? err.message : String(err),
  });
  if (err instanceof Error && err.stack) console.error(err.stack);
  process.exit(1);
});
