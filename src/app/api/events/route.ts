import { z } from "zod";

import { captureAll, type CapturedEvent } from "@/lib/analytics/providers";
import { isEventName, sanitizeProps } from "@/lib/analytics/events";
import { logger } from "@/lib/logger";
import { buildContext, clientIpFrom } from "@/lib/request-context";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { fail, ok, sameOrigin } from "@/lib/api/respond";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const payloadSchema = z.object({
  session_id: z.string().trim().max(64).optional(),
  events: z
    .array(
      z.object({
        name: z.string().trim().max(64),
        props: z.unknown().optional(),
        page: z.string().trim().max(200).optional(),
        ts: z.string().trim().max(40).optional(),
      }),
    )
    .min(1)
    .max(50),
});

/**
 * Analytics ingest.
 *
 * Everything trustworthy is derived server-side: identity, variant, device and
 * attribution come from cookies this server set, not from the request body.
 * The client may only propose an event name (checked against an allow-list) and
 * properties (filtered against an allow-list). Unknown names and properties are
 * dropped rather than rejected, so a stale deployed client cannot start erroring.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("Request rejected.", 403, { code: "cross_origin" });

  const ip = clientIpFrom(request.headers);
  if (!checkRateLimit("events", ip).allowed) {
    // Never surface analytics back-pressure to a visitor.
    return new Response(null, { status: 204 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail("Malformed request body.", 400, { code: "bad_json" });
  }

  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success)
    return fail("Invalid event payload.", 422, { code: "validation_failed" });

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

  const sessionId = parsed.data.session_id ?? null;
  const captured: CapturedEvent[] = [];

  for (const event of parsed.data.events) {
    if (!isEventName(event.name)) {
      logger.warn("unknown analytics event dropped", { name: event.name });
      continue;
    }
    const props = sanitizeProps(event.props);
    captured.push({
      name: event.name,
      props,
      visitor_id: context.visitorId,
      session_id: sessionId,
      variant: context.variant,
      page: typeof props.page === "string" ? props.page : (event.page ?? null),
      device: context.device,
      utm_source: context.utm_source,
      utm_medium: context.utm_medium,
      utm_campaign: context.utm_campaign,
      utm_term: context.utm_term,
      utm_content: context.utm_content,
      referrer: context.referrer,
      landing_page: context.landing_page,
      occurred_at: event.ts ?? null,
    });
  }

  if (captured.length === 0) return new Response(null, { status: 204 });

  try {
    await captureAll(captured);
  } catch (error) {
    // `captureAll` already swallows per-provider errors; this is belt and braces.
    logger.error("event capture failed", { error: (error as Error).message });
    return new Response(null, { status: 204 });
  }

  return ok({ accepted: captured.length }, 202);
}
