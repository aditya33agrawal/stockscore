"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import type { HeroCompany } from "@/lib/data";
import { heroBands, heroColor } from "@/lib/hero-colors";

const SLATE = "#6D8196";
const SA = (a: number) => `rgba(109,129,150,${a})`;
const IA = (a: number) => `rgba(74,74,74,${a})`;

const HOLD_FRAMES = 130; // frames to rest on a company before morphing
const MORPH_T = 0.022;   // morph speed (per frame, 0→1)

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Fisher–Yates — returns a fresh shuffled index list so every company shows
 *  once, uniquely, before any repeat; reshuffled each full pass. */
function shuffled(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function HeroRadar({
  companies,
  labels,
}: {
  companies: HeroCompany[];
  labels: string[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Currently-featured company, mirrored to a crisp DOM caption (the canvas text
  // was too faint behind the headline; DOM keeps it sharp and always legible).
  const [current, setCurrent] = useState<HeroCompany | null>(companies[0] ?? null);
  const bands = useMemo(() => heroBands(companies.map((c) => c.score)), [companies]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || companies.length === 0 || labels.length < 3) return;
    const rawCtx = canvas.getContext("2d");
    if (!rawCtx) return;

    const el = canvas;
    const g = rawCtx;
    const N = labels.length;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let running = true;

    // Playback order — cycle uniquely, reshuffle each pass.
    let order = shuffled(companies.length);
    let pos = 0;
    const nextIdx = () => {
      pos++;
      if (pos >= order.length) { order = shuffled(companies.length); pos = 0; }
      return order[pos];
    };

    let from = companies[order[0]];
    let to = from;
    let t = 1;          // morph progress (1 = settled)
    let hold = HOLD_FRAMES;
    setCurrent(from);   // sync caption to the first profile

    function resize() {
      const r = el.getBoundingClientRect();
      el.width = r.width * dpr;
      el.height = r.height * dpr;
    }
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    function draw() {
      const W = el.width / dpr;
      const H = el.height / dpr;
      g.clearRect(0, 0, el.width, el.height);
      g.save();
      g.scale(dpr, dpr);

      const cx = W / 2;
      const cy = H * 0.46;
      const R = Math.min(W, H) * 0.30;
      const e = ease(Math.min(1, t));
      const cur = from.axes.map((f, i) => lerp(f, to.axes[i] ?? f, e));

      // concentric rings
      for (let r = 1; r <= 4; r++) {
        g.beginPath();
        for (let i = 0; i <= N; i++) {
          const a = -Math.PI / 2 + (i / N) * 2 * Math.PI;
          const rr = (R * r) / 4;
          const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
          i ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.closePath();
        g.strokeStyle = IA(0.08);
        g.lineWidth = 1;
        g.stroke();
      }

      // spokes + axis labels
      for (let i = 0; i < N; i++) {
        const a = -Math.PI / 2 + (i / N) * 2 * Math.PI;
        g.beginPath();
        g.moveTo(cx, cy);
        g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        g.strokeStyle = IA(0.08);
        g.lineWidth = 1;
        g.stroke();
        g.fillStyle = IA(0.42);
        g.font = "600 10px Inter, sans-serif";
        g.textAlign = "center";
        g.fillText(labels[i], cx + Math.cos(a) * (R + 16), cy + Math.sin(a) * (R + 16) + 3);
      }

      // filled profile
      g.beginPath();
      cur.forEach((v, i) => {
        const a = -Math.PI / 2 + (i / N) * 2 * Math.PI;
        const rr = (R * Math.max(0, Math.min(100, v))) / 100;
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      });
      g.closePath();
      g.fillStyle = SA(0.18);
      g.fill();
      g.strokeStyle = SLATE;
      g.lineWidth = 2;
      g.lineJoin = "round";
      g.stroke();

      g.restore();
    }

    function tick() {
      if (!running) return;
      if (t < 1) {
        t = Math.min(1, t + MORPH_T);
      } else if (hold > 0) {
        hold--;
      } else {
        from = to;
        to = companies[nextIdx()];
        t = 0;
        hold = HOLD_FRAMES;
        setCurrent(to); // update the DOM caption to the incoming company
      }
      draw();
      raf = requestAnimationFrame(tick);
    }

    function start() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    if (reduce) {
      // Static: draw the first (best-ranked) profile once, no animation.
      draw();
    } else {
      // Pause when tab is hidden or the hero scrolls out of view.
      const io = new IntersectionObserver(
        ([entry]) => (entry.isIntersecting ? start() : stop()),
        { threshold: 0.05 },
      );
      io.observe(el);
      const onVis = () => (document.hidden ? stop() : start());
      document.addEventListener("visibilitychange", onVis);

      running = false;
      start();

      return () => {
        stop();
        ro.disconnect();
        io.disconnect();
        document.removeEventListener("visibilitychange", onVis);
      };
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [companies, labels]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.4 }}
      />

      {/* Crisp DOM caption for the featured company — always legible */}
      {current && (
        <div className="absolute top-5 right-5 z-20 pointer-events-none">
          <div className="flex items-center gap-2.5 rounded-xl border border-subtle bg-ink-900/70 backdrop-blur-sm px-3 py-2 shadow-sm">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ background: heroColor(current.score, bands) }}
            />
            <div className="leading-tight">
              <div className="flex items-baseline gap-2">
                <span className="text-[13px] font-bold text-chalk-50">{current.ticker}</span>
                <span className="num text-[12px] font-bold" style={{ color: heroColor(current.score, bands) }}>
                  {current.score.toFixed(1)}
                </span>
              </div>
              <div className="text-[11px] text-chalk-200 truncate max-w-[190px]">{current.name}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
