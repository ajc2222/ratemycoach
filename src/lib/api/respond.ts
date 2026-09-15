import "server-only";

import { NextResponse } from "next/server";
import type { ZodError, ZodType } from "zod";

import { logger } from "@/lib/logger";
import { buildContext, clientIpFrom, type RequestContext } from "@/lib/request-context";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { fieldErrors } from "@/lib/validation/schemas";

/**
 * The shared front door for every write endpoint.
 *
 * Order matters and is the same everywhere: cheap rejections first, then the
 * bot traps, then validation, then work. A bot should never reach the database
 * and a person should never be rate-limited before their input is even read.
 */

export interface ApiSuccess<T = unknown> {
  ok: true;
  data: T;
}

export interface ApiFailure {
  ok: false;
  error: string;
  fieldErrors?: Record<string, string>;
  code?: string;
}

export function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(
  error: string,
  status: number,
  extra: Omit<ApiFailure, "ok" | "error"> = {},
): NextResponse<ApiFailure> {
  return NextResponse.json({ ok: false, error, ...extra }, { status });
}

export function validationFailed(error: ZodError): NextResponse<ApiFailure> {
  return fail("Please check the highlighted fields.", 422, {
    fieldErrors: fieldErrors(error),
    code: "validation_failed",
  });
}

/**
 * Cross-site POST guard. `Sec-Fetch-Site` is honoured where the browser sends
 * it; `Origin` is the fallback. Requests with neither (curl, tests, some
 * older clients) are allowed — this is a public form endpoint with no
 * ambient authority, so the risk being managed here is nuisance, not CSRF
 * against a logged-in user.
 */
export function sameOrigin(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite) return fetchSite === "same-origin" || fetchSite === "none";
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export interface GuardedRequest<T> {
  data: T;
  context: RequestContext;
  /** True when the honeypot or timing trap fired: respond 200, persist nothing. */
  trapped: boolean;
  sessionId: string | null;
}

export type GuardResult<T> =
  { ok: true; value: GuardedRequest<T> } | { ok: false; response: NextResponse };

/** Forms completed impossibly fast were not completed by a person. */
const MIN_ELAPSED_MS = 1200;

export async function guard<T extends { website_url?: string; elapsed_ms?: number }>(
  request: Request,
  route: string,
  schema: ZodType<T>,
): Promise<GuardResult<T>> {
  if (!sameOrigin(request)) {
    return { ok: false, response: fail("Request rejected.", 403, { code: "cross_origin" }) };
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return {
      ok: false,
      response: fail("Expected JSON.", 415, { code: "unsupported_media_type" }),
    };
  }

  const ip = clientIpFrom(request.headers);
  const limit = checkRateLimit(route, ip);
  if (!limit.allowed) {
    logger.warn("rate limited", { route, retryAfter: limit.retryAfter });
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          error: "That's a lot of submissions in a short time. Please try again shortly.",
          code: "rate_limited",
        },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      ),
    };
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return { ok: false, response: fail("Malformed request body.", 400, { code: "bad_json" }) };
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, response: validationFailed(parsed.error) };
  }

  const value = parsed.data;
  const elapsed = value.elapsed_ms;
  const trapped =
    Boolean(value.website_url && value.website_url.trim().length > 0) ||
    (typeof elapsed === "number" && elapsed > 0 && elapsed < MIN_ELAPSED_MS);

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

  return {
    ok: true,
    value: {
      data: value,
      context,
      trapped,
      sessionId: (value as { session_id?: string }).session_id ?? null,
    },
  };
}

/** Uniform failure for an unexpected server error — never leaks internals. */
export function serverError(route: string, error: unknown): NextResponse<ApiFailure> {
  logger.error("route failed", { route, error: (error as Error)?.message ?? String(error) });
  return fail(
    "We couldn't save that just now. Your answers are still here — please try again.",
    500,
    { code: "server_error" },
  );
}
