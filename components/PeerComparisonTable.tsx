import type { CSSProperties } from "react";
import Link from "next/link";
import type { Company } from "@/lib/types";
import { classificationStyle, classificationLabel } from "@/lib/format";

interface Props {
  companies:   Company[];
  currentSlug: string;
  sectorSlug:  string;
}

function fmtMCap(v: number | undefined): string {
  if (!v) return "-";
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L Cr`;
  if (v >= 1000)   return `₹${(v / 1000).toFixed(0)}K Cr`;
  return `₹${v.toFixed(0)} Cr`;
}

function scorePill(score: number): string {
  if (score >= 80) return "bg-accent/15 text-accent";
  if (score >= 65) return "bg-accent/10 text-accent/80";
  if (score >= 50) return "bg-warn/15 text-warn";
  return "bg-bad/15 text-bad";
}

function heatStyle(value: number | undefined | null, max: number, isGood = true): CSSProperties {
  if (value == null || max === 0) return {};
  const pct = Math.min(Math.abs(value) / max, 1);
  if (!isGood) return { backgroundColor: `rgba(248, 113, 113, ${pct * 0.2})` };
  return { backgroundColor: `rgb(var(--accent) / ${pct * 0.14})` };
}

function Delta({ v }: { v: number | undefined | null }) {
  if (v == null) return <span className="text-chalk-300/30">-</span>;
  const sign = v >= 0 ? "+" : "";
  const cls  = v >= 15 ? "text-accent" : v >= 5 ? "text-accent/60" : v < 0 ? "text-bad" : "text-chalk-300/60";
  return <span className={`num ${cls}`}>{sign}{v.toFixed(0)}%</span>;
}

const TH = ({ children, title }: { children: React.ReactNode; title?: string }) => (
  <th
    className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-chalk-300/35 whitespace-nowrap"
    title={title}
  >
    {children}
  </th>
);

export function PeerComparisonTable({ companies, currentSlug, sectorSlug }: Props) {
  const sorted = [...companies].sort((a, b) => b.final_score - a.final_score);

  const maxROE      = Math.max(0, ...companies.map((c) => c.raw.roe      ?? 0));
  const maxROCE     = Math.max(0, ...companies.map((c) => c.raw.roce     ?? 0));
  const maxOPM      = Math.max(0, ...companies.map((c) => c.raw.opm      ?? 0));
  const maxDE       = Math.max(0, ...companies.map((c) => c.raw.debt_to_equity ?? 0));
  const maxProfit5Y = Math.max(0, ...companies.map((c) => Math.max(0, c.raw.profit_5y_cagr ?? 0)));
  const maxSales5Y  = Math.max(0, ...companies.map((c) => Math.max(0, c.raw.sales_5y_cagr  ?? 0)));

  return (
    <div className="glass border-subtle rounded-2xl overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-[rgb(var(--chalk-100)_/_0.05)] bg-[rgb(var(--accent)_/_0.03)]">
              <th className="sticky left-0 z-10 bg-[#070C1A] px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-chalk-300/35 whitespace-nowrap min-w-[160px] border-r border-[rgb(var(--chalk-100)_/_0.05)]">
                Company
              </th>
              <TH title="Fundamental score / 100">Score</TH>
              <TH>CMP</TH>
              <TH title="Market capitalisation">Mkt Cap</TH>
              <TH title="Price / Earnings">P/E</TH>
              <TH title="Price / Book value">P/B</TH>
              <TH title="Return on Equity">ROE %</TH>
              <TH title="Return on Capital Employed">ROCE %</TH>
              <TH title="Operating Profit Margin">OPM %</TH>
              <TH title="Debt to Equity - lower is better">D/E</TH>
              <TH title="5-year Sales CAGR">Sales 5Y</TH>
              <TH title="5-year Profit CAGR">PAT 5Y</TH>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgb(var(--chalk-100)_/_0.03)]">
            {sorted.map((co) => {
              const isCurrent = co.slug === currentSlug;
              return (
                <tr
                  key={co.slug}
                  className={`
                    hover:bg-[rgb(var(--accent)_/_0.03)] transition-colors
                    ${isCurrent ? "border-l-2 border-l-accent bg-accent/[0.03]" : ""}
                  `}
                >
                  {/* Company name */}
                  <td className={`sticky left-0 z-10 px-4 py-3 border-r border-[rgb(var(--chalk-100)_/_0.04)] ${isCurrent ? "bg-ink-900" : "bg-ink-950"}`}>
                    <Link href={`/sector/${sectorSlug}/${co.slug}`} className="group">
                      <p className={`font-semibold truncate max-w-[148px] transition-colors ${isCurrent ? "text-accent" : "text-chalk-50 group-hover:text-accent"}`}>
                        {co.name}
                      </p>
                      <p className="num text-chalk-300/35 text-[10px] mt-0.5">{co.ticker}</p>
                    </Link>
                  </td>

                  {/* Score */}
                  <td className="px-3 py-3 text-right">
                    <span className={`num font-bold px-1.5 py-0.5 rounded-md text-xs ${scorePill(co.final_score)}`}>
                      {co.final_score.toFixed(1)}
                    </span>
                    {co.classification && (
                      <p className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${
                        classificationStyle(co.classification).split(" ").find(c => c.startsWith("text-")) ?? "text-chalk-300/40"
                      }`}>
                        {classificationLabel(co.classification)}
                      </p>
                    )}
                  </td>

                  <td className="px-3 py-3 text-right num text-chalk-100 font-medium">
                    ₹{co.cmp.toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-3 text-right num text-chalk-300/60">
                    {fmtMCap(co.raw.market_cap)}
                  </td>
                  <td className="px-3 py-3 text-right num text-chalk-100">
                    {co.raw.pe ? co.raw.pe.toFixed(1) : "-"}
                  </td>
                  <td className="px-3 py-3 text-right num text-chalk-300/70">
                    {co.raw.pbv ? co.raw.pbv.toFixed(1) : "-"}
                  </td>
                  <td className="px-3 py-3 text-right num text-chalk-100" style={heatStyle(co.raw.roe, maxROE)}>
                    {co.raw.roe ? `${co.raw.roe.toFixed(1)}%` : "-"}
                  </td>
                  <td className="px-3 py-3 text-right num text-chalk-100" style={heatStyle(co.raw.roce, maxROCE)}>
                    {co.raw.roce ? `${co.raw.roce.toFixed(1)}%` : "-"}
                  </td>
                  <td className="px-3 py-3 text-right num text-chalk-100" style={heatStyle(co.raw.opm, maxOPM)}>
                    {co.raw.opm ? `${co.raw.opm.toFixed(1)}%` : "-"}
                  </td>
                  <td className="px-3 py-3 text-right num text-chalk-100" style={heatStyle(co.raw.debt_to_equity, maxDE, false)}>
                    {co.raw.debt_to_equity != null ? co.raw.debt_to_equity.toFixed(2) : "-"}
                  </td>
                  <td className="px-3 py-3 text-right" style={heatStyle(co.raw.sales_5y_cagr, maxSales5Y)}>
                    <Delta v={co.raw.sales_5y_cagr} />
                  </td>
                  <td className="px-3 py-3 text-right" style={heatStyle(co.raw.profit_5y_cagr, maxProfit5Y)}>
                    <Delta v={co.raw.profit_5y_cagr} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-4 py-2.5 border-t border-[rgb(var(--chalk-100)_/_0.04)] flex flex-wrap gap-4 text-[10px] text-chalk-300/30 bg-[rgb(var(--accent)_/_0.02)]">
        <span>Cyan cells = stronger than sector peers</span>
        <span>Red cells = higher debt</span>
        <span>Sorted by score ↓</span>
      </div>
    </div>
  );
}
