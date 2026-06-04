import { config } from "dotenv";
config({ path: ".env.local" });

import { validateConfig } from "../lib/config-validate";

// scripts/validate-config.ts — the gate (no network). Exits non-zero on any
// duplicate / unresolved / non-canonical symbol or malformed sector.
//   npx tsx scripts/validate-config.ts

async function main() {
  const errors = await validateConfig();
  if (errors.length > 0) {
    console.error(`\n❌ Config validation FAILED — ${errors.length} issue(s):\n`);
    for (const e of errors) console.error(`  • ${e}`);
    console.error("");
    process.exit(1);
  }
  console.log("✅ Config valid: no duplicates, every symbol canonical & resolved.");
}

main().catch((err) => {
  console.error("validate-config crashed:", err);
  process.exit(1);
});
