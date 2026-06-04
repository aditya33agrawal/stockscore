export type Phase = "sectors" | "market" | "charts";

export interface RefreshRequest {
  phases: Phase[];
  sectors?: string[];
  force?: boolean;
}

export interface RefreshError {
  phase: Phase;
  scope?: string;
  item?: string;
  reason: string;
  message: string;
  stack?: string;
  ts: string;
}

export interface RefreshSummary {
  ok: boolean;
  phases: Record<string, { ok: boolean; duration_ms: number; error?: string }>;
  errors: RefreshError[];
  duration_ms: number;
}

export async function runRefresh(
  req: RefreshRequest,
  log: (msg: string) => void,
): Promise<RefreshSummary> {
  const { phases, sectors, force = false } = req;
  const t0 = Date.now();
  const errors: RefreshError[] = [];
  const phaseResults: RefreshSummary["phases"] = {};

  for (const phase of phases) {
    const pt0 = Date.now();
    log(`\n[run] === Phase: ${phase} ===`);
    try {
      if (phase === "sectors") {
        await runSectorsPhase(log, sectors, force, errors);
      } else if (phase === "market") {
        await runMarketPhase(log, force, errors);
      } else if (phase === "charts") {
        await runChartsPhase(log, sectors, force, errors);
      }
      phaseResults[phase] = { ok: true, duration_ms: Date.now() - pt0 };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      errors.push({ phase, reason: "phase_failed", message, stack, ts: new Date().toISOString() });
      phaseResults[phase] = { ok: false, duration_ms: Date.now() - pt0, error: message };
      log(`[run] Phase ${phase} FAILED: ${message}`);
    }
  }

  const ok = Object.values(phaseResults).every((p) => p.ok);
  const summary: RefreshSummary = {
    ok,
    phases: phaseResults,
    errors,
    duration_ms: Date.now() - t0,
  };

  log(`\n::summary:: ${JSON.stringify({ ok: summary.ok, phases: summary.phases, errorCount: errors.length, duration_ms: summary.duration_ms })}`);
  return summary;
}

async function runSectorsPhase(
  log: (msg: string) => void,
  sectors: string[] | undefined,
  force: boolean,
  errors: RefreshError[],
): Promise<void> {
  const { runPipeline } = await import("@/lib/pipeline");

  if (!sectors?.length) {
    // All sectors in one call
    const defaulters = await runPipeline(log, undefined, force);
    for (const d of defaulters) {
      errors.push({
        phase: "sectors",
        scope: d.sector,
        item: d.company,
        reason: d.reason,
        message: d.detail ?? (d.missing ? `Missing: ${d.missing.join(", ")}` : d.reason),
        ts: new Date().toISOString(),
      });
    }
    return;
  }

  // Per-sector calls with isolated try/catch
  for (const slug of sectors) {
    try {
      const defaulters = await runPipeline(log, slug, force);
      for (const d of defaulters) {
        errors.push({
          phase: "sectors",
          scope: d.sector,
          item: d.company,
          reason: d.reason,
          message: d.detail ?? (d.missing ? `Missing: ${d.missing.join(", ")}` : d.reason),
          ts: new Date().toISOString(),
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      errors.push({ phase: "sectors", scope: slug, reason: "sector_failed", message, stack, ts: new Date().toISOString() });
      log(`[sectors] Sector ${slug} FAILED: ${message}`);
    }
  }
}

async function runMarketPhase(
  log: (msg: string) => void,
  force: boolean,
  errors: RefreshError[],
): Promise<void> {
  const { runMarketPipeline } = await import("@/lib/market-pipeline");
  try {
    await runMarketPipeline(log, force);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    errors.push({ phase: "market", reason: "pipeline_error", message, stack, ts: new Date().toISOString() });
    throw err;
  }
}

async function runChartsPhase(
  log: (msg: string) => void,
  sectors: string[] | undefined,
  force: boolean,
  errors: RefreshError[],
): Promise<void> {
  const { runChartsRefresh } = await import("@/lib/charts/runner");
  const result = await runChartsRefresh(log, { force, sectors: sectors?.length ? sectors : undefined });
  for (const e of result.errors) {
    errors.push({
      phase: "charts",
      item: e.ticker,
      reason: "chart_error",
      message: e.reason,
      stack: e.stack,
      ts: new Date().toISOString(),
    });
  }
}
