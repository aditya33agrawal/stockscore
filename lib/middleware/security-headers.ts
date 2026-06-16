/**
 * lib/middleware/security-headers.ts
 *
 * Applies security response headers.  Edge-runtime compatible (no Node APIs).
 *
 * CSP is currently set to Report-Only mode so violations are logged but
 * don't break the app.  Once tested, change the header name to
 * `Content-Security-Policy` to enforce.
 */

import type { NextResponse } from "next/server";

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "img-src 'self' data: https:",
  // 'unsafe-inline' needed for Tailwind/recharts inline styles; remove if possible
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self' https://vitals.vercel-insights.com https://va.vercel-scripts.com",
  "font-src 'self' data:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

export function applySecurityHeaders(res: NextResponse): void {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );
  // Report-Only initially - switch to Content-Security-Policy once violations confirmed clean
  res.headers.set("Content-Security-Policy-Report-Only", CSP_DIRECTIVES);
}
