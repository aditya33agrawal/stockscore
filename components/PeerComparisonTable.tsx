import type { CSSProperties } from "react";
import Link from "next/link";
import type { Company } from "@/lib/types";

interface Props {
  companies: Company[];
  currentSlug: string;
  sectorSlug: string;
}

function fmtMCap(v: number | undefined): string {
  if (!v) return "—";
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L Cr`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K Cr`;
  return `₹${v.toFixed(0)} Cr`;
}

function classificationStyle(cls: string | undefined): string {
  if (!cls) return "text-chalk-300/60";
  const c = cls.toLowerCase();
  if (c.includes("exceptional")) return "text-emerald-400";
  if (c.includes("invest")) return "text-accent";
  if (c.includes("accumulate")) return "text-teal-400";
  if (c.includes("watchlist")) return "text-warn";
  return "text-bad";
}

function scoreBg(score: number): string {
  if (score >= 80) return "bg-accent/20 text-accent";
  if (score >= 65) return "bg-teal-400/20 text-teal-400";
  if (score >= 50) return "bg-warn/20 text-warn";
  return "bg-bad/20 text-bad";
}

function heatStyle(value: number | undefined | null, max: number, isGood = true): CSSProperties {
  if (value == null || max === 0) return {};
  const pct = Math.min(Math.abs(value) / max, 1);
  if (!isGood) {
    // higher D/E = more red
    return { backgroundColor: `rgba(248, 113, 113, ${pct * 0.22})` };
  }
  return { backgroundColor: `rgba(16, 185, 129, ${pct * 0.22})` };
}

function Delta({ v }: { v: number | undefined | null }) {
  if (v == null) return <span className="text-chalk-300/40">—</span>;
  const sign = v >= 0 ? "+" : "";
  const cls = v >= 15 ? "text-accent" : v >= 5 ? "text-teal-400" : v < 0 ? "text-bad" : "text-chalk-300";
  return <span className={`num ${cls}`}>{sign}{v.toFixed(0)}%</span>;
}

