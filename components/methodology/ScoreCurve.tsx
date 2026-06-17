"use client";

type CurveType = "logistic" | "linUp" | "linDown" | "band";

interface Props {
  type: CurveType;
  /** For logistic: [x0_norm, hw_norm] both in [0,1] space */
  params?: number[];
  label?: string;
  xLabel?: string;
  yLabel?: string;
  midLabel?: string;
}

const W = 200;
const H = 72;
const PAD = { t: 6, r: 6, b: 20, l: 28 };
const IW = W - PAD.l - PAD.r;
const IH = H - PAD.t - PAD.b;

function logistic(x: number, x0: number, hw: number) {
  const k = Math.log(9) / hw;
  return 1 / (1 + Math.exp(-k * (x - x0)));
}

function buildPoints(type: CurveType, params: number[] = []) {
  const pts: [number, number][] = [];
  const n = 80;

  if (type === "logistic") {
    const [x0 = 0.5, hw = 0.2] = params;
    for (let i = 0; i <= n; i++) {
      const x = i / n;
      pts.push([x, logistic(x, x0, hw)]);
    }
  } else if (type === "linUp") {
    pts.push([0, 0], [0, 0], [1, 1], [1, 1]);
  } else if (type === "linDown") {
    pts.push([0, 1], [0, 1], [1, 0], [1, 0]);
  } else if (type === "band") {
    // band(0, 0.2, 0.6, 0.85, 1) style - goldilocks
    pts.push([0, 0], [0.2, 1], [0.6, 1], [0.85, 0], [1, 0]);
  }

  return pts;
}

function toSvg(pts: [number, number][]) {
  return pts
    .map(([x, y], i) => {
      const sx = PAD.l + x * IW;
      const sy = PAD.t + (1 - y) * IH;
      return `${i === 0 ? "M" : "L"}${sx.toFixed(1)},${sy.toFixed(1)}`;
    })
    .join(" ");
}

const CURVE_COLOR: Record<CurveType, string> = {
  logistic: "rgb(var(--accent))",
  linUp: "rgb(var(--good))",
  linDown: "rgb(var(--bad))",
  band: "rgb(var(--warn))",
};

export function ScoreCurve({ type, params, label, xLabel, yLabel, midLabel }: Props) {
  const pts = buildPoints(type, params);
  const d = toSvg(pts);
  const color = CURVE_COLOR[type];

  // Midpoint marker for logistic
  const [x0 = 0.5] = params ?? [];
  const mx = PAD.l + x0 * IW;
  const my = PAD.t + 0.5 * IH;

  return (
    <figure className="flex flex-col items-center gap-1">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        className="w-full max-w-[200px]"
        aria-label={label ?? type}
      >
        {/* Axes */}
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + IH} stroke="rgb(var(--ink-700))" strokeWidth="1" />
        <line x1={PAD.l} y1={PAD.t + IH} x2={PAD.l + IW} y2={PAD.t + IH} stroke="rgb(var(--ink-700))" strokeWidth="1" />

        {/* 50% gridline */}
        <line
          x1={PAD.l} y1={PAD.t + IH * 0.5}
          x2={PAD.l + IW} y2={PAD.t + IH * 0.5}
          stroke="rgb(var(--ink-700))" strokeWidth="0.5" strokeDasharray="3 3"
        />

        {/* Curve */}
        <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Area fill */}
        <path
          d={`${d} L${(PAD.l + IW).toFixed(1)},${(PAD.t + IH).toFixed(1)} L${PAD.l},${(PAD.t + IH).toFixed(1)} Z`}
          fill={color} fillOpacity="0.08"
        />

        {/* Midpoint dot for logistic */}
        {type === "logistic" && (
          <>
            <circle cx={mx} cy={my} r="3" fill={color} fillOpacity="0.7" />
            <line x1={mx} y1={PAD.t} x2={mx} y2={PAD.t + IH} stroke={color} strokeWidth="0.5" strokeDasharray="3 2" strokeOpacity="0.5" />
          </>
        )}

        {/* Y axis labels */}
        <text x={PAD.l - 4} y={PAD.t + 4} fill="rgb(var(--chalk-300))" fontSize="8" textAnchor="end" opacity="0.6">1</text>
        <text x={PAD.l - 4} y={PAD.t + IH * 0.5 + 3} fill="rgb(var(--chalk-300))" fontSize="8" textAnchor="end" opacity="0.6">.5</text>
        <text x={PAD.l - 4} y={PAD.t + IH + 1} fill="rgb(var(--chalk-300))" fontSize="8" textAnchor="end" opacity="0.6">0</text>

        {/* X axis labels */}
        {xLabel && (
          <text x={PAD.l + IW} y={H - 3} fill="rgb(var(--chalk-300))" fontSize="8" textAnchor="end" opacity="0.55">{xLabel}</text>
        )}

        {/* Midpoint label */}
        {midLabel && type === "logistic" && (
          <text x={mx} y={H - 3} fill={color} fontSize="7.5" textAnchor="middle" opacity="0.75">{midLabel}</text>
        )}
      </svg>
      {label && (
        <p className="text-[10px] text-chalk-300/60 font-mono">{label}</p>
      )}
    </figure>
  );
}
