"use client";

import clsx from "clsx";
import { Tooltip } from "@/components/Tooltip";
import { TOOLTIPS } from "@/lib/tooltips";

interface Props {
  ratiosMap: Record<string, string>;
}

function parseNum(v: string | undefined): number | null {
  if (!v) return null;
  const n = parseFloat(v.replace(/[₹,%\s]/g, "").replace(/Cr\.?/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Screener.in's ratio-strip labels are inconsistent in casing across companies - try a few spellings. */
function pick(ratiosMap: Record<string, string>, candidates: string[]): string | undefined {
  for (const c of candidates) {
    if (ratiosMap[c] != null) return ratiosMap[c];
    const hit = Object.keys(ratiosMap).find((k) => k.toLowerCase() === c.toLowerCase());
    if (hit) return ratiosMap[hit];
  }
  return undefined;
}

function GaugeBar({
  label,
  value,
  unit = "%",
  max,
  zones, // ascending thresholds: [goodMin, warnMin] - value >= goodMin -> good, >= warnMin -> warn, else bad
  invert = false, // true when lower values are better (e.g. debt/equity, CV, pledge)
  tip,
}: {
  label: string;
  value: number | null;
  unit?: string;
  max: number;
  zones: [number, number];
  invert?: boolean;
  tip?: string;
}) {
  if (value == null) return null;
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const [goodMin, warnMin] = zones;
  const zone = invert
    ? value <= goodMin ? "good" : value <= warnMin ? "warn" : "bad"
    : value >= goodMin ? "good" : value >= warnMin ? "warn" : "bad";
  return (
    <div className="rounded-xl border border-ink-700/50 bg-ink-900/30 p-4">
      <p className="text-xs font-medium text-chalk-300/70 flex items-center mb-3">
        {label}
        {tip && <Tooltip content={{ body: tip }} />}
      </p>
      <div
        className={clsx(
          "relative h-2 rounded-full bg-gradient-to-r",
          invert ? "from-good/40 via-warn/40 to-bad/40" : "from-bad/40 via-warn/40 to-good/40",
        )}
      >
        <div
          className="absolute -top-1.5 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-ink-950 bg-accent shadow"
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-[11px] text-chalk-300/60">
        <span>0{unit}</span>
        <span className={clsx("num font-semibold", zone === "good" ? "text-good" : zone === "warn" ? "text-warn" : "text-bad")}>
          {value.toFixed(unit === "%" ? 1 : 2)}{unit}
        </span>
        <span>{max}{unit}+</span>
      </div>
    </div>
  );
}

function CompareBars({
  label,
  rows,
  unit = "",
  tip,
  note,
}: {
  label: string;
  rows: { name: string; value: number }[];
  unit?: string;
  tip?: string;
  note?: { text: string; tone: "good" | "warn" | "bad" };
}) {
  const maxVal = Math.max(...rows.map((r) => r.value), 0.0001);
  return (
    <div className="rounded-xl border border-ink-700/50 bg-ink-900/30 p-4">
      <p className="text-xs font-medium text-chalk-300/70 flex items-center mb-3">
        {label}
        {tip && <Tooltip content={{ body: tip }} />}
      </p>
      <div className="space-y-1.5">
        {rows.map((r, i) => (
          <div key={r.name} className="flex items-center gap-2">
            <span className="text-[11px] text-chalk-300/60 w-20 shrink-0 truncate">{r.name}</span>
            <div className="flex-1 h-2 rounded-full bg-ink-800 overflow-hidden">
              <div
                className={clsx("h-full rounded-full", i === 0 ? "bg-accent" : "bg-chalk-300/40")}
                style={{ width: `${Math.min(100, (r.value / maxVal) * 100)}%` }}
              />
            </div>
            <span className="num text-xs font-semibold text-chalk-100 w-16 text-right shrink-0">
              {r.value.toFixed(unit === "%" ? 1 : 0)}{unit}
            </span>
          </div>
        ))}
      </div>
      {note && (
        <p className={clsx("text-[11px] mt-2", note.tone === "good" ? "text-good" : note.tone === "warn" ? "text-warn" : "text-bad")}>
          {note.text}
        </p>
      )}
    </div>
  );
}

export function ReturnsPanel({ ratiosMap }: Props) {
  const roe = parseNum(ratiosMap["ROE"]);
  const roce = parseNum(ratiosMap["ROCE"]);
  const roce5y = parseNum(ratiosMap["ROCE 5Yr"]);
  const divYield = parseNum(ratiosMap["Dividend Yield"]);
  const profitVar = parseNum(ratiosMap["Profit Var 10Yrs"]);
  const salesVar = parseNum(ratiosMap["Sales Var 10Yrs"]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <GaugeBar label="Return on Equity (ROE)" value={roe} max={40} zones={[18, 10]} tip={TOOLTIPS.roe.body as string} />
      <GaugeBar label="Return on Capital Employed (ROCE)" value={roce} max={40} zones={[20, 12]} tip={TOOLTIPS.roce.body as string} />
      {roce5y != null && (
        <GaugeBar label="ROCE (5yr average)" value={roce5y} max={40} zones={[20, 12]} tip="Average ROCE over the last 5 years - smooths out one-off swings to show the durable level of capital efficiency." />
      )}
      <GaugeBar label="Dividend Yield" value={divYield} max={6} zones={[3, 1]} tip={TOOLTIPS.dividend_yield.body as string} />
      {profitVar != null && (
        <GaugeBar
          label="Profit Variability (10yr)"
          value={profitVar}
          max={60}
          zones={[15, 30]}
          invert
          tip="Coefficient of variation of profit over 10 years - how 'lumpy' earnings are. Lower means steadier, more predictable profit growth."
        />
      )}
      {salesVar != null && (
        <GaugeBar
          label="Sales Variability (10yr)"
          value={salesVar}
          max={60}
          zones={[15, 30]}
          invert
          tip="Coefficient of variation of revenue over 10 years. Lower means more consistent, predictable sales growth year to year."
        />
      )}
    </div>
  );
}

export function LeveragePanel({ ratiosMap }: Props) {
  const de = parseNum(ratiosMap["Debt to equity"]);
  const pledged = parseNum(ratiosMap["Pledged percentage"]);
  const debt = parseNum(ratiosMap["Debt"]);
  const secured = parseNum(ratiosMap["Secured loan"]);
  const unsecured = parseNum(ratiosMap["Unsecured loan"]);
  const debt5y = parseNum(ratiosMap["Debt 5Years back"]);
  const debt10y = parseNum(ratiosMap["Debt 10Years back"]);

  const hasDebtTrend = debt != null && (debt5y != null || debt10y != null);
  const hasSecuredSplit = secured != null && unsecured != null && (secured > 0 || unsecured > 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <GaugeBar label="Debt to Equity" value={de} unit="x" max={2} zones={[0.5, 1.5]} invert tip={TOOLTIPS.debt_to_equity.body as string} />
      <GaugeBar label="Pledged Shares" value={pledged} max={25} zones={[5, 15]} invert tip={TOOLTIPS.pledged_pct.body as string} />
      {hasDebtTrend && (
        <CompareBars
          label="Total Debt Over Time"
          unit=" Cr"
          tip="Total borrowings now vs 5/10 years ago. A shrinking or flat trend means the company is funding growth without piling on debt."
          rows={[
            { name: "Now", value: debt! },
            ...(debt5y != null ? [{ name: "5yr ago", value: debt5y }] : []),
            ...(debt10y != null ? [{ name: "10yr ago", value: debt10y }] : []),
          ]}
        />
      )}
      {hasSecuredSplit && (
        <CompareBars
          label="Secured vs Unsecured Debt"
          unit=" Cr"
          tip="Secured loans are backed by collateral (lower lender risk, usually cheaper); unsecured loans rely purely on creditworthiness. A high unsecured share can mean costlier refinancing in a downturn."
          rows={[
            { name: "Secured", value: secured! },
            { name: "Unsecured", value: unsecured! },
          ]}
        />
      )}
    </div>
  );
}

export function OwnershipLiquidityPanel({ ratiosMap }: Props) {
  const currentRatio = parseNum(pick(ratiosMap, ["Current Ratio", "Current ratio"]));
  const promoterHolding = parseNum(pick(ratiosMap, ["Promoter holding", "Promoter Holding"]));

  if (currentRatio == null && promoterHolding == null) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {currentRatio != null && (
        <GaugeBar
          label="Current Ratio"
          value={currentRatio}
          unit="x"
          max={3}
          zones={[1.5, 1]}
          tip={TOOLTIPS.current_ratio.body as string}
        />
      )}
      {promoterHolding != null && (
        <GaugeBar
          label="Promoter Holding"
          value={promoterHolding}
          max={100}
          zones={[50, 30]}
          tip={TOOLTIPS.promoter_holding.body as string}
        />
      )}
    </div>
  );
}

export function TechnicalsPanel({ ratiosMap }: Props) {
  const dma50 = parseNum(ratiosMap["DMA 50"]);
  const dma200 = parseNum(ratiosMap["DMA 200"]);
  const downFromHigh = parseNum(ratiosMap["Down from 52w high"]);
  const upFromLow = parseNum(ratiosMap["Up from 52w low"]);

  const goldenCross = dma50 != null && dma200 != null && dma50 > dma200;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {dma50 != null && dma200 != null && (
        <CompareBars
          label="50-Day vs 200-Day Moving Average"
          unit=""
          tip={TOOLTIPS.dma.body as string}
          rows={[
            { name: "DMA 50", value: dma50 },
            { name: "DMA 200", value: dma200 },
          ]}
          note={{
            text: goldenCross ? "Golden cross - 50DMA above 200DMA, a bullish trend structure" : "50DMA below 200DMA - trend is weak or bearish",
            tone: goldenCross ? "good" : "warn",
          }}
        />
      )}
      {downFromHigh != null && (
        <GaugeBar
          label="Down From 52-Week High"
          value={downFromHigh}
          max={50}
          zones={[10, 25]}
          invert
          tip={TOOLTIPS.week52_range.body as string}
        />
      )}
      {upFromLow != null && (
        <GaugeBar
          label="Up From 52-Week Low"
          value={upFromLow}
          max={100}
          zones={[40, 15]}
          tip={TOOLTIPS.week52_range.body as string}
        />
      )}
    </div>
  );
}
