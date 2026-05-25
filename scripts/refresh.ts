import { config } from "dotenv";
config({ path: ".env.local" });

const args = process.argv.slice(2);
const force = args.includes("--force");
const sector = args.find((a) => !a.startsWith("--"));

async function main() {
  const { runPipeline } = await import("../lib/pipeline");
  await runPipeline((msg) => console.log(msg), sector, force);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
