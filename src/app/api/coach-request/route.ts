import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { normalizeQuery } from "@/lib/search";
import { emailPseudonym, hashEmail } from "@/lib/security/hash";
import { screenContent } from "@/lib/security/content-screen";
import {
  cleanOptional,
  cleanText,
  normalizeEmail,
  normalizeHandle,
  normalizeUrl,
} from "@/lib/security/sanitize";
import { fail, guard, ok, serverError } from "@/lib/api/respond";
import { coachRequestSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * "Submit a coach" — the highest-value demand signal in the smoke test, because
 * it is a named, specific, real coach that someone wanted and we did not have.
 */
export async function POST(request: Request) {
  const started = Date.now();
  const guarded = await guard(request, "coach-request", coachRequestSchema);
  if (!guarded.ok) return guarded.response;

  const { data, context, trapped } = guarded.value;
  if (trapped) {
    logger.info("coach request trapped", { route: "coach-request" });
    return ok({ id: null }, 201);
  }

  const reason = cleanOptional(data.reason, 1200);
  const screen = screenContent(reason);
  if (!screen.ok) {
    return fail(screen.message ?? "Please rewrite this.", 422, {
      code: "content_blocked",
      fieldErrors: { reason: screen.message ?? "" },
    });
  }

  try {
    const db = await getDb();
    const coachName = cleanText(data.coach_name, 160);
    const email = data.email ? normalizeEmail(data.email) : null;
    const emailHash = email ? hashEmail(email) : null;

    const row = await db.insert("coach_requests", {
      coach_name: coachName,
      coach_name_normalized: normalizeQuery(coachName),
      team_name: cleanOptional(data.team_name, 160),
      instagram: normalizeHandle(data.instagram),
      tiktok: normalizeHandle(data.tiktok),
      website: normalizeUrl(data.website),
      reason,
      email,
      email_hash: emailHash,
      notify: Boolean(data.notify && email),
      source_query: cleanOptional(data.source_query, 160),
      visitor_id: context.visitorId,
      form_source: "submit-a-coach",
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

    // Asking to be notified is a waitlist join with a coach attached — that
    // association is exactly the "repeat demand for the same coach" signal.
    if (email && data.notify) {
      await db.upsertWaitlist({
        email,
        email_hash: emailHash!,
        role: "athlete",
        // This short form does not ask for a division. Preserve that truth
        // instead of contaminating division-demand reporting with a default.
        primary_division: null,
        intent: "now",
        consent_updates: true,
        consent_at: new Date().toISOString(),
        coach_searched: coachName,
        coach_searched_normalized: normalizeQuery(coachName),
        coach_handle: normalizeHandle(data.instagram ?? data.tiktok),
        has_paid_for_coaching: null,
        budget_band: null,
        decision_factor: null,
        acquisition_source: null,
        trigger_page: cleanOptional(data.trigger_page, 200) ?? "/submit-a-coach",
        trigger_coach_id: null,
        trigger_feature: null,
        form_source: "coach-request-notify",
        visitor_id: context.visitorId,
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
    }

    logger.info("coach request stored", {
      route: "coach-request",
      id: row.id,
      coach: row.coach_name_normalized,
      notify: row.notify,
      subject: emailHash ? emailPseudonym(emailHash) : null,
      utm_source: row.utm_source,
      ms: Date.now() - started,
    });

    return ok({ id: row.id }, 201);
  } catch (error) {
    return serverError("coach-request", error);
  }
}
