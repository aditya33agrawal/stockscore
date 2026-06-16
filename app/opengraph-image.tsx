import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Stockscore - Sector-Relative Equity Scoring";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(109,129,150,0.18), transparent 60%), #383A3C",
          color: "#FFFFE3",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "rgba(109,129,150,0.12)",
              border: "1px solid rgba(109,129,150,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#A9BBCC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>
            Stock<span style={{ color: "#A9BBCC" }}>score</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "inline-flex",
              alignSelf: "flex-start",
              padding: "8px 16px",
              borderRadius: 999,
              background: "rgba(109,129,150,0.1)",
              border: "1px solid rgba(109,129,150,0.3)",
              color: "#A9BBCC",
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            Live · Updated weekly
          </div>
          <div
            style={{
              fontSize: 88,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: -2,
              maxWidth: 1000,
            }}
          >
            See{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #A9BBCC, #7C3AED)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              exactly why
            </span>{" "}
            a stock scores high.
          </div>
          <div style={{ fontSize: 26, color: "rgba(255,255,227,0.65)", maxWidth: 900, lineHeight: 1.35 }}>
            Transparent, rule-based fundamental analysis across 10 categories. Every +/− traceable to a rule.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 18, color: "rgba(255,255,227,0.5)" }}>
          <div style={{ display: "flex", gap: 32 }}>
            <span>10 categories</span>
            <span>·</span>
            <span>Sector-relative</span>
            <span>·</span>
            <span>100% transparent</span>
          </div>
          <div style={{ color: "#A9BBCC", fontWeight: 600 }}>aditya-finance.vercel.app</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
