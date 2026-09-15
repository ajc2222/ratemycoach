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
} from "@/lib/security/sanitize";
import { fail, guard, ok, serverError } from "@/lib/api/respond";
import { reviewSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Private founding reviews.
 *
 * Nothing submitted here is ever published automatically — the row is stored
 * with `status: "pending_moderation"` and is only reachable by an authenticated
 * operator. Publication additionally requires the submitter's separate opt-in.
 */
export async function POST(request: Request) {
  const started = Date.now();
  const guarded = await guard(request, "review", reviewSchema);
  if (!guarded.ok) return guarded.response;

  const { data, context, trapped } = guarded.value;
  if (trapped) {
    logger.info("review trapped", { route: "review" });
    return ok({ id: null }, 201);
  }

  const whatWentWell = cleanText(data.what_went_well, 4000);
  const whatCouldImprove = cleanText(data.what_could_improve, 4000);
  const coachName = cleanText(data.coach_name, 160);

  const screen = screenContent(whatWentWell, whatCouldImprove);
  if (!screen.ok) {
    logger.warn("review blocked by content screen", {
      route: "review",
      reasons: screen.reasons,
    });
    return fail(screen.message ?? "Please rewrite this submission.", 422, {
      code: "content_blocked",
      fieldErrors: { what_could_improve: screen.message ?? "" },
    });
  }

  try {
    const db = await getDb();
    const email = normalizeEmail(data.email);
    const emailHash = hashEmail(email);

    const row = await db.insert("private_review_submissions", {
      status: "pending_moderation",
      coach_name: coachName,
      coach_name_normalized: normalizeQuery(coachName),
      coach_handle: normalizeHandle(data.coach_handle),
      demo_coach_id: cleanOptional(data.demo_coach_id, 64),
      relationship: data.relationship,
      coaching_started: data.coaching_started ?? null,
      coaching_ended: data.coaching_ended ?? null,
      coaching_types: data.coaching_types,
      division: data.division,
      focus: data.focus,
      monthly_price_band: data.monthly_price_band ?? null,
      rating_overall: data.rating_overall,
      rating_communication: data.rating_communication,
      rating_personalization: data.rating_personalization,
      rating_value: data.rating_value,
      what_went_well: whatWentWell,
      what_could_improve: whatCouldImprove,
      would_hire_again: data.would_hire_again,
      permission_contact: data.permission_contact,
      permission_publish: data.permission_publish,
      attestation: data.attestation,
      email,
      email_hash: emailHash,
      visitor_id: context.visitorId,
      screening_flags: screen.severity === "flag" ? screen.reasons : [],
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

    // The founding-reviewer list is a separate, explicit opt-in.
    if (data.join_founding_reviewers) {
      await db.upsertWaitlist({
        email,
        email_hash: emailHash,
        role: "athlete",
        primary_division: data.division,
        intent: "not-looking",
        consent_updates: true,
        consent_at: new Date().toISOString(),
        coach_searched: coachName,
        coach_searched_normalized: normalizeQuery(coachName),
        coach_handle: normalizeHandle(data.coach_handle),
        has_paid_for_coaching: true,
        budget_band: data.monthly_price_band ?? null,
        decision_factor: null,
        acquisition_source: null,
        trigger_page: cleanOptional(data.trigger_page, 200) ?? "/review",
        trigger_coach_id: cleanOptional(data.demo_coach_id, 64),
        trigger_feature: null,
        form_source: "founding-reviewer",
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

    logger.info("review stored", {
      route: "review",
      id: row.id,
      subject: emailPseudonym(emailHash),
      division: row.division,
      relationship: row.relationship,
      permission_publish: row.permission_publish,
      flagged: row.screening_flags.length > 0,
      utm_source: row.utm_source,
      ms: Date.now() - started,
    });

    return ok({ id: row.id }, 201);
  } catch (error) {
    return serverError("review", error);
  }
}
