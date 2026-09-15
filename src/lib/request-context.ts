import type { Attribution } from "@/lib/db/types";
import { EMPTY_ATTRIBUTION } from "@/lib/db/types";

/**
 * Cookie names. Deliberately few, all first-party, none used for advertising.
 *
 *  - `pcr_vid`   anonymous visitor id. Random, carries no personal data. Read by
 *                the client so events can be correlated with submissions.
 *  - `pcr_var`   the assigned experiment variant (derived from `pcr_vid`, cached).
 *  - `pcr_attr`  first-touch attribution (UTM + referrer + landing page).
 */
export const COOKIES = {
  visitor: "pcr_vid",
  variant: "pcr_var",
  attribution: "pcr_attr",
} as const;

export const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 days
export const ATTRIBUTION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface StoredAttribution {
  s?: string; // utm_source
  m?: string; // utm_medium
  c?: string; // utm_campaign
  t?: string; // utm_term
  n?: string; // utm_content
  r?: string; // referrer
  l?: string; // landing page
}

const UTM_KEYS: [keyof StoredAttribution, string][] = [
  ["s", "utm_source"],
  ["m", "utm_medium"],
  ["c", "utm_campaign"],
  ["t", "utm_term"],
  ["n", "utm_content"],
];

function clip(value: string | null | undefined, max = 120): string | undefined {
  if (!value) return undefined;
  const cleaned = value.trim().slice(0, max);
  return cleaned.length > 0 ? cleaned : undefined;
}

/**
 * Builds the first-touch attribution record from a request URL and referrer.
 * `ref` and `source` are accepted as friendly aliases for `utm_source`, because
 * community links are hand-written far more often than they are tagged properly.
 */
export function readAttributionFromUrl(url: URL, referrer: string | null): StoredAttribution {
  const attribution: StoredAttribution = {};
  for (const [short, param] of UTM_KEYS) {
    const value = clip(url.searchParams.get(param));
    if (value) attribution[short] = value;
  }
  if (!attribution.s) {
    attribution.s = clip(url.searchParams.get("ref") ?? url.searchParams.get("source"));
  }
  if (referrer) {
    try {
      const host = new URL(referrer).hostname;
      // Internal navigation is not a referral.
      if (host && host !== url.hostname) attribution.r = clip(host, 120);
    } catch {
      /* malformed Referer headers are simply ignored */
    }
  }
  attribution.l = clip(url.pathname, 200);
  return attribution;
}

export function hasAttribution(attribution: StoredAttribution): boolean {
  return Boolean(attribution.s || attribution.m || attribution.c || attribution.r);
}

export function encodeAttribution(attribution: StoredAttribution): string {
  return encodeURIComponent(JSON.stringify(attribution));
}

export function decodeAttribution(raw: string | undefined | null): StoredAttribution {
  if (!raw) return {};
  try {
    // Cookie values arrive percent-encoded, but some readers decode for us, so
    // tolerate a value that is already plain JSON rather than losing the whole
    // attribution to a URIError.
    let text = raw;
    try {
      text = decodeURIComponent(raw);
    } catch {
      /* already decoded, or malformed — fall through to JSON.parse */
    }
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") return {};
    const source = parsed as Record<string, unknown>;
    const out: StoredAttribution = {};
    for (const key of ["s", "m", "c", "t", "n", "r", "l"] as const) {
      const value = source[key];
      if (typeof value === "string") out[key] = clip(value);
    }
    return out;
  } catch {
    return {};
  }
}

/** Coarse device class. Three buckets is all the analysis needs. */
export function deviceFromUserAgent(userAgent: string | null): "mobile" | "tablet" | "desktop" {
  if (!userAgent) return "desktop";
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android|blackberry|iemobile|opera mini/.test(ua)) return "mobile";
  return "desktop";
}

export interface RequestContext extends Attribution {
  visitorId: string | null;
}

/**
 * Assembles the server-trusted context attached to every persisted record.
 * The client may *suggest* a trigger page or feature, but the identity,
 * variant and attribution always come from cookies the server itself set.
 */
export function buildContext(input: {
  cookies: { get(name: string): { value: string } | undefined };
  userAgent: string | null;
  variantOverride?: string | null;
}): RequestContext {
  const attribution = decodeAttribution(input.cookies.get(COOKIES.attribution)?.value);
  const visitorId = input.cookies.get(COOKIES.visitor)?.value ?? null;
  const variant = input.variantOverride ?? input.cookies.get(COOKIES.variant)?.value ?? null;
  return {
    ...EMPTY_ATTRIBUTION,
    visitorId,
    variant,
    utm_source: attribution.s ?? null,
    utm_medium: attribution.m ?? null,
    utm_campaign: attribution.c ?? null,
    utm_term: attribution.t ?? null,
    utm_content: attribution.n ?? null,
    referrer: attribution.r ?? null,
    landing_page: attribution.l ?? null,
    device: deviceFromUserAgent(input.userAgent),
  };
}

/** Best-effort client IP for rate limiting. Hashed immediately; never stored raw. */
export function clientIpFrom(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? headers.get("cf-connecting-ip") ?? "0.0.0.0";
}
