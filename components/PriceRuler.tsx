import type { CSSProperties } from "react";

interface Props {
  cmp:     number;
  dma50?:  number;
  dma200?: number;
  high52w?: number | null;
  low52w?:  number | null;
}

function toPos(v: number, min: number, max: number): number {
  if (max === min) return 50;
  return Math.max(3, Math.min(97, ((v - min) / (max - min)) * 100));
}

function fmtPrice(v: number): string {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)   return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

interface MarkerProps {
  pos:    number;
  label:  string;
  value:  string;
  color:  string;
  isCmp?: boolean;
  style?: CSSProperties;
}

function Marker({ pos, label, value, color, isCmp, style }: MarkerProps) {
  return (
    <div
      className="absolute -translate-x-1/2 flex flex-col items-center"
      style={{ left: `${pos}%`, ...style }}
    >
      {isCmp ? (
        <div
          className="w-3.5 h-3.5 rounded-full border-2 border-ink-950 shadow-lg"
          style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}70` }}
        />
      ) : (
        <div className="w-px h-3" style={{ backgroundColor: color, opacity: 0.5 }} />
      )}
      <p className="text-[10px] font-semibold whitespace-nowrap mt-0.5 num" style={{ color }}>
        {value}
      </p>
      <p className="text-[9px] whitespace-nowrap" style={{ color, opacity: 0.6 }}>
        {label}
      </p>
    </div>
  );
}

export function PriceRuler({ cmp, dma50, dma200, high52w, low52w }: Props) {
  const all = [cmp, dma50, dma200, high52w, low52w].filter(
    (v): v is number => v != null && v > 0
  );
  if (all.length < 2) return null;

  const rawMin = Math.min(...all);
  const rawMax = Math.max(...all);
  const pad    = (rawMax - rawMin) * 0.08 || rawMin * 0.05;
  const min    = rawMin - pad;
  const max    = rawMax + pad;

  const cmpPos  = toPos(cmp, min, max);
  const d50Pos  = dma50  != null ? toPos(dma50,  min, max) : null;
  const d200Pos = dma200 != null ? toPos(dma200, min, max) : null;

  const leftZoneEnd    = d200Pos ?? d50Pos ?? 50;
  const midZoneStart   = d200Pos != null && d50Pos != null ? Math.min(d200Pos, d50Pos) : leftZoneEnd;
  const midZoneEnd     = d200Pos != null && d50Pos != null ? Math.max(d200Pos, d50Pos) : leftZoneEnd;
  const rightZoneStart = d50Pos  ?? d200Pos ?? 50;

  return (
    <div className="glass border-subtle rounded-2xl p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-chalk-300/35 mb-6">
        Price Position
      </p>

      {/* Track */}
      <div className="relative mx-2">
        <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: "rgb(var(--chalk-100)/0.05)" }}>
          {/* Red zone: below lower DMA */}
          <div
            className="absolute top-0 left-0 h-full"
            style={{ width: `${leftZoneEnd}%`, background: "rgba(248,113,113,0.3)" }}
          />
          {/* Amber zone: between DMAs */}
          {d200Pos != null && d50Pos != null && (
            <div
              className="absolute top-0 h-full"
              style={{
                left:  `${midZoneStart}%`,
                width: `${midZoneEnd - midZoneStart}%`,
                background: "rgba(245,158,11,0.3)",
              }}
            />
          )}
          {/* Cyan zone: above upper DMA */}
          <div
            className="absolute top-0 right-0 h-full"
            style={{ left: `${rightZoneStart}%`, background: "rgb(var(--accent)/0.3)" }}
          />
        </div>

        {/* CMP dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-ink-950 z-10"
          style={{
            left: `${cmpPos}%`,
            backgroundColor: "#6D8196",
            boxShadow: "0 0 12px rgb(var(--accent)/0.6)",
          }}
        />
      </div>

      {/* Labels — staggered vertically to avoid overlap when markers cluster */}
      <div className="relative h-20 mx-2 mt-1.5 overflow-visible">
        {(() => {
          const markers = [
            low52w  != null ? { pos: toPos(low52w,  min, max), label: "52wL", value: fmtPrice(low52w),  color: "#4A6080" } : null,
            dma200  != null && d200Pos != null ? { pos: d200Pos, label: "200D", value: fmtPrice(dma200), color: "#B0524E" } : null,
            dma50   != null && d50Pos  != null ? { pos: d50Pos,  label: "50D",  value: fmtPrice(dma50),  color: "#B8862B" } : null,
            { pos: cmpPos, label: "CMP", value: fmtPrice(cmp), color: "#6D8196", isCmp: true },
            high52w != null ? { pos: toPos(high52w, min, max), label: "52wH", value: fmtPrice(high52w), color: "#4A6080" } : null,
          ].filter((m): m is NonNullable<typeof m> => m !== null);

          // Sort by position, then assign tiered top offsets so neighbours don't overlap.
          const ordered = markers
            .map((m, i) => ({ ...m, origIndex: i }))
            .sort((a, b) => a.pos - b.pos);

          // Greedy lane assignment: 3 lanes (0, 30, 60 px) — push to next lane if too close to last in lane.
          const MIN_GAP = 11; // percent of width before labels visually collide
          const lanes: number[] = [-Infinity, -Infinity, -Infinity];
          const topByOrig: Record<number, number> = {};
          for (const m of ordered) {
            let lane = 0;
            for (let li = 0; li < lanes.length; li++) {
              if (m.pos - lanes[li] >= MIN_GAP) { lane = li; break; }
              if (li === lanes.length - 1) lane = li;
            }
            lanes[lane] = m.pos;
            topByOrig[m.origIndex] = lane * 26;
          }

          return markers.map((m, i) => (
            <Marker
              key={m.label}
              pos={m.pos}
              label={m.label}
              value={m.value}
              color={m.color}
              isCmp={m.isCmp}
              style={{ top: `${topByOrig[i]}px` }}
            />
          ));
        })()}
      </div>

      {/* Quick stats */}
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-chalk-300/40 border-t border-[rgb(var(--chalk-100)_/_0.05)] pt-3 num">
        {dma50 != null && (
          <span>
            vs 50D:{" "}
            <span className={`font-semibold ${cmp > dma50 ? "text-accent" : "text-bad"}`}>
              {cmp > dma50 ? "+" : ""}{(((cmp - dma50)   / dma50)   * 100).toFixed(1)}%
            </span>
          </span>
        )}
        {dma200 != null && (
          <span>
            vs 200D:{" "}
            <span className={`font-semibold ${cmp > dma200 ? "text-accent" : "text-bad"}`}>
              {cmp > dma200 ? "+" : ""}{(((cmp - dma200) / dma200) * 100).toFixed(1)}%
            </span>
          </span>
        )}
        {high52w != null && (
          <span>
            vs 52wH:{" "}
            <span className="font-semibold text-chalk-300/60">
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
