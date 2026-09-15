import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { emailPseudonym, hashEmail } from "@/lib/security/hash";
import { cleanText, normalizeEmail } from "@/lib/security/sanitize";
import { guard, ok, serverError } from "@/lib/api/respond";
import { contactSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * General contact, including data-access and data-deletion requests. Deletion
 * is deliberately handled by a human against the documented procedure rather
 * than by an automatic endpoint: an unauthenticated "delete everything for this
 * address" API would itself be a privacy hole.
 */
export async function POST(request: Request) {
  const guarded = await guard(request, "contact", contactSchema);
  if (!guarded.ok) return guarded.response;

  const { data, context, trapped } = guarded.value;
  if (trapped) return ok({ id: null }, 201);

  try {
    const db = await getDb();
    const email = normalizeEmail(data.email);
    const row = await db.insert("contact_submissions", {
      email,
      email_hash: hashEmail(email),
      topic: data.topic,
      message: cleanText(data.message, 4000),
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

    logger.info("contact stored", {
      route: "contact",
      id: row.id,
      topic: row.topic,
      subject: emailPseudonym(row.email_hash),
    });

    return ok({ id: row.id }, 201);
  } catch (error) {
    return serverError("contact", error);
  }
}
