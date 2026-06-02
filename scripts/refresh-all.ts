/**
 * scripts/refresh-all.ts
 *
 * Orchestrator for the weekly refresh job. Runs the three refresh phases
 * sequentially with isolated try/catch around each so a failure in one phase
 * doesn't abort the others. Emits a final machine-parseable summary line:
 *
 *   ::summary:: {"phases":{...},"failed":N,"duration_ms":T,"ok":bool}
 *
 * Exit code:
 *   0  — all phases succeeded
 *   1  — one or more phases failed (workflow will be marked failed)
 *
 * Usage:
 *   npx tsx scripts/refresh-all.ts            # respect 7-day cache
 *   npx tsx scripts/refresh-all.ts --force    # bypass cache everywhere
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { log } from "../lib/logger";

interface PhaseResult {
  name: string;
  ok: boolean;
  duration_ms: number;
  error?: string;
}

const force = process.argv.includes("--force");

async function runPhase(name: string, fn: () => Promise<void>): Promise<PhaseResult> {
  const t0 = Date.now();
  log.info(`phase.start`, { phase: name, force });
  try {
    await fn();
    const duration_ms = Date.now() - t0;
    log.info(`phase.end`, { phase: name, ok: true, duration_ms });
    return { name, ok: true, duration_ms };
  } catch (err) {
    const duration_ms = Date.now() - t0;
    const error = err instanceof Error ? err.message : String(err);
    log.error(`phase.failed`, { phase: name, duration_ms, error });
    if (err instanceof Error && err.stack) {
      console.error(err.stack);
    }
    return { name, ok: false, duration_ms, error };
  }
}

async function main() {
  const startedAt = Date.now();
  log.info("refresh.start", {
    node: process.version,
    git_sha: process.env.GITHUB_SHA ?? null,
    run_id: process.env.GITHUB_RUN_ID ?? null,
    force,
  });

  const phases: PhaseResult[] = [];

  // Phase 1 — sector + company scraper + scoring
  phases.push(
    await runPhase("sectors", async () => {
      const { runPipeline } = await import("../lib/pipeline");
      await runPipeline((msg) => console.log(msg), undefined, force);
    }),
  );

  // Phase 2 — market overview / sector aggregate metrics
  phases.push(
    await runPhase("market", async () => {
      const { runMarketPipeline } = await import("../lib/market-pipeline");
      await runMarketPipeline((msg) => console.log(msg), force);
    }),
  );

  // Phase 3 — price chart candles per ticker
  phases.push(
    await runPhase("charts", async () => {
      const { runChartsRefresh } = await tryImportChartsRunner();
      await runChartsRefresh(force);
    }),
  );

  const duration_ms = Date.now() - startedAt;
  const failed = phases.filter((p) => !p.ok).length;
  const ok = failed === 0;

  const summary = {
    ok,
    failed,
    duration_ms,
    phases: Object.fromEntries(
      phases.map((p) => [p.name, { ok: p.ok, duration_ms: p.duration_ms, error: p.error ?? null }]),
    ),
  };

  log.info("refresh.end", summary);
  // Machine-parseable marker line for the workflow / alerting payload
  console.log(`::summary:: ${JSON.stringify(summary)}`);

  process.exit(ok ? 0 : 1);
}

/**
 * The existing scripts/refresh-charts.ts has its inline `main()` and its
 * runner logic isn't exported from lib/. To avoid duplicating logic, we
 * spawn `npm run refresh:charts` as a child process when called from the
 * orchestrator. This keeps each phase isolated.
 */
async function tryImportChartsRunner() {
  return {
    runChartsRefresh: async (forceFlag: boolean) => {
      const { spawn } = await import("node:child_process");
      await new Promise<void>((resolve, reject) => {
        const args = ["tsx", "scripts/refresh-charts.ts"];
        if (forceFlag) args.push("--force");
        const child = spawn("npx", args, {
          stdio: "inherit",
          env: process.env,
        });
        child.on("close", (code) => {
          if (code === 0) resolve();
          else reject(new Error(`refresh-charts.ts exited with code ${code}`));
        });
        child.on("error", reject);
      });
    },
  };
}

main().catch((err) => {
  log.error("refresh.crashed", { error: err instanceof Error ? err.message : String(err) });
  if (err instanceof Error && err.stack) console.error(err.stack);
  process.exit(1);
});
