import { NextResponse, type NextRequest } from "next/server";

import { assignVariant, isVariantId } from "@/lib/experiment";
import {
  ATTRIBUTION_COOKIE_MAX_AGE,
  COOKIES,
  VISITOR_COOKIE_MAX_AGE,
  decodeAttribution,
  encodeAttribution,
  hasAttribution,
  readAttributionFromUrl,
} from "@/lib/request-context";

/**
 * Next.js "proxy" (formerly middleware). Three jobs, in order:
 *   1. Gate /admin behind HTTP Basic (or disable it entirely if unconfigured).
 *   2. Give every visitor a stable anonymous id and a deterministic variant.
 *   3. Record first-touch attribution once and never overwrite it.
 */

function unauthorized(): NextResponse {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="PrepCoach Reviews operator", charset="UTF-8"',
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

/**
 * Constant-time-ish comparison using Web Crypto, which is available in both the
 * edge and node runtimes (`node:crypto` is not guaranteed on the edge).
 */
async function digest(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function credentialsMatch(provided: string, expected: string): Promise<boolean> {
  const [a, b] = await Promise.all([digest(provided), digest(expected)]);
  // Both operands are fixed-length hex digests, so the loop below runs for a
  // constant number of iterations regardless of the input.
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function guardAdmin(request: NextRequest): Promise<NextResponse | null> {
  const user = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD;

  // Unconfigured means disabled, never open.
  if (!user || !password) {
    return new NextResponse(
      "Administrator access is not configured. Set ADMIN_USER and ADMIN_PASSWORD.",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return unauthorized();

  let decoded: string;
  try {
    decoded = atob(header.slice(6));
  } catch {
    return unauthorized();
  }
  const separator = decoded.indexOf(":");
  if (separator === -1) return unauthorized();

  const [okUser, okPassword] = await Promise.all([
    credentialsMatch(decoded.slice(0, separator), user),
    credentialsMatch(decoded.slice(separator + 1), password),
  ]);
  return okUser && okPassword ? null : unauthorized();
}

function randomId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { nextUrl } = request;

  if (nextUrl.pathname.startsWith("/admin")) {
    const denied = await guardAdmin(request);
    if (denied) return denied;
  }

  const response = NextResponse.next();

  // --- anonymous visitor id -------------------------------------------------
  let visitorId = request.cookies.get(COOKIES.visitor)?.value;
  if (!visitorId || visitorId.length < 16) {
    visitorId = randomId();
    response.cookies.set(COOKIES.visitor, visitorId, {
      maxAge: VISITOR_COOKIE_MAX_AGE,
      sameSite: "lax",
      httpOnly: false, // read by the analytics client; contains no personal data
      secure: nextUrl.protocol === "https:",
      path: "/",
    });
  }

  // --- experiment variant ---------------------------------------------------
  const override = nextUrl.searchParams.get("variant");
  const existing = request.cookies.get(COOKIES.variant)?.value;
  const variant = isVariantId(override)
    ? override
    : isVariantId(existing)
      ? existing
      : assignVariant(visitorId);
  if (variant !== existing) {
    response.cookies.set(COOKIES.variant, variant, {
      maxAge: VISITOR_COOKIE_MAX_AGE,
      sameSite: "lax",
      httpOnly: false,
      secure: nextUrl.protocol === "https:",
      path: "/",
    });
  }

  // --- first-touch attribution ---------------------------------------------
  const stored = decodeAttribution(request.cookies.get(COOKIES.attribution)?.value);
  if (!hasAttribution(stored)) {
    const incoming = readAttributionFromUrl(nextUrl, request.headers.get("referer"));
    // Only write when there is something worth keeping, or when nothing has
    // been recorded at all (so the landing page is captured for direct traffic).
    if (hasAttribution(incoming) || !stored.l) {
      response.cookies.set(COOKIES.attribution, encodeAttribution(incoming), {
        maxAge: ATTRIBUTION_COOKIE_MAX_AGE,
        sameSite: "lax",
        httpOnly: false,
        secure: nextUrl.protocol === "https:",
        path: "/",
      });
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except static assets and the image optimiser.
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|xml|woff2?)$).*)",
  ],
};
