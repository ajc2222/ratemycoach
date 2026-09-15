import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { normalizeQuery } from "@/lib/search";
import { emailPseudonym, hashEmail } from "@/lib/security/hash";
import { cleanOptional, normalizeEmail, normalizeHandle } from "@/lib/security/sanitize";
import { guard, ok, serverError } from "@/lib/api/respond";
import { waitlistSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const started = Date.now();
  const guarded = await guard(request, "waitlist", waitlistSchema);
  if (!guarded.ok) return guarded.response;

  const { data, context, trapped } = guarded.value;

  // A tripped honeypot gets a normal-looking success and is never stored.
  if (trapped) {
    logger.info("waitlist trapped", { route: "waitlist" });
    return ok({ id: null, duplicate: false }, 201);
  }

  try {
    const db = await getDb();
    const email = normalizeEmail(data.email);
    const coachSearched = cleanOptional(data.coach_searched, 160);

    const { entry, duplicate } = await db.upsertWaitlist({
      email,
      email_hash: hashEmail(email),
      role: data.role,
      primary_division: data.primary_division,
      intent: data.intent,
      consent_updates: data.consent_updates,
      consent_at: new Date().toISOString(),
      coach_searched: coachSearched,
      coach_searched_normalized: coachSearched ? normalizeQuery(coachSearched) : null,
      coach_handle: normalizeHandle(data.coach_handle),
      has_paid_for_coaching: data.has_paid_for_coaching ?? null,
      budget_band: data.budget_band ?? null,
      decision_factor: data.decision_factor ?? null,
      acquisition_source: data.acquisition_source ?? null,
      trigger_page: cleanOptional(data.trigger_page, 200),
      trigger_coach_id: cleanOptional(data.trigger_coach_id, 64),
      trigger_feature: data.trigger_feature ?? null,
      form_source: cleanOptional(data.form_source, 64) ?? "waitlist",
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

    logger.info("waitlist stored", {
      route: "waitlist",
      id: entry.id,
      subject: emailPseudonym(entry.email_hash),
      duplicate,
      role: entry.role,
      intent: entry.intent,
      division: entry.primary_division,
      trigger_feature: entry.trigger_feature,
      utm_source: entry.utm_source,
      variant: entry.variant,
      ms: Date.now() - started,
    });

    return ok({ id: entry.id, duplicate }, 201);
  } catch (error) {
    return serverError("waitlist", error);
  }
}