export function PeerComparisonTable({ companies, currentSlug, sectorSlug }: Props) {
  const sorted = [...companies].sort((a, b) => b.final_score - a.final_score);

  // Sector-wide maxes for heatmap normalisation
  const maxROE = Math.max(0, ...companies.map((c) => c.raw.roe ?? 0));
  const maxROCE = Math.max(0, ...companies.map((c) => c.raw.roce ?? 0));
  const maxOPM = Math.max(0, ...companies.map((c) => c.raw.opm ?? 0));
  const maxDE = Math.max(0, ...companies.map((c) => c.raw.debt_to_equity ?? 0));
  const maxProfit5Y = Math.max(0, ...companies.map((c) => Math.max(0, c.raw.profit_5y_cagr ?? 0)));
  const maxSales5Y = Math.max(0, ...companies.map((c) => Math.max(0, c.raw.sales_5y_cagr ?? 0)));

  const TH = ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <th
      className="px-3 py-2.5 text-right text-[11px] font-semibold text-chalk-300/50 whitespace-nowrap"
      title={title}
    >
      {children}
    </th>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-ink-700/60">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-ink-700/40 bg-ink-800/70">
            <th className="sticky left-0 z-10 bg-ink-800/90 px-4 py-2.5 text-left text-[11px] font-semibold text-chalk-300/50 whitespace-nowrap min-w-[160px] border-r border-ink-700/40">
              Company
            </th>
            <TH title="Fundamental score / 100">Score</TH>
            <TH>CMP</TH>
            <TH title="Market capitalisation">Mkt Cap</TH>
            <TH title="Price / Earnings">P/E</TH>
            <TH title="Price / Book value">P/B</TH>
            <TH title="Return on Equity — higher is better">ROE %</TH>
            <TH title="Return on Capital Employed — higher is better">ROCE %</TH>
            <TH title="Operating Profit Margin — higher is better">OPM %</TH>
            <TH title="Debt to Equity — lower is better">D/E</TH>
            <TH title="5-year Sales CAGR">Sales 5Y</TH>
            <TH title="5-year Profit CAGR">PAT 5Y</TH>
          </tr>
        </thead>
        <tbody>
          {sorted.map((co, idx) => {
            const isCurrent = co.slug === currentSlug;
            const rowBg = isCurrent
              ? "bg-accent/5"
              : idx % 2 === 0
              ? "bg-ink-900/60"
              : "bg-ink-800/30";

            return (
              <tr
                key={co.slug}
                className={`border-b border-ink-700/20 hover:bg-ink-800/50 transition-colors ${
                  isCurrent ? "border-l-2 border-l-accent" : ""
                } ${rowBg}`}
              >
                {/* Company name */}
                <td
                  className={`sticky left-0 z-10 px-4 py-2.5 border-r border-ink-700/30 ${rowBg}`}
                >
                  <Link href={`/sector/${sectorSlug}/${co.slug}`} className="group">
                    <p
                      className={`font-semibold truncate max-w-[148px] group-hover:text-accent transition-colors ${
                        isCurrent ? "text-accent" : "text-chalk-100"
                      }`}
                    >
                      {co.name}
                    </p>
                    <p className="text-chalk-300/50 text-[10px]">{co.ticker}</p>
                  </Link>
                </td>

                {/* Score */}
                <td className="px-3 py-2.5 text-right">
                  <span
                    className={`num font-bold px-1.5 py-0.5 rounded text-xs ${scoreBg(co.final_score)}`}
                  >
                    {co.final_score.toFixed(1)}
                  </span>
                  {co.classification && (
                    <p
                      className={`text-[9px] mt-0.5 ${classificationStyle(co.classification)}`}
                    >
                      {co.classification}
                    </p>
                  )}
                </td>

                {/* CMP */}
                <td className="px-3 py-2.5 text-right num text-chalk-100 font-medium">
                  ₹{co.cmp.toLocaleString("en-IN")}
                </td>

                {/* Market Cap */}
                <td className="px-3 py-2.5 text-right num text-chalk-300/80">
                  {fmtMCap(co.raw.market_cap)}
                </td>

                {/* P/E */}
                <td className="px-3 py-2.5 text-right num text-chalk-100">
                  {co.raw.pe ? co.raw.pe.toFixed(1) : "—"}
                </td>

                {/* P/B */}
                <td className="px-3 py-2.5 text-right num text-chalk-300/80">
                  {co.raw.pbv ? co.raw.pbv.toFixed(1) : "—"}
                </td>

                {/* ROE — heatmap */}
                <td
                  className="px-3 py-2.5 text-right num text-chalk-100"
                  style={heatStyle(co.raw.roe, maxROE)}
                >
                  {co.raw.roe ? `${co.raw.roe.toFixed(1)}%` : "—"}
                </td>

                {/* ROCE — heatmap */}
                <td
                  className="px-3 py-2.5 text-right num text-chalk-100"
                  style={heatStyle(co.raw.roce, maxROCE)}
                >
                  {co.raw.roce ? `${co.raw.roce.toFixed(1)}%` : "—"}
                </td>

                {/* OPM — heatmap */}
                <td
                  className="px-3 py-2.5 text-right num text-chalk-100"
                  style={heatStyle(co.raw.opm, maxOPM)}
                >
                  {co.raw.opm ? `${co.raw.opm.toFixed(1)}%` : "—"}
                </td>

                {/* D/E — inverse heatmap (high = red) */}
                <td
                  className="px-3 py-2.5 text-right num text-chalk-100"
                  style={heatStyle(co.raw.debt_to_equity, maxDE, false)}
                >
                  {co.raw.debt_to_equity != null ? co.raw.debt_to_equity.toFixed(2) : "—"}
                </td>

                {/* Sales 5Y */}
                <td className="px-3 py-2.5 text-right" style={heatStyle(co.raw.sales_5y_cagr, maxSales5Y)}>
                  <Delta v={co.raw.sales_5y_cagr} />
                </td>

                {/* PAT 5Y */}
                <td className="px-3 py-2.5 text-right" style={heatStyle(co.raw.profit_5y_cagr, maxProfit5Y)}>
                  <Delta v={co.raw.profit_5y_cagr} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Legend */}
      <div className="px-4 py-2.5 border-t border-ink-700/30 flex flex-wrap gap-4 text-[10px] text-chalk-300/50 bg-ink-900/40">
        <span>Green cells = stronger than sector peers</span>
        <span>Red cells = higher debt</span>
        <span>Sorted by score ↓</span>
      </div>
    </div>
  );
}
