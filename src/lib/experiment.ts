/**
 * Landing-page message test.
 *
 * Variant A leads with the *decision* (research before you commit) — it targets
 * the anxiety of spending money badly. Variant B leads with the *evidence gap*
 * (experiences, not transformation photos) — it targets distrust of coach
 * marketing. They are different theories of what makes someone stop scrolling,
 * and the copy below is the only difference between the two experiences.
 */
export const EXPERIMENT_NAME = "landing_message";

export interface VariantDefinition {
  id: "a" | "b";
  label: string;
  headline: string;
  subhead: string;
}

export const VARIANTS: Record<"a" | "b", VariantDefinition> = {
  a: {
    id: "a",
    label: "A — Research before committing",
    headline: "Research your bodybuilding coach before committing to prep.",
    subhead:
      "Discover coaching specialties, pricing, client experiences, communication standards, and public discussions in one independent place.",
  },
  b: {
    id: "b",
    label: "B — Real experiences, not photos",
    headline: "Real coaching experiences—not just transformation photos.",
    subhead:
      "Discover coaching specialties, pricing, client experiences, communication standards, and public discussions in one independent place.",
  },
};

export const VARIANT_IDS = ["a", "b"] as const;
export type VariantId = (typeof VARIANT_IDS)[number];

export function isVariantId(value: unknown): value is VariantId {
  return value === "a" || value === "b";
}

/**
 * Deterministic assignment: the same visitor id always lands in the same
 * bucket, on every page and on every return visit, with no storage lookup.
 * The salt lets us re-randomise for a future experiment without reusing the
 * previous split (which would correlate the two tests).
 */
export function assignVariant(visitorId: string, salt = getSalt()): VariantId {
  return bucket(visitorId, salt) < 50 ? "a" : "b";
}

/**
 * Stable 0–99 bucket for a visitor. Exposed separately from `assignVariant`
 * so a future test can use an uneven split or more than two arms without
 * re-bucketing anyone who is already assigned.
 */
export function bucket(visitorId: string, salt = getSalt()): number {
  return mix32(fnv1a(`${salt}:${visitorId}`)) % 100;
}

/**
 * FNV-1a (32-bit). Defined here rather than imported from the crypto helpers so
 * that `middleware.ts` — which may run on the edge runtime — can assign a
 * variant without pulling in `node:crypto`.
 */
export function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/**
 * Final avalanche (the murmur3 finaliser).
 *
 * This is not decoration. FNV-1a's multiplier is odd, so the low bit of its
 * output is just the XOR of the low bits of every input byte — taking
 * `fnv1a(x) % 2` directly would produce a "split" that ignores byte order and
 * that assigns the same buckets under two different salts. Mixing first makes
 * every output bit depend on the whole input.
 */
function mix32(input: number): number {
  let hash = input >>> 0;
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b) >>> 0;
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35) >>> 0;
  hash ^= hash >>> 16;
  return hash >>> 0;
}

export function getSalt(): string {
  return process.env.EXPERIMENT_SALT?.trim() || "pcr-default-salt";
}

export function getVariant(id: string | null | undefined): VariantDefinition {
  return isVariantId(id) ? VARIANTS[id] : VARIANTS.a;
}
