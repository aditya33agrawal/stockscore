/**
 * lib/middleware/rate-limit.ts
 *
 * Simple fixed-window in-memory rate limiter.
 * Edge-runtime compatible — uses only Map and Date.
 *
 * ⚠ NOT durable across cold starts. NOT shared across Vercel edge instances.
 *   Adequate for a low-traffic single-region deployment. If traffic grows,
 *   swap the Map for Upstash Redis while keeping the same exported interface.
 */

interface Bucket {
  count: number;
  resetAt: number; // epoch ms
}

const store = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** Max requests allowed per window */
  max: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  /** Remaining requests in the current window */
  remaining: number;
  /** Seconds until the window resets (only meaningful when ok=false) */
  retryAfterSec: number;
}

export function rateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || now > bucket.resetAt) {
    // New window
    store.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, remaining: opts.max - 1, retryAfterSec: 0 };
  }

  if (bucket.count >= opts.max) {
    const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
    return { ok: false, remaining: 0, retryAfterSec };
  }

  bucket.count++;
  return { ok: true, remaining: opts.max - bucket.count, retryAfterSec: 0 };
}

/**
 * Periodic cleanup to prevent unbounded Map growth.
 * Called lazily — runs if the Map exceeds 50k entries.
 */
export function maybePurgeExpired(): void {
  if (store.size < 50_000) return;
  const now = Date.now();
  for (const [key, bucket] of store) {
    if (now > bucket.resetAt) store.delete(key);
  }
}
