import Link from "next/link";
import clsx from "clsx";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import type { AdminStats } from "@/lib/admin-stats";
import { formatRelative } from "@/lib/format";

function StatCard({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "good" | "bad" | "warn";
}) {
  const valueColor = {
    neutral: "text-chalk-50",
    good: "text-good",
    bad: "text-bad",
    warn: "text-warn",
  }[tone];
  return (
    <div className="glass border-subtle rounded-2xl px-5 py-4">
      <p className="text-[11px] uppercase tracking-wider text-chalk-300/60">{label}</p>
      <p className={clsx("mt-1.5 text-2xl font-bold num", valueColor)}>{value}</p>
      {sub && <p className="mt-1 text-xs text-chalk-300/60">{sub}</p>}
    </div>
  );
}

const PHASE_LINKS = [
  { label: "Refresh all", phases: "sectors,market,charts" },
  { label: "Sectors", phases: "sectors" },
  { label: "Market", phases: "market" },
  { label: "Charts", phases: "charts" },
];

export function AdminDashboard({ stats }: { stats: AdminStats }) {
  const { companies, sectors, charts, market, runs } = stats;

  const lastRunTone = runs.lastOk == null ? "neutral" : runs.lastOk ? "good" : "bad";
  const lastRunValue =
    runs.lastOk == null ? "-" : runs.lastOk ? "Healthy" : "Failed";
  const staleCount = sectors.list.filter((s) => s.stale).length;

  return (
    <div className="space-y-8">
      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Companies" value={String(companies.total)} sub="scored tickers" />
        <StatCard
          label="Sectors"
          value={`${sectors.scored} / ${sectors.configured}`}
          sub="scored / configured"
          tone={staleCount > 0 ? "warn" : "good"}
        />
        <StatCard
          label="Chart symbols"
          value={String(charts.symbols)}
          sub={`updated ${formatRelative(charts.lastRefreshed)}`}
        />
        <StatCard
          label="Last refresh"
          value={lastRunValue}
          sub={runs.lastFinishedAt ? formatRelative(runs.lastFinishedAt) : "no runs yet"}
          tone={lastRunTone}
        />
      </div>

      {/* Quick actions */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-chalk-100">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          {PHASE_LINKS.map((a) => (
            <Link
              key={a.phases}
              href={`/admin/refresh?phases=${a.phases}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-accent/20 bg-accent/10 px-3.5 py-2 text-sm font-semibold text-accent hover:bg-accent/15 hover:border-accent/40 transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5" /> {a.label}
            </Link>
          ))}
        </div>
        <p className="mt-2 text-xs text-chalk-300/50">
          Charts &amp; market last refreshed: charts {formatRelative(charts.lastRefreshed)} · market{" "}
          {formatRelative(market.lastRefreshed)}.
        </p>
      </section>

      {/* Errors banner */}
      {runs.openErrors > 0 && (
        <Link
          href="/admin/runs"
          className="flex items-center gap-2.5 rounded-xl border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-bad hover:border-bad/50 transition-colors"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <span className="num font-semibold">{runs.openErrors}</span> error
            {runs.openErrors === 1 ? "" : "s"} in the most recent run - review run history.
          </span>
        </Link>
      )}

      {/* Sectors table */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-chalk-100">
          Sectors{" "}
          {staleCount > 0 && (
            <span className="text-warn font-normal">· {staleCount} stale</span>
          )}
        </h2>
        <div className="glass border-subtle rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgb(var(--accent)_/_0.08)] text-left text-[11px] uppercase tracking-wider text-chalk-300/60">
                <th className="px-4 py-2.5 font-medium">Sector</th>
                <th className="px-4 py-2.5 font-medium text-right">Companies</th>
                <th className="px-4 py-2.5 font-medium text-right">Last refreshed</th>
                <th className="px-4 py-2.5 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {sectors.list.map((s) => (
                <tr
                  key={s.slug}
                  className="border-b border-[rgb(var(--accent)_/_0.05)] last:border-0 hover:bg-ink-800/40 transition-colors"
                >
                  <td className="px-4 py-2.5 text-chalk-100">{s.name}</td>
                  <td className="px-4 py-2.5 text-right num text-chalk-200">{s.companies}</td>
                  <td className="px-4 py-2.5 text-right num text-chalk-300/70">
                    {formatRelative(s.lastRefreshed)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {s.stale ? (
                      <span className="inline-flex items-center gap-1 text-warn">
                        <AlertTriangle className="h-3.5 w-3.5" /> Stale
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-good">
                        <CheckCircle className="h-3.5 w-3.5" /> Fresh
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {sectors.list.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-chalk-300/50">
                    <XCircle className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                    No sectors configured yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
