import { config } from "dotenv";
config({ path: ".env.local" });

const force = process.argv.includes("--force");

if (force) {
  console.log("⚡ Force mode — all sectors will be re-synced regardless of age\n");
} else {
  console.log("📋 Sync mode — sectors updated within the last 7 days will be skipped\n");
}

async function main() {
  const { syncSectorsConfig } = await import("../lib/config-pipeline");
  await syncSectorsConfig(console.log, force);
  console.log("\n✅ Sector config sync complete");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Sync failed:", err);
    process.exit(1);
  });
