"use client";
import { useEffect, useRef } from "react";

const SLATE = "#6D8196";
const SA = (a: number) => `rgba(109,129,150,${a})`;
const GA = (a: number) => `rgba(63,122,82,${a})`;
const RA = (a: number) => `rgba(176,82,78,${a})`;
const IA = (a: number) => `rgba(74,74,74,${a})`;

const MAX_PTS      = 100;
const VIS_PTS      = 65;
const DEPTH_LEVELS = 14;
const TICK_FRAMES  = 50;     // new price tick every ~0.8 s at 60 fps
const CHART_RATIO  = 0.62;   // price chart = top 62% of canvas

export function HeroChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rawCtx = canvas.getContext("2d");
    if (!rawCtx) return;

    // Stable non-nullable aliases for closures
    const el: HTMLCanvasElement        = canvas;
    const g: CanvasRenderingContext2D  = rawCtx;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf: number;
    let prices: number[] = [];
    let current  = 100;
    let momentum = 0;
    let frame    = 0;

    // Depth bars — cumulative, lerped toward random targets
    let bids: number[] = Array(DEPTH_LEVELS).fill(0);
    let asks: number[] = Array(DEPTH_LEVELS).fill(0);
    let bidTgt: number[] = [];
    let askTgt: number[] = [];

    function buildDepth() {
      bidTgt = []; askTgt = [];
      let b = 0, a = 0;
      for (let i = 0; i < DEPTH_LEVELS; i++) {
        b += 8 + Math.random() * 65;
        a += 8 + Math.random() * 65;
        bidTgt.push(b);
        askTgt.push(a);
      }
    }

    // Seed volatile price history
    for (let i = 0; i < MAX_PTS; i++) {
      momentum = momentum * 0.88 + (Math.random() - 0.5) * 1.6;
      momentum = Math.max(-4, Math.min(4, momentum));
      current += momentum + (Math.random() - 0.5) * 1.5;
      current = Math.max(72, Math.min(128, current));
      prices.push(current);
    }
    buildDepth();

    function resize() {
      const r = el.getBoundingClientRect();
      el.width  = r.width  * dpr;
      el.height = r.height * dpr;
    }
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    function draw() {
      const W = el.width  / dpr;
      const H = el.height / dpr;

      g.clearRect(0, 0, el.width, el.height);
      g.save();
      g.scale(dpr, dpr);

      // Lerp depth toward targets
      for (let i = 0; i < DEPTH_LEVELS; i++) {
        bids[i] += (bidTgt[i] - bids[i]) * 0.035;
        asks[i] += (askTgt[i] - asks[i]) * 0.035;
      }

      const chartH = H * CHART_RATIO;
      const depthH = H - chartH;
      const PT = 20, PB = 6, PL = 14, PR = 14;

      // ── PRICE CHART ────────────────────────────────────────
      const visible = prices.slice(-VIS_PTS);
      const lo  = Math.min(...visible) - 4;
      const hi  = Math.max(...visible) + 4;
      const rng = hi - lo || 1;

      const aX = PL, aY = PT;
      const aW = W - PL - PR;
      const aH = chartH - PT - PB;

      const toX = (i: number) => aX + (i / (VIS_PTS - 1)) * aW;
      const toY = (p: number) => aY + aH - ((p - lo) / rng) * aH;

      // Horizontal grid
      for (let r = 0; r <= 5; r++) {
        const y = aY + (aH / 5) * r;
        g.strokeStyle = IA(0.06);
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(aX, y);
        g.lineTo(aX + aW, y);
        g.stroke();
      }

      // Vertical time guides
      for (let c = 1; c <= 4; c++) {
        const x = aX + (aW / 5) * c;
        g.strokeStyle = IA(0.04);
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(x, aY);
        g.lineTo(x, aY + aH);
        g.stroke();
      }

      // Area gradient fill
      const grad = g.createLinearGradient(0, aY, 0, aY + aH);
      grad.addColorStop(0,    SA(0.16));
      grad.addColorStop(0.55, SA(0.06));
      grad.addColorStop(1,    SA(0));
      g.beginPath();
      visible.forEach((p, i) => {
        const x = toX(i), y = toY(p);
        i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
      });
      g.lineTo(toX(visible.length - 1), aY + aH);
      g.lineTo(aX, aY + aH);
      g.closePath();
      g.fillStyle = grad;
      g.fill();

      // SMA-20 ghost line
      const sma: number[] = [];
      for (let i = 0; i < visible.length; i++) {
        const sl = visible.slice(Math.max(0, i - 20 + 1), i + 1);
        sma.push(sl.reduce((s, v) => s + v, 0) / sl.length);
      }
      g.beginPath();
      g.strokeStyle = SA(0.28);
      g.lineWidth = 1;
      g.setLineDash([]);
      sma.forEach((p, i) => {
        const x = toX(i), y = toY(p);
        i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
      });
      g.stroke();

      // Price line
      g.beginPath();
      g.strokeStyle = SLATE;
      g.lineWidth = 2;
      g.lineJoin = "round";
      g.lineCap = "round";
      g.setLineDash([]);
      visible.forEach((p, i) => {
        const x = toX(i), y = toY(p);
        i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
      });
      g.stroke();

      // Dashed current-price level
      const lx = toX(visible.length - 1);
      const ly = toY(visible[visible.length - 1]);
      g.setLineDash([3, 7]);
      g.strokeStyle = SA(0.22);
      g.lineWidth = 0.8;
      g.beginPath();
      g.moveTo(aX, ly);
      g.lineTo(lx - 6, ly);
      g.stroke();
      g.setLineDash([]);

      // Endpoint halo + dot
      g.beginPath();
      g.arc(lx, ly, 7, 0, Math.PI * 2);
      g.fillStyle = SA(0.12);
      g.fill();
      g.beginPath();
      g.arc(lx, ly, 3.5, 0, Math.PI * 2);
      g.fillStyle = SLATE;
      g.fill();

      // Price tag (left of endpoint dot)
      g.fillStyle = SLATE;
      g.font = "600 10px 'JetBrains Mono', monospace";
      g.textAlign = "right";
      g.fillText(current.toFixed(2), lx - 10, ly + 4);

      // Y-axis hi/lo labels
      g.font = "500 9px 'JetBrains Mono', monospace";
      g.textAlign = "right";
      g.fillStyle = IA(0.3);
      g.fillText(hi.toFixed(1), aX - 2, aY + 10);
      g.fillText(lo.toFixed(1), aX - 2, aY + aH + 3);

      // ── SEPARATOR LINE ─────────────────────────────────────
      g.strokeStyle = IA(0.12);
      g.lineWidth = 1;
      g.setLineDash([]);
      g.beginPath();
      g.moveTo(0, chartH);
      g.lineTo(W, chartH);
      g.stroke();

      // ── DEPTH CHART (bottom) ───────────────────────────────
      const dY    = chartH + 2;
      const dH    = depthH - 2;
      const midX  = W / 2;          // center divider
      const margin = 20;
      const halfW  = midX - margin;
      const rowH   = dH / DEPTH_LEVELS;

      const maxQty = Math.max(bidTgt[DEPTH_LEVELS - 1] ?? 1, askTgt[DEPTH_LEVELS - 1] ?? 1);

      for (let i = 0; i < DEPTH_LEVELS; i++) {
        const y   = dY + i * rowH;
        const gap = rowH > 2 ? 1 : 0;

        // DEMAND (left side — bar grows rightward from left margin)
        const bW      = (bids[i] / maxQty) * halfW;
        const alphaB  = 0.05 + (i / DEPTH_LEVELS) * 0.55;
        g.fillStyle = GA(alphaB);
        g.fillRect(margin, y, bW, rowH - gap);

        // SUPPLY (right side — bar grows leftward from right margin)
        const sW      = (asks[i] / maxQty) * halfW;
        const alphaS  = 0.05 + (i / DEPTH_LEVELS) * 0.55;
        g.fillStyle = RA(alphaS);
        g.fillRect(W - margin - sW, y, sW, rowH - gap);
      }

      // Center divider
      g.strokeStyle = SA(0.3);
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(midX, dY + 2);
      g.lineTo(midX, dY + dH - 2);
      g.stroke();

      // Labels
      const labelY = dY + 12;
      g.font = "700 8px Inter, sans-serif";
      g.textAlign = "left";
      g.fillStyle = GA(0.65);
      g.fillText("◀ DEMAND", margin + 4, labelY);
      g.textAlign = "right";
      g.fillStyle = RA(0.65);
      g.fillText("SUPPLY ▶", W - margin - 4, labelY);

      // Current price at bottom center of depth
      g.textAlign = "center";
      g.fillStyle = SA(0.7);
      g.font = "600 9px 'JetBrains Mono', monospace";
      g.fillText(current.toFixed(1), midX, dY + dH - 4);

      g.restore();
    }

    function tick() {
      frame++;
      if (frame % TICK_FRAMES === 0) {
        momentum = momentum * 0.88 + (Math.random() - 0.5) * 1.6;
        momentum = Math.max(-4, Math.min(4, momentum));
        current += momentum + (Math.random() - 0.5) * 1.8;
        current = Math.max(72, Math.min(128, current));
        prices.push(current);
        if (prices.length > MAX_PTS * 2) prices = prices.slice(-MAX_PTS);
        if (frame % (TICK_FRAMES * 5) === 0) buildDepth();
      }
      draw();
      raf = requestAnimationFrame(tick);
    }

    tick();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.55 }}
    />
  );
}
