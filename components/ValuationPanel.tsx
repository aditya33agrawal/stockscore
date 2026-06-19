"use client";

import clsx from "clsx";
import { Tooltip } from "@/components/Tooltip";
import { TOOLTIPS } from "@/lib/tooltips";

interface Props {
  ratiosMap: Record<string, string>;
}

function parseNum(v: string | undefined): number | null {
  if (!v) return null;
  const n = parseFloat(v.replace(/[₹,%\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function parseHighLow(v: string | undefined): { high: number | null; low: number | null } {
  if (!v) return { high: null, low: null };
  const [h, l] = v.split("/").map((p) => parseNum(p));
  return { high: h ?? null, low: l ?? null };
}

const CAP_TIERS: [number, string][] = [
  [20000, "Large Cap"],
  [5000, "Mid Cap"],
  [500, "Small Cap"],
];

function marketCapTier(crores: number): string {
  for (const [floor, label] of CAP_TIERS) {
    if (crores >= floor) return label;
  }
  return "Micro Cap";
}

function Stat({
  label,
  value,
  tipKey,
}: {
  label: string;
  value: string | undefined;
  tipKey?: keyof typeof TOOLTIPS;
}) {
  if (value == null) return null;
  const tip = tipKey ? TOOLTIPS[tipKey] : undefined;
  return (
    <div>
      <p className="text-xs text-chalk-300/70 leading-tight flex items-center">
        {label}
        {tip && <Tooltip content={{ body: tip.body }} />}
      </p>
      <p className="num text-sm font-semibold text-chalk-100 mt-0.5">{value}</p>
    </div>
  );
}

export function ValuationPanel({ ratiosMap }: Props) {
  const price = parseNum(ratiosMap["Current Price"]);
  const { high, low } = parseHighLow(ratiosMap["High / Low"]);
  const stockPE = parseNum(ratiosMap["Stock P/E"]);
  const industryPE = parseNum(ratiosMap["Industry PE"]);
  const peg = parseNum(ratiosMap["PEG Ratio"]);
  const priceToBook = parseNum(ratiosMap["Price to book value"]);
  const bookValue = parseNum(ratiosMap["Book Value"]);
  const intrinsicValue = parseNum(ratiosMap["Intrinsic Value"]);
  const marketCap = parseNum(ratiosMap["Market Cap"]);
  const faceValue = parseNum(ratiosMap["Face Value"]);

  const pricePct =
    price != null && high != null && low != null && high > low
      ? Math.min(100, Math.max(0, ((price - low) / (high - low)) * 100))
      : null;

  const peDelta =
    stockPE != null && industryPE != null && industryPE !== 0
      ? ((stockPE - industryPE) / industryPE) * 100
      : null;

  const pegZone =
    peg == null ? null : peg < 1 ? "good" : peg <= 2 ? "warn" : "bad";

  const intrinsicDelta =
    price != null && intrinsicValue != null && intrinsicValue !== 0
      ? ((price - intrinsicValue) / intrinsicValue) * 100
      : null;

  const hasVisuals = pricePct != null || peDelta != null || peg != null || (priceToBook != null && bookValue != null);

  return (
    <div className="space-y-5">
      {hasVisuals && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 52-week price position */}
          {pricePct != null && (
            <div className="rounded-xl border border-ink-700/50 bg-ink-900/30 p-4">
              <p className="text-xs font-medium text-chalk-300/70 flex items-center mb-3">
                Price vs 52-Week Range
                <Tooltip content={{ body: TOOLTIPS.week52_range.body }} />
              </p>
              <div className="relative h-2 rounded-full bg-gradient-to-r from-bad/40 via-warn/40 to-good/40">
                <div
                  className="absolute -top-1.5 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-ink-950 bg-accent shadow"
                  style={{ left: `${pricePct}%` }}
                  title={`₹${price}`}
                />
              </div>
              <div className="flex justify-between mt-2 text-[11px] text-chalk-300/60">
                <span>Low ₹{low}</span>
                <span className="num font-semibold text-chalk-100">₹{price}</span>
                <span>High ₹{high}</span>
              </div>
            </div>
          )}

          {/* P/E vs Industry */}
          {stockPE != null && industryPE != null && (
            <div className="rounded-xl border border-ink-700/50 bg-ink-900/30 p-4">
              <p className="text-xs font-medium text-chalk-300/70 flex items-center mb-3">
                P/E vs Industry
                <Tooltip content={{ body: TOOLTIPS.pe.body }} />
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-chalk-300/60 w-14 shrink-0">Stock</span>
                  <div className="flex-1 h-2 rounded-full bg-ink-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${Math.min(100, (stockPE / Math.max(stockPE, industryPE)) * 100)}%` }}
                    />
                  </div>
                  <span className="num text-xs font-semibold text-chalk-100 w-12 text-right shrink-0">{stockPE.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-chalk-300/60 w-14 shrink-0">Industry</span>
                  <div className="flex-1 h-2 rounded-full bg-ink-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-chalk-300/40"
                      style={{ width: `${Math.min(100, (industryPE / Math.max(stockPE, industryPE)) * 100)}%` }}
                    />
                  </div>
                  <span className="num text-xs font-semibold text-chalk-100 w-12 text-right shrink-0">{industryPE.toFixed(1)}</span>
                </div>
              </div>
              {peDelta != null && (
                <p className={clsx("text-[11px] mt-2", peDelta < 0 ? "text-good" : "text-warn")}>
                  {peDelta < 0 ? "↓" : "↑"} {Math.abs(peDelta).toFixed(0)}% {peDelta < 0 ? "cheaper" : "pricier"} than industry
                </p>
              )}
            </div>
          )}

          {/* PEG ratio */}
          {peg != null && (
            <div className="rounded-xl border border-ink-700/50 bg-ink-900/30 p-4">
              <p className="text-xs font-medium text-chalk-300/70 flex items-center mb-3">
                PEG Ratio
                <Tooltip content={{ body: TOOLTIPS.peg_ratio.body }} />
              </p>
              <div className="relative h-2 rounded-full bg-gradient-to-r from-good/40 via-warn/40 to-bad/40">
                <div
                  className="absolute -top-1.5 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-ink-950 bg-accent shadow"
                  style={{ left: `${Math.min(100, (peg / 3) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-[11px] text-chalk-300/60">
                <span>0</span>
                <span className={clsx("num font-semibold", pegZone === "good" ? "text-good" : pegZone === "warn" ? "text-warn" : "text-bad")}>
                  {peg.toFixed(2)} {pegZone === "good" ? "· cheap" : pegZone === "warn" ? "· fair" : "· expensive"}
                </span>
                <span>3+</span>
              </div>
            </div>
          )}

          {/* Price to Book */}
          {priceToBook != null && bookValue != null && price != null && (
            <div className="rounded-xl border border-ink-700/50 bg-ink-900/30 p-4">
              <p className="text-xs font-medium text-chalk-300/70 flex items-center mb-3">
                Price vs Book Value
                <Tooltip content={{ body: TOOLTIPS.price_to_book.body }} />
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-chalk-300/60 w-16 shrink-0">Price</span>
                    <div className="flex-1 h-2 rounded-full bg-ink-800 overflow-hidden">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (price / Math.max(price, bookValue)) * 100)}%` }} />
                    </div>
                    <span className="num text-xs font-semibold text-chalk-100 w-16 text-right shrink-0">₹{price}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[11px] text-chalk-300/60 w-16 shrink-0">Book Value</span>
                    <div className="flex-1 h-2 rounded-full bg-ink-800 overflow-hidden">
                      <div className="h-full rounded-full bg-chalk-300/40" style={{ width: `${Math.min(100, (bookValue / Math.max(price, bookValue)) * 100)}%` }} />
                    </div>
                    <span className="num text-xs font-semibold text-chalk-100 w-16 text-right shrink-0">₹{bookValue}</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-chalk-300/60 mt-2">
                Trading at <span className="num font-semibold text-chalk-100">{priceToBook.toFixed(2)}×</span> book value
              </p>
            </div>
          )}
        </div>
      )}

      {intrinsicDelta != null && (
        <div className="rounded-xl border border-ink-700/50 bg-ink-900/30 p-4 flex items-center justify-between">
          <p className="text-xs font-medium text-chalk-300/70 flex items-center">
            Price vs Intrinsic Value (Graham Number)
            <Tooltip content={{ body: TOOLTIPS.intrinsic_value.body }} />
          </p>
          <p className={clsx("text-sm font-semibold num", intrinsicDelta < 0 ? "text-good" : "text-warn")}>
            {intrinsicDelta < 0 ? "↓" : "↑"} {Math.abs(intrinsicDelta).toFixed(0)}% {intrinsicDelta < 0 ? "below" : "above"}
          </p>
        </div>
      )}

      {(marketCap != null || faceValue != null) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Market Cap tier */}
          {marketCap != null && (
            <div className="rounded-xl border border-ink-700/50 bg-ink-900/30 p-4">
              <p className="text-xs font-medium text-chalk-300/70 flex items-center mb-3">
                Market Cap
                <Tooltip content={{ body: TOOLTIPS.market_cap.body }} />
              </p>
              <p className="num text-lg font-bold text-chalk-100">{ratiosMap["Market Cap"]}</p>
              <div className="grid grid-cols-4 gap-1 mt-3">
                {["Micro Cap", "Small Cap", "Mid Cap", "Large Cap"].map((tier) => (
                  <div
                    key={tier}
                    className={clsx(
                      "h-1.5 rounded-full",
                      marketCapTier(marketCap) === tier ? "bg-accent" : "bg-ink-800",
                    )}
                  />
                ))}
              </div>
              <p className="text-[11px] text-chalk-300/60 mt-2">
                <span className="font-semibold text-accent">{marketCapTier(marketCap)}</span> by size
              </p>
            </div>
          )}

          {/* Face value */}
          {faceValue != null && (
            <div className="rounded-xl border border-ink-700/50 bg-ink-900/30 p-4">
              <p className="text-xs font-medium text-chalk-300/70 flex items-center mb-3">
                Face Value
                <Tooltip content={{ body: TOOLTIPS.face_value.body }} />
              </p>
              <p className="num text-lg font-bold text-chalk-100">₹{faceValue}</p>
              {price != null && faceValue > 0 && (
                <p className="text-[11px] text-chalk-300/60 mt-2">
                  Current price is <span className="num font-semibold text-chalk-100">{(price / faceValue).toFixed(0)}×</span> the face value
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {!intrinsicDelta && ratiosMap["Intrinsic Value"] != null && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-4">
          <Stat label="Intrinsic Value" value={ratiosMap["Intrinsic Value"]} tipKey="intrinsic_value" />
        </div>
      )}
    </div>
  );
}
