import { hashIp } from "./hash";

/**
 * In-process sliding-window rate limiter.
 *
 * Adequate for a single-instance smoke test and deliberately dependency-free.
 * It is NOT correct across multiple serverless instances — documented as debt
 * in docs/post-validation-roadmap.md; the fix is Upstash/Redis behind the same
 * `checkRateLimit` signature.
 */

interface Window {
  hits: number[];
}

const buckets = new Map<string, Window>();
let lastSweep = Date.now();

export interface RateLimitRule {
  /** Maximum requests allowed inside the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

/**
 * Per-route limits. Forms are generous enough that a person correcting a
 * validation error is never blocked, tight enough that scripted flooding is.
 */
export const RATE_LIMITS: Record<string, RateLimitRule> = {
  waitlist: { limit: 8, windowMs: 60 * 60 * 1000 },
  review: { limit: 5, windowMs: 60 * 60 * 1000 },
  "coach-claim": { limit: 6, windowMs: 60 * 60 * 1000 },
  "coach-request": { limit: 10, windowMs: 60 * 60 * 1000 },
  contact: { limit: 6, windowMs: 60 * 60 * 1000 },
  search: { limit: 120, windowMs: 10 * 60 * 1000 },
  events: { limit: 600, windowMs: 10 * 60 * 1000 },
  default: { limit: 60, windowMs: 60 * 60 * 1000 },
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the caller may retry. Only meaningful when blocked. */
  retryAfter: number;
  limit: number;
}

function sweep(now: number): void {
  // Amortised cleanup so the map cannot grow without bound on a long-lived
  // instance. Runs at most once a minute.
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  const cutoff = now - 60 * 60 * 1000;
  for (const [key, window] of buckets) {
    if (window.hits.every((t) => t < cutoff)) buckets.delete(key);
  }
}

export function checkRateLimit(route: string, ip: string, now = Date.now()): RateLimitResult {
  const rule = RATE_LIMITS[route] ?? RATE_LIMITS.default;
  sweep(now);

  const key = `${route}:${hashIp(ip)}`;
  const window = buckets.get(key) ?? { hits: [] };
  const cutoff = now - rule.windowMs;
  window.hits = window.hits.filter((t) => t > cutoff);

  if (window.hits.length >= rule.limit) {
    buckets.set(key, window);
    const oldest = window.hits[0];
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((oldest + rule.windowMs - now) / 1000)),
      limit: rule.limit,
    };
  }

  window.hits.push(now);
  buckets.set(key, window);
  return {
    allowed: true,
    remaining: rule.limit - window.hits.length,
    retryAfter: 0,
    limit: rule.limit,
  };
}

/** Test seam. */
export function resetRateLimits(): void {
  buckets.clear();
  lastSweep = Date.now();
}
