import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { normalizeQuery } from "@/lib/search";
import { cleanOptional, cleanText } from "@/lib/security/sanitize";
import { clientIpFrom, buildContext } from "@/lib/request-context";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { fail, ok, sameOrigin, serverError } from "@/lib/api/respond";
import { searchEventSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Records a directory search.
 *
 * This is kept separate from `/api/events` on purpose: the raw search term is
 * the single most valuable thing this smoke test collects, and it is also the
 * one free-text field a visitor types without thinking. It therefore goes into
 * a private, operator-only table rather than the analytics stream — see
 * docs/privacy-notes.md.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("Request rejected.", 403, { code: "cross_origin" });

  const ip = clientIpFrom(request.headers);
  const limit = checkRateLimit("search", ip);
  if (!limit.allowed) {
    // Searching is not a submission; silently accept so the UI never stutters.
    return ok({ recorded: false }, 202);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail("Malformed request body.", 400, { code: "bad_json" });
  }

  const parsed = searchEventSchema.safeParse(payload);
  if (!parsed.success)
    return fail("Invalid search payload.", 422, { code: "validation_failed" });

  const data = parsed.data;
  const raw = cleanText(data.query, 200);
  const normalized = normalizeQuery(raw);
  // An empty query is a filter-only view, not a demand signal.
  if (!normalized) return ok({ recorded: false }, 202);

  try {
    const db = await getDb();
    const cookieStore = {
      get(name: string) {
        const header = request.headers.get("cookie") ?? "";
        const match = header.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
        return match ? { value: decodeURIComponent(match[1]) } : undefined;
      },
    };
    const context = buildContext({
      cookies: cookieStore,
      userAgent: request.headers.get("user-agent"),
    });

    const row = await db.insert("search_events", {
      raw_query: raw,
      normalized_query: normalized,
      result_count: data.result_count,
      zero_results: data.result_count === 0,
      filters: data.filters ?? {},
      visitor_id: context.visitorId,
      session_id: cleanOptional(data.session_id, 64),
      page: cleanOptional(data.page, 200),
      variant: context.variant,
      utm_source: context.utm_source,
      utm_medium: context.utm_medium,
      utm_campaign: context.utm_campaign,
      utm_term: context.utm_term,
      utm_content: context.utm_content,
      referrer: context.referrer,
      landing_page: context.landing_page,
      device: context.device,
    });

    logger.info("search recorded", {
      route: "search",
      id: row.id,
      normalized,
      results: row.result_count,
      zero: row.zero_results,
      utm_source: row.utm_source,
    });

    return ok({ recorded: true }, 201);
  } catch (error) {
    return serverError("search", error);
  }
}
