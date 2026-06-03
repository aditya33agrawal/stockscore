"use client";

import { useEffect, useRef, useState } from "react";

interface Candle {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}
interface IndicatorPoint {
  t: string;
  v: number;
}
interface ChartPayload {
  symbol: string;
  source: "yahoo" | "nse";
  range: string;
  fetched_at: string;
  candles: Candle[];
}

function sma(candles: Candle[], period: number): IndicatorPoint[] {
  const out: IndicatorPoint[] = [];
  if (candles.length < period) return out;
  let sum = 0;
  for (let i = 0; i < candles.length; i++) {
    sum += candles[i].c;
    if (i >= period) sum -= candles[i - period].c;
    if (i >= period - 1) out.push({ t: candles[i].t, v: sum / period });
  }
  return out;
}

// Ink Wash overlay colors — chosen to read on both Paper (#FFFFE3) and
// Ink-Night (#1E1F21). Slate is the brand line; SMAs use distinct hues that
// are deliberately NOT green/red (those are reserved for value verdicts).
const PRICE_COLOR = "#6D8196";  // slate — brand
const SMA50_COLOR = "#B8862B";  // amber
const SMA100_COLOR = "#7C3AED"; // violet
const SMA200_COLOR = "#9A8C7C"; // warm taupe (reads on paper + ink-night)

// Read a `--token` (space-separated RGB triple) from :root → legacy "rgba(r, g, b, a)".
// Falls back to a neutral gray when called before mount / SSR.
// Note: lightweight-charts cannot parse CSS Color 4 "rgb(r g b / a)" syntax.
function cssRgb(token: string, alpha = 1): string {
  if (typeof document === "undefined") return `rgba(120,120,120,${alpha})`;
  const v = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  if (!v) return `rgba(120,120,120,${alpha})`;
  const parts = v.split(/\s+/);
  if (parts.length === 3) return `rgba(${parts[0]},${parts[1]},${parts[2]},${alpha})`;
  return `rgba(120,120,120,${alpha})`;
}

