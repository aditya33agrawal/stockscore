import { config } from "dotenv";
config({ path: ".env.local" });

const force = process.argv.includes("--force");

async function main() {
  const { runMarketPipeline } = await import("../lib/market-pipeline");
  await runMarketPipeline((msg) => console.log(msg), force);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
