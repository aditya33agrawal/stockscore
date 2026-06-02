/**
 * middleware.ts  (Edge Runtime — project root)
 *
 * Runs before every matched request. Responsibilities:
 *   1. Maintenance kill-switch (MAINTENANCE_MODE=1 env var → 503)
 *   2. IP-based rate limiting for /api/* routes
 *   3. Attach x-request-id to every request/response
 *   4. Apply security headers (CSP report-only, HSTS, etc.)
 *   5. Apply CORS headers for /api/* routes
 *   6. Structured access log (JSON, one line per request)
 *
 * This layer runs on the Edge Runtime and therefore CANNOT use Node APIs
 * (no `postgres`, `bcrypt`, `crypto.randomBytes`, etc.).
 * DB-backed auth logic stays in route handlers.
 */

import { NextRequest, NextResponse } from "next/server";
import { applySecurityHeaders } from "@/lib/middleware/security-headers";
import { rateLimit, maybePurgeExpired } from "@/lib/middleware/rate-limit";
import { applyCors } from "@/lib/middleware/cors";

export const config = {
  matcher: [
    // Match everything except Next.js internals and static assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf)$).*)",
  ],
};

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const start = Date.now();
  const { pathname } = req.nextUrl;

  // ── 1. Maintenance kill-switch ──────────────────────────────────────────────
  if (process.env.MAINTENANCE_MODE === "1") {
    return new NextResponse(
      JSON.stringify({ error: { code: "maintenance", message: "Service is under maintenance. Check back soon." } }),
      { status: 503, headers: { "content-type": "application/json", "retry-after": "300" } }
    );
  }

  // ── 2. Rate limiting (API routes only) ─────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    maybePurgeExpired();

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    // Tighter limit for auth and refresh/admin endpoints
    const isSensitive =
      pathname.startsWith("/api/auth/") || pathname.startsWith("/api/refresh");

    const opts = isSensitive
      ? { max: 10, windowMs: 60_000 }   // 10 req/min for auth & refresh
      : { max: 60, windowMs: 60_000 };  // 60 req/min for general API

    const result = rateLimit(`${ip}:${isSensitive ? "sensitive" : "api"}`, opts);

    if (!result.ok) {
      return new NextResponse(
        JSON.stringify({ error: { code: "rate_limited", message: "Too many requests" } }),
        {
          status: 429,
          headers: {
            "content-type": "application/json",
            "retry-after": String(result.retryAfterSec),
            "x-ratelimit-limit": String(opts.max),
            "x-ratelimit-remaining": "0",
          },
        }
      );
    }
  }

  // ── 3. Request ID ──────────────────────────────────────────────────────────
  const requestId =
    req.headers.get("x-request-id") ?? crypto.randomUUID();

  // ── 4 & 5. Build response with security + CORS headers ────────────────────
  const res = NextResponse.next({
    request: {
      headers: new Headers({
        ...Object.fromEntries(req.headers),
        "x-request-id": requestId,
      }),
    },
  });

  res.headers.set("x-request-id", requestId);
  applySecurityHeaders(res);
  if (pathname.startsWith("/api/")) {
    applyCors(req, res);
  }

  // ── 6. Access log ──────────────────────────────────────────────────────────
  const durationMs = Date.now() - start;
  console.log(
    JSON.stringify({
      ts:         new Date().toISOString(),
      level:      "info",
      msg:        "http",
      requestId,
      method:     req.method,
      path:       pathname,
      ip:         req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      ua:         req.headers.get("user-agent")?.slice(0, 100) ?? null,
      durationMs,
    })
  );

  return res;
}