function fmt(n: number | undefined): string {
  if (n === undefined || !Number.isFinite(n)) return "—";
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

type LWChart = {
  remove: () => void;
  timeScale: () => {
    getVisibleLogicalRange: () => { from: number; to: number } | null;
    setVisibleLogicalRange: (r: { from: number; to: number }) => void;
    fitContent: () => void;
  };
};

export function PriceChart({ symbol }: { symbol: string }) {
  const priceRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<LWChart | null>(null);
  const [payload, setPayload] = useState<ChartPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState<{
    date: string;
    price?: number;
    sma50?: number;
    sma100?: number;
    sma200?: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/charts/${encodeURIComponent(symbol)}`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error("No chart data yet — run `npm run refresh:charts`.");
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((p: ChartPayload) => {
        if (!cancelled) setPayload(p);
      })
      .catch((err) => {
        if (!cancelled) setError(String(err.message ?? err));
      });
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  useEffect(() => {
    if (!payload || !priceRef.current) return;

    let priceChart: LWChart | null = null;

    (async () => {
      const lib = await import("lightweight-charts");
      const { createChart, ColorType, CrosshairMode, LineStyle } = lib;

      const candles = payload.candles;
      const sma50 = sma(candles, 50);
      const sma100 = sma(candles, 100);
      const sma200 = sma(candles, 200);

      priceChart = createChart(priceRef.current!, {
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: cssRgb("--chalk-300"),
          fontFamily: "ui-sans-serif, system-ui",
          attributionLogo: false,
        },
        grid: {
          vertLines: { color: cssRgb("--chalk-300", 0.1) },
          horzLines: { color: cssRgb("--chalk-300", 0.1) },
        },
        rightPriceScale: { borderColor: cssRgb("--ink-700") },
        timeScale: { borderColor: cssRgb("--ink-700"), timeVisible: false },
        crosshair: {
          mode: CrosshairMode.Magnet,
          vertLine: { color: cssRgb("--chalk-300", 0.4), labelBackgroundColor: cssRgb("--ink-800"), style: LineStyle.Dashed },
          horzLine: { color: cssRgb("--chalk-300", 0.4), labelBackgroundColor: cssRgb("--ink-800"), style: LineStyle.Dashed },
        },
        height: 380,
        width: priceRef.current!.clientWidth,
      }) as LWChart;
      chartRef.current = priceChart;

      const priceSeries = (priceChart as unknown as {
        addAreaSeries: (opts: object) => { setData: (d: object[]) => void };
      }).addAreaSeries({
        lineColor: PRICE_COLOR,
        topColor: "rgba(109,129,150,0.40)",
        bottomColor: "rgba(109,129,150,0.02)",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      priceSeries.setData(candles.map((c) => ({ time: c.t, value: c.c })));

      const addLine = (color: string, data: IndicatorPoint[]) => {
        if (!data.length) return null;
        const s = (priceChart as unknown as {
          addLineSeries: (opts: object) => { setData: (d: object[]) => void };
        }).addLineSeries({ color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        s.setData(data.map((p) => ({ time: p.t, value: p.v })));
        return s;
      };

      const sma50Series = addLine(SMA50_COLOR, sma50);
      const sma100Series = addLine(SMA100_COLOR, sma100);
      const sma200Series = addLine(SMA200_COLOR, sma200);

      (priceChart as unknown as {
        subscribeCrosshairMove: (
          cb: (param: {
            time?: string;
            seriesData: Map<unknown, { value?: number; close?: number }>;
          }) => void
        ) => void;
      }).subscribeCrosshairMove((param) => {
        if (!param.time || !param.seriesData) {
          setHover(null);
          return;
        }
        const getVal = (s: unknown) => {
          if (!s) return undefined;
          const d = param.seriesData.get(s);
          return d?.value ?? d?.close;
        };
        setHover({
          date: String(param.time),
          price: getVal(priceSeries),
          sma50: getVal(sma50Series),
          sma100: getVal(sma100Series),
          sma200: getVal(sma200Series),
        });
      });

      const onResize = () => {
        if (priceRef.current)
          (priceChart as unknown as { applyOptions: (o: object) => void }).applyOptions({
            width: priceRef.current.clientWidth,
          });
      };
      window.addEventListener("resize", onResize);
      (priceChart as unknown as { __cleanup?: () => void }).__cleanup = () =>
        window.removeEventListener("resize", onResize);
    })();

    return () => {
      if (priceChart) {
        (priceChart as unknown as { __cleanup?: () => void }).__cleanup?.();
        priceChart.remove();
      }
      chartRef.current = null;
    };
  }, [payload]);

  const zoom = (factor: number) => {
    const chart = chartRef.current;
    if (!chart || !payload) return;
    const ts = chart.timeScale();
    const total = payload.candles.length;
    if (!total) return;
    const range = ts.getVisibleLogicalRange();
    const curFrom = range ? range.from : 0;
    const curTo = range ? range.to : total - 1;
    const curSpan = Math.max(2, curTo - curFrom);
    const newSpan = Math.max(5, Math.min(total - 1, curSpan * factor));
    const newTo = curTo;
    const newFrom = newTo - newSpan;
    ts.setVisibleLogicalRange({ from: newFrom, to: newTo });
  };
  const zoomReset = () => chartRef.current?.timeScale().fitContent();

  if (error) {
    return (
      <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-5 text-sm text-chalk-300">
        {error}
      </div>
    );
  }
  if (!payload) {
    return (
      <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-5 text-sm text-chalk-300/70">
        Loading chart…
      </div>
    );
  }

  const fetchedAge = Math.floor(
    (Date.now() - new Date(payload.fetched_at).getTime()) / (24 * 3600 * 1000)
  );

  const latest = payload.candles[payload.candles.length - 1];
  const display = hover ?? {
    date: latest?.t ?? "",
    price: latest?.c,
    sma50: undefined,
    sma100: undefined,
    sma200: undefined,
  };

  return (
    <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-5">
      <div className="flex flex-wrap items-center gap-2 mb-4 text-xs text-chalk-300/70">
        <span>Source: {payload.source.toUpperCase()}</span>
        <span>·</span>
        <span>Updated {fetchedAge === 0 ? "today" : `${fetchedAge}d ago`}</span>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-3 text-xs">
        <span className="text-chalk-300/70">{display.date || "—"}</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm" style={{ background: PRICE_COLOR }} />
          <span className="text-chalk-300/70">Price</span>
          <span className="font-mono text-chalk-100">{fmt(display.price)}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm" style={{ background: SMA50_COLOR }} />
          <span className="text-chalk-300/70">50 DMA</span>
          <span className="font-mono text-chalk-100">{fmt(display.sma50)}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm" style={{ background: SMA100_COLOR }} />
          <span className="text-chalk-300/70">100 DMA</span>
          <span className="font-mono text-chalk-100">{fmt(display.sma100)}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm" style={{ background: SMA200_COLOR }} />
          <span className="text-chalk-300/70">200 DMA</span>
          <span className="font-mono text-chalk-100">{fmt(display.sma200)}</span>
        </span>
        <span className="ml-auto flex items-center gap-1 text-chalk-100">
          <button
            type="button"
            onClick={() => zoom(0.5)}
            className="h-6 w-6 inline-flex items-center justify-center rounded border border-ink-700/60 bg-ink-900 hover:bg-ink-800 text-sm leading-none"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => zoom(2)}
            className="h-6 w-6 inline-flex items-center justify-center rounded border border-ink-700/60 bg-ink-900 hover:bg-ink-800 text-sm leading-none"
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            type="button"
            onClick={zoomReset}
            className="h-6 px-2 inline-flex items-center justify-center rounded border border-ink-700/60 bg-ink-900 hover:bg-ink-800 text-[10px] leading-none text-chalk-300/80"
            aria-label="Reset zoom"
          >
            RESET
          </button>
        </span>
      </div>

      <div ref={priceRef} className="w-full" />
    </div>
  );
}
