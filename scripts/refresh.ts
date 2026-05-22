import { config } from "dotenv";
config({ path: ".env.local" });

const sector = process.argv[2];

async function main() {
  const { runPipeline } = await import("../lib/pipeline");
  await runPipeline((msg) => console.log(msg), sector);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
