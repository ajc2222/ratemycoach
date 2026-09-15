import "server-only";

import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Analytics provider abstraction.
 *
 * The internal table is the source of truth for the validation readout — it can
 * be joined against the submission tables, which no hosted product can do.
 * A second, optional sink (Plausible) exists so the team can watch traffic in
 * real time without a database query; it is cookie-less, carries no personal
 * data, and is entirely optional.
 */

export interface CapturedEvent {
  name: string;
  props: Record<string, string | number | boolean>;
  visitor_id: string | null;
  session_id: string | null;
  variant: string | null;
  page: string | null;
  device: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  referrer: string | null;
  landing_page: string | null;
  occurred_at: string | null;
}

export interface AnalyticsProvider {
  readonly name: string;
  capture(events: CapturedEvent[]): Promise<void>;
}

class InternalProvider implements AnalyticsProvider {
  readonly name = "internal";

  async capture(events: CapturedEvent[]): Promise<void> {
    const db = await getDb();
    await db.insertMany(
      "analytics_events",
      events.map((event) => ({
        name: event.name,
        props: event.props,
        visitor_id: event.visitor_id,
        session_id: event.session_id,
        variant: event.variant,
        page: event.page,
        device: event.device,
        utm_source: event.utm_source,
        utm_medium: event.utm_medium,
        utm_campaign: event.utm_campaign,
        utm_term: event.utm_term,
        utm_content: event.utm_content,
        referrer: event.referrer,
        landing_page: event.landing_page,
        occurred_at: event.occurred_at,
      })),
    );
  }
}

/**
 * Optional Plausible sink. Server-side so no third-party script ever loads in
 * the visitor's browser: no cookies, nothing to consent to, no ad blockers to
 * skew the numbers.
 */
class PlausibleProvider implements AnalyticsProvider {
  readonly name = "plausible";
  constructor(
    private readonly host: string,
    private readonly domain: string,
  ) {}

  async capture(events: CapturedEvent[]): Promise<void> {
    await Promise.all(
      events.map(async (event) => {
        const response = await fetch(`${this.host}/api/event`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "User-Agent": "PrepCoachReviews/1.0" },
          body: JSON.stringify({
            name: event.name,
            domain: this.domain,
            url: `https://${this.domain}${event.page ?? "/"}`,
            props: { ...event.props, variant: event.variant ?? "unassigned" },
          }),
        });
        if (!response.ok) {
          logger.warn("plausible capture failed", {
            status: response.status,
            name: event.name,
          });
        }
      }),
    );
  }
}

let providers: AnalyticsProvider[] | null = null;

export function getProviders(): AnalyticsProvider[] {
  if (providers) return providers;
  const list: AnalyticsProvider[] = [new InternalProvider()];
  const host = process.env.PLAUSIBLE_HOST?.trim();
  const domain = process.env.PLAUSIBLE_DOMAIN?.trim();
  if (host && domain) list.push(new PlausibleProvider(host.replace(/\/$/, ""), domain));
  providers = list;
  return list;
}

/**
 * Fan out to every sink. A failing sink is logged and swallowed: losing an
 * analytics event must never fail a visitor's request.
 */
export async function captureAll(events: CapturedEvent[]): Promise<void> {
  if (events.length === 0) return;
  await Promise.all(
    getProviders().map(async (provider) => {
      try {
        await provider.capture(events);
      } catch (error) {
        logger.error("analytics provider failed", {
          provider: provider.name,
          error: (error as Error).message,
          count: events.length,
        });
      }
    }),
  );
}

export function __resetProvidersForTests(): void {
  providers = null;
}
