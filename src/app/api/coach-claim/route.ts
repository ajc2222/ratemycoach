import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { normalizeQuery } from "@/lib/search";
import { emailPseudonym, hashEmail } from "@/lib/security/hash";
import {
  cleanOptional,
  cleanText,
  normalizeEmail,
  normalizeHandle,
  normalizeUrl,
} from "@/lib/security/sanitize";
import { guard, ok, serverError } from "@/lib/api/respond";
import { coachClaimSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const started = Date.now();
  const guarded = await guard(request, "coach-claim", coachClaimSchema);
  if (!guarded.ok) return guarded.response;

  const { data, context, trapped } = guarded.value;
  if (trapped) {
    logger.info("coach claim trapped", { route: "coach-claim" });
    return ok({ id: null }, 201);
  }

  try {
    const db = await getDb();
    const email = normalizeEmail(data.business_email);
    const coachName = cleanText(data.coach_name, 160);

    const row = await db.insert("coach_claim_interest", {
      coach_name: coachName,
      coach_name_normalized: normalizeQuery(coachName),
      team_name: cleanOptional(data.team_name, 160),
      business_email: email,
      email_hash: hashEmail(email),
      instagram: normalizeHandle(data.instagram),
      tiktok: normalizeHandle(data.tiktok),
      website: normalizeUrl(data.website),
      divisions: data.divisions,
      coaching_types: data.coaching_types,
      focus: data.focus,
      monthly_price_band: data.monthly_price_band ?? null,
      accepting_clients: data.accepting_clients ?? null,
      interests: data.interests,
      demo_coach_id: cleanOptional(data.demo_coach_id, 64),
      consent_contact: data.consent_contact,
      consent_at: new Date().toISOString(),
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

    logger.info("coach claim stored", {
      route: "coach-claim",
      id: row.id,
      subject: emailPseudonym(row.email_hash),
      interests: row.interests,
      divisions: row.divisions,
      utm_source: row.utm_source,
      ms: Date.now() - started,
    });

    return ok({ id: row.id }, 201);
  } catch (error) {
    return serverError("coach-claim", error);
  }
}
