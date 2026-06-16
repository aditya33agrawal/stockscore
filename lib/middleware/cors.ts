/**
 * lib/middleware/cors.ts
 *
 * CORS enforcement for /api/* routes.
 * Default: same-origin only (no cross-origin API access).
 *
 * To expose the API to specific origins, add them to ALLOWED_ORIGINS.
 * Edge-runtime compatible.
 */

import type { NextRequest, NextResponse } from "next/server";

/**
 * Add origins here if you need to allow cross-origin API access.
 * Example: new Set(["https://stockscore.app"])
 */
const ALLOWED_ORIGINS = new Set<string>([]);

export function applyCors(req: NextRequest, res: NextResponse): void {
  const origin = req.headers.get("origin");
  if (!origin) return; // same-origin or non-browser requests - no CORS headers needed

  const isAllowed = ALLOWED_ORIGINS.has(origin);
  if (isAllowed) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, DELETE, OPTIONS",
    );
    res.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, x-refresh-password",
    );
    res.headers.set("Access-Control-Max-Age", "86400");
    res.headers.set("Vary", "Origin");
  }
  // No CORS header for non-allowed origins → browser blocks the request
}
