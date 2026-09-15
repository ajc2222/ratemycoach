/**
 * The analytics contract, shared by the client tracker and the server ingest.
 *
 * The property allow-list below is enforced **server-side**. Anything not named
 * here is dropped before storage, which is what guarantees that no email, name
 * or review text can reach the event table — whether by a coding mistake or a
 * tampered client.
 */

export const EVENT_NAMES = [
  "landing_viewed",
  "hero_search_started",
  "coach_search_submitted",
  "coach_search_zero_results",
  "filter_selected",
  "category_selected",
  "coach_profile_opened",
  "review_feature_clicked",
  "ai_summary_clicked",
  "compare_clicked",
  "save_coach_clicked",
  "waitlist_started",
  "waitlist_completed",
  "review_form_started",
  "review_form_completed",
  "coach_claim_started",
  "coach_claim_completed",
  "coach_requested",
  "outbound_social_clicked",
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

export function isEventName(value: unknown): value is EventName {
  return typeof value === "string" && (EVENT_NAMES as readonly string[]).includes(value);
}

/**
 * Every property any event is allowed to carry.
 *
 * Note what is absent: no `email`, no `name`, no `query` free text. The search
 * *term* is a high-value signal, but it is personal-ish and belongs in the
 * `search_events` table (private, operator-only), not in the analytics stream.
 * Analytics records only that a search happened, its length band and its
 * result count.
 */
export const ALLOWED_PROPS = [
  "page",
  "feature",
  "coach_id",
  "coach_slug",
  "category",
  "filter_facet",
  "filter_value",
  "filters_active",
  "result_count",
  "zero_results",
  "query_length",
  "has_query",
  "position",
  "network",
  "form",
  "source",
  "variant_forced",
  "duplicate",
  "field_errors",
  "step",
] as const;

export type AllowedProp = (typeof ALLOWED_PROPS)[number];
export type EventProps = Partial<Record<AllowedProp, string | number | boolean | null>>;

const ALLOWED_SET = new Set<string>(ALLOWED_PROPS);

/** Values are clamped so a client cannot smuggle a paragraph into a prop. */
export function sanitizeProps(input: unknown): Record<string, string | number | boolean> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (!ALLOWED_SET.has(key)) continue;
    if (value === null || value === undefined) continue;
    if (typeof value === "number") {
      if (Number.isFinite(value)) out[key] = value;
    } else if (typeof value === "boolean") {
      out[key] = value;
    } else if (typeof value === "string") {
      const trimmed = value.trim().slice(0, 80);
      // Anything email-shaped is a bug or an attack; drop it either way.
      if (trimmed && !/[\w.+-]+@[\w-]+\.[\w.]{2,}/.test(trimmed)) out[key] = trimmed;
    }
  }
  return out;
}

/** Coarse band for search-term length — useful, and not a fingerprint. */
export function queryLengthBand(query: string): string {
  const n = query.trim().length;
  if (n === 0) return "0";
  if (n <= 5) return "1-5";
  if (n <= 12) return "6-12";
  if (n <= 25) return "13-25";
  return "26+";
}
