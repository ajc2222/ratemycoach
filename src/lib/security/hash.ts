import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * A process-stable fallback salt. If `IP_HASH_SALT` is unset we still never
 * store a raw IP — we just lose rate-limit continuity across restarts, which
 * is an acceptable trade for not requiring configuration in development.
 */
const fallbackSalt = randomBytes(32).toString("hex");

function salt(): string {
  return process.env.IP_HASH_SALT?.trim() || fallbackSalt;
}

/** Salted, truncated hash. Used for IPs (rate limiting) — the raw IP is never stored. */
export function hashIp(ip: string): string {
  return createHash("sha256").update(`ip:${salt()}:${ip}`).digest("hex").slice(0, 32);
}

/**
 * Stable pseudonym for an email. Used as the waitlist dedupe key, in logs, and
 * to satisfy a deletion request without the requester's address being stored
 * anywhere extra. Normalised first so "A@x.com " and "a@x.com" collide.
 */
export function hashEmail(email: string): string {
  return createHash("sha256")
    .update(`email:${salt()}:${email.trim().toLowerCase()}`)
    .digest("hex");
}

/** Short, log-safe form of an email hash. */
export function emailPseudonym(emailHash: string): string {
  return emailHash.slice(0, 12);
}

/**
 * Constant-time comparison. Both sides are hashed first so the underlying
 * `timingSafeEqual` always sees equal-length buffers, which keeps the timing
 * independent of where the first differing byte falls.
 */
export function safeEqual(a: string, b: string): boolean {
  const ad = createHash("sha256").update(a, "utf8").digest();
  const bd = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ad, bd);
}
