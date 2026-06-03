import type { NextRequest } from "next/server";

export interface RequestMeta {
  ip: string | null;
  userAgent: string | null;
  referer: string | null;
  requestId: string | null;
  country: string | null;
  path: string;
  method: string;
}

/**
 * Extracts standardised audit metadata from any NextRequest.
 * Safe to call from any route handler — never throws.
 */
export function extractRequestMeta(req: NextRequest): RequestMeta {
  const h = req.headers;

  // IP: Vercel sets x-forwarded-for; middleware/proxies may set x-real-ip
  const forwarded = h.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0].trim()
    : h.get("x-real-ip") ?? null;

  return {
    ip,
    userAgent:  h.get("user-agent")    ?? null,
    referer:    h.get("referer")        ?? null,
    requestId:  h.get("x-request-id")  ?? null,
    country:    h.get("x-vercel-ip-country") ?? null,
    path:       req.nextUrl.pathname,
    method:     req.method,
  };
}
