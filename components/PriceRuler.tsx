import type { CSSProperties } from "react";

interface Props {
  cmp: number;
  dma50?: number;
  dma200?: number;
  high52w?: number | null;
  low52w?: number | null;
}

function toPos(v: number, min: number, max: number): number {
  if (max === min) return 50;
  return Math.max(3, Math.min(97, ((v - min) / (max - min)) * 100));
}

function fmtPrice(v: number): string {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

interface MarkerProps {
  pos: number;
  label: string;
  value: string;
  color: string;
  isCmp?: boolean;
  style?: CSSProperties;
}

function Marker({ pos, label, value, color, isCmp, style }: MarkerProps) {
  return (
    <div
      className="absolute -translate-x-1/2 flex flex-col items-center"
      style={{ left: `${pos}%`, ...style }}
    >
      {/* Tick line */}
      {isCmp ? (
        <div
          className="w-3 h-3 rounded-full border-2 border-ink-900 shadow-lg mb-0"
          style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}60` }}
        />
      ) : (
        <div className="w-px h-3" style={{ backgroundColor: color, opacity: 0.6 }} />
      )}
      {/* Value label */}
      <p className="text-[10px] font-semibold whitespace-nowrap mt-0.5" style={{ color }}>
        {value}
      </p>
      <p className="text-[9px] whitespace-nowrap" style={{ color, opacity: 0.7 }}>
        {label}
      </p>
    </div>
  );
}

export function PriceRuler({ cmp, dma50, dma200, high52w, low52w }: Props) {
  // Collect all available values
  const all = [cmp, dma50, dma200, high52w, low52w].filter(
    (v): v is number => v != null && v > 0
  );
  if (all.length < 2) return null;

  const rawMin = Math.min(...all);
  const rawMax = Math.max(...all);
  // 8% padding so extreme markers don't get clipped
  const pad = (rawMax - rawMin) * 0.08 || rawMin * 0.05;
  const min = rawMin - pad;
  const max = rawMax + pad;

  const cmpPos = toPos(cmp, min, max);
  const d50Pos = dma50 != null ? toPos(dma50, min, max) : null;
  const d200Pos = dma200 != null ? toPos(dma200, min, max) : null;

  // Colour zones on the track (below 200DMA=red, between=amber, above 50DMA=green)
  const leftZoneEnd = d200Pos ?? d50Pos ?? 50;
  const midZoneStart = d200Pos != null && d50Pos != null ? Math.min(d200Pos, d50Pos) : leftZoneEnd;
  const midZoneEnd = d200Pos != null && d50Pos != null ? Math.max(d200Pos, d50Pos) : leftZoneEnd;
  const rightZoneStart = d50Pos ?? d200Pos ?? 50;

  return (
    <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-chalk-300/60 mb-5">
        Price Position
      </p>

      {/* ── Track ── */}
      <div className="relative mx-2">
        {/* The coloured track bar */}
        <div className="relative h-2 rounded-full overflow-hidden bg-ink-700/50">
          {/* Red: below the lower DMA */}
          <div
            className="absolute top-0 left-0 h-full"
            style={{ width: `${leftZoneEnd}%`, backgroundColor: "rgba(248,113,113,0.35)" }}
          />
          {/* Amber: between DMAs */}
          {d200Pos != null && d50Pos != null && (
            <div
              className="absolute top-0 h-full"
              style={{
                left: `${midZoneStart}%`,
                width: `${midZoneEnd - midZoneStart}%`,
                backgroundColor: "rgba(245,158,11,0.35)",
              }}
            />
          )}
          {/* Green: above the higher DMA */}
          <div
            className="absolute top-0 right-0 h-full"
            style={{ left: `${rightZoneStart}%`, backgroundColor: "rgba(16,185,129,0.35)" }}
          />
        </div>

        {/* CMP indicator dot on track */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-ink-900 z-10"
          style={{
            left: `${cmpPos}%`,
            backgroundColor: "#10B981",
            boxShadow: "0 0 10px rgba(16,185,129,0.5)",
          }}
        />
      </div>

      {/* ── Labels below track ── */}
      <div className="relative h-14 mx-2 mt-1.5">
        {low52w != null && (
          <Marker
            pos={toPos(low52w, min, max)}
            label="52wL"
            value={fmtPrice(low52w)}
            color="#64748B"
          />
        )}
        {dma200 != null && d200Pos != null && (
          <Marker
            pos={d200Pos}
            label="200D"
            value={fmtPrice(dma200)}
            color="#F87171"
          />
        )}
        {dma50 != null && d50Pos != null && (
          <Marker
            pos={d50Pos}
            label="50D"
            value={fmtPrice(dma50)}
            color="#F59E0B"
          />
        )}
        <Marker
          pos={cmpPos}
          label="CMP"
          value={fmtPrice(cmp)}
          color="#10B981"
          isCmp
        />
        {high52w != null && (
          <Marker
            pos={toPos(high52w, min, max)}
            label="52wH"
            value={fmtPrice(high52w)}
            color="#64748B"
          />
        )}
      </div>

      {/* ── Quick stats row ── */}
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-chalk-300/70 border-t border-ink-700/30 pt-3">
        {dma50 != null && (
          <span>
            vs 50D:{" "}
            <span
              className={`font-semibold ${
                cmp > dma50 ? "text-accent" : "text-bad"
              }`}
            >
              {cmp > dma50 ? "+" : ""}
              {(((cmp - dma50) / dma50) * 100).toFixed(1)}%
            </span>
          </span>
        )}
        {dma200 != null && (
          <span>
            vs 200D:{" "}
            <span
              className={`font-semibold ${
                cmp > dma200 ? "text-accent" : "text-bad"
              }`}
            >
              {cmp > dma200 ? "+" : ""}
              {(((cmp - dma200) / dma200) * 100).toFixed(1)}%
            </span>
          </span>
        )}
        {high52w != null && (
          <span>
            vs 52wH:{" "}
            <span className="font-semibold text-chalk-300">
              {(((cmp - high52w) / high52w) * 100).toFixed(1)}%
            </span>
          </span>
        )}
        {low52w != null && (
          <span>
            vs 52wL:{" "}
            <span className="font-semibold text-accent">
              +{(((cmp - low52w) / low52w) * 100).toFixed(1)}%
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
