"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ background: "#FFFFE3", color: "#4A4A4A", fontFamily: "Inter, sans-serif", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: 420, padding: 32, textAlign: "center" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Something went wrong.</h1>
          <p style={{ fontSize: 14, color: "rgba(74,74,74,0.65)", marginBottom: 24 }}>
            An unexpected error occurred. Try reloading the page.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#6D8196",
              color: "#FFFFE3",
              border: 0,
              borderRadius: 12,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
