# Phase 4 — Architecture

## 4.1 Application architecture

Next.js 16 (App Router) on Node, TypeScript strict, Tailwind v4, deployed as a single Vercel
project. No separate backend: server routes live beside the pages they serve.

```
        ┌──────────────────────── Browser ────────────────────────┐
        │  Server Components (static content, demo data)          │
        │  Client Components (search, filters, forms, gates)      │
        │  analytics client → queue → sendBeacon                  │
        └───────┬──────────────────────────────┬──────────────────┘
                │ POST /api/*                  │ POST /api/events
        ┌───────▼──────────────────────────────▼──────────────────┐
        │  proxy.ts       visitor id · variant · attribution ·    │
        │                  admin basic-auth · security headers     │
        ├──────────────────────────────────────────────────────────┤
        │  route handlers  zod parse → honeypot → rate limit →     │
        │                  sanitise → content screen → persist     │
        ├──────────────────────────────────────────────────────────┤
        │  lib/db  Repository interface                            │
        │      ├── PostgresDriver  (DATABASE_URL → Supabase)       │
        │      └── JsonFileDriver  (.data/*.ndjson, default)       │
        └──────────────────────────────────────────────────────────┘
```

**Server/client boundary**

- Server by default. Client components only where interaction demands it: hero search,
  directory search/filters, every form, feature-intent dialogs, the analytics provider.
- Demo coach data is imported by both sides (it is static, public, fictional) and is the only
  data that crosses the boundary.
- Nothing written by a user is ever read back into a public page.
- All validation runs server-side in the route handler; client validation is a courtesy only.

## 4.2 Data model

Tables (see `docs/data-model.md` for every column):

| Table                        | Purpose                                                       | Contains PII      |
| ---------------------------- | ------------------------------------------------------------- | ----------------- |
| `waitlist_entries`           | Q6/Q9/Q10 signups                                             | email             |
| `search_events`              | Q1/Q2 queries + result counts                                 | no                |
| `analytics_events`           | Q1–Q10 behavioural stream                                     | no                |
| `demo_coaches`               | Fictional directory seed (mirrors `src/data/demo-coaches.ts`) | no (fictional)    |
| `coach_requests`             | Q1 missing-coach demand                                       | optional email    |
| `private_review_submissions` | Q5 founding reviews                                           | email + free text |
| `coach_claim_interest`       | Q7 coach supply                                               | business email    |
| `contact_submissions`        | General/deletion requests                                     | email             |
| `experiment_variants`        | Variant registry + assignment counts                          | no                |
| `admin_users`                | Operator access (hashed)                                      | credential        |

Relationships are intentionally loose (nullable foreign keys, no cascades): a smoke test must
never lose a signal because a join failed.

## 4.3 Persistence: dual driver

`src/lib/db/index.ts` exports a single `getDb(): Repository`.

- **`JsonFileDriver`** (default when `DATABASE_URL` is unset): append-only NDJSON files under
  `.data/`, with an in-process write mutex. Zero setup, zero credentials, adequate for a smoke
  test on a single instance. **Not** for multi-instance production.
- **`PostgresDriver`** (`DATABASE_URL` set): `pg` pool, parameterised SQL only, SSL required
  for non-local hosts. This is the production path (Supabase Postgres).

Both satisfy identical typed methods, so route handlers are driver-agnostic and unit tests run
against an in-memory driver.

**Migrations** live in `supabase/migrations/*.sql` — plain SQL, forward-only, idempotent
(`create table if not exists`). Applied with `npm run db:migrate` or the Supabase CLI.
Seeding (`npm run db:seed`) inserts the fictional coaches and experiment variants.

**Row-level security:** every table has RLS enabled and **no** policy granting the `anon` role
access. The app connects with the service role / direct connection string from the server only.
The Supabase anon key is never used and never shipped to the client.

## 4.4 Form-submission flow

```
client form (client component)
  └─ POST /api/<form>  JSON
       1. method + content-type check
       2. honeypot field present & non-empty → 200 OK, discard  (silent to bots)
       3. rate limit by (route, salted-IP-hash) — sliding window, in-memory
       4. zod parse  → 422 with per-field errors
       5. sanitise: trim, strip control chars, strip HTML tags, cap lengths, normalise handles
       6. content screen (review + request text): prohibited-content patterns → 422 guidance
       7. attribution merge: server-trusted cookies (visitor, variant, utm) override client
       8. persist via Repository (waitlist: upsert-by-email-hash, merging new context)
       9. structured log {event, route, ok, ms, id} — never PII
      10. 201 { ok: true, id } → client renders success panel, fires *_completed
```

Failures return `{ ok:false, error, fieldErrors? }`; the client keeps all entered values.

## 4.5 Analytics-event flow

```
component → track(name, props)
   → client queue (dedupe per page-view for once-only events)
   → batch flush: visibilitychange / 3s / 10 events, via sendBeacon (fetch keepalive fallback)
   → POST /api/events  { events:[...] }
        zod parse → event-name allow-list → property allow-list (unknown keys dropped)
        → PII guard: reject any property value matching an email or long free text
        → enrich server-side: visitor/session id, variant, device class, utm, ts
        → AnalyticsProvider.capture()
             ├── InternalProvider  → analytics_events table   (default)
             └── PlausibleProvider → optional, if PLAUSIBLE_* set (no PII, no cookies)
```

The property allow-list is enforced **server-side**, so even a tampered client cannot write
emails or review text into the event stream.

> **Naming note.** Next.js 16 renamed the `middleware.ts` file convention to `proxy.ts`;
> the exported function is `proxy`. It is the same request-interception layer, and this
> document uses the two terms interchangeably where the runtime behaviour is what matters.

## 4.6 Experiment assignment

`src/proxy.ts` issues `pcr_vid` (128-bit random, 180-day, `SameSite=Lax`, `HttpOnly=false` so
the client can read it for session correlation — it carries no personal data). The variant is
`FNV-1a(pcr_vid + EXPERIMENT_SALT) % 2` → `a` | `b`, computed once and cached in `pcr_variant`.
Deterministic, stable across pages and sessions, no storage round-trip. `?variant=a|b`
overrides and marks the event `forced:true` so QA traffic can be excluded.

## 4.7 Attribution capture

On the first request of a session, `src/proxy.ts` reads `utm_*`, `ref`, `gclid`-style params and
`Referer`, and writes a single compact `pcr_attr` cookie (session-scoped, 30-day). Later
navigations never overwrite a non-empty attribution — first-touch wins, which is what the
channel comparison needs.

## 4.8 Administrator access

`/admin` and `/admin/export/*` are protected in `src/proxy.ts` by HTTP Basic against
`ADMIN_USER` / `ADMIN_PASSWORD` (compared with a timing-safe equality check). Absent env vars
means admin is **disabled entirely** (503), never open. The paths are `noindex`,
`Disallow`-ed in `robots.txt`, and excluded from the sitemap. Supabase Auth can replace Basic
later without touching the pages (`docs/deployment.md` §Admin).

## 4.9 Environment variables

| Name                                  | Required    | Default                      | Purpose                                                 |
| ------------------------------------- | ----------- | ---------------------------- | ------------------------------------------------------- |
| `DATABASE_URL`                        | no          | —                            | Postgres/Supabase connection. Unset → local JSON driver |
| `DATABASE_SSL`                        | no          | auto                         | `require`/`disable` override                            |
| `ADMIN_USER`                          | for admin   | —                            | Basic auth user                                         |
| `ADMIN_PASSWORD`                      | for admin   | —                            | Basic auth password (≥16 chars)                         |
| `EXPERIMENT_SALT`                     | no          | `pcr-default-salt`           | Variant bucketing salt                                  |
| `IP_HASH_SALT`                        | recommended | ephemeral per boot           | Salt for rate-limit IP hashing                          |
| `NEXT_PUBLIC_SITE_URL`                | prod        | `http://localhost:3000`      | Canonicals, OG, sitemap                                 |
| `NEXT_PUBLIC_ANALYTICS_DEBUG`         | no          | `false`                      | Log events to console in dev                            |
| `PLAUSIBLE_HOST` / `PLAUSIBLE_DOMAIN` | no          | —                            | Optional second analytics sink                          |
| `CONTACT_EMAIL`                       | no          | `hello@prepcoachreviews.com` | Shown on legal pages                                    |
| `SENTRY_DSN`                          | no          | —                            | Optional error monitoring                               |

Only `NEXT_PUBLIC_*` reaches the browser. `.env.example` documents all of them; `.env*` is
git-ignored.

## 4.10 Security controls

| Control          | Implementation                                                                                                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Input validation | Zod at every boundary; unknown keys stripped (`.strict()` where safe)                                                                                                                                                          |
| Injection        | Parameterised SQL only; no string-built queries; no ORM raw passthrough                                                                                                                                                        |
| XSS              | User-submitted text is never rendered on a public page at all; HTML tags stripped on ingest. The single `dangerouslySetInnerHTML` is the static, developer-authored JSON-LD block in `layout.tsx`, which no user input reaches |
| CSRF             | Same-origin `Origin`/`Sec-Fetch-Site` check on every POST; JSON-only content type                                                                                                                                              |
| Rate limiting    | Sliding window per route × salted IP hash; 429 + `Retry-After`                                                                                                                                                                 |
| Bot/spam         | Honeypot field + minimum time-to-submit + content screening                                                                                                                                                                    |
| Secrets          | Server-only env; no secrets in client bundles; admin creds compared timing-safely                                                                                                                                              |
| Headers          | CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, restrictive `Permissions-Policy`                                                                             |
| PII exposure     | No public read endpoint returns submissions; admin is auth-gated and `noindex`                                                                                                                                                 |
| Logging          | Structured JSON, PII-free; emails appear only as `sha256(email+salt)[:12]`                                                                                                                                                     |
| Dependencies     | Small surface: `next`, `react`, `zod`, `pg` in production                                                                                                                                                                      |

## 4.11 Deployment architecture

```
GitHub ──push──▶ Vercel build ──▶ Edge (static/ISR pages, proxy)
                                └─▶ Node functions (route handlers)
                                        │
                              Supabase Postgres (RLS on, service-role access)
```

Static: landing, legal, methodology. Dynamic: directory (reads search params), profiles
(generated at build via `generateStaticParams`), all `/api/*`, `/admin`.
Rollback = Vercel instant rollback to the previous deployment; migrations are additive and
forward-only so a rollback never requires a down-migration.

## 4.12 Future migration path to the full marketplace

The smoke test is deliberately _shaped like_ the eventual system so nothing is thrown away:

1. **Data** — `demo_coaches` becomes `coaches` with `is_demo=false` records; the column set is
   already the real one. `private_review_submissions` becomes `reviews` with the addition of
   `status` (`pending|verified|published|rejected`), `moderator_id`, `published_at` — the
   review text, ratings and permissions are already captured in publishable shape.
2. **Auth** — Basic-auth admin → Supabase Auth with roles (`operator`, `moderator`, `coach`);
   the RLS "deny all to anon" posture already assumes an authenticated future.
3. **Analytics** — the provider abstraction means swapping/adding a warehouse sink is one file.
4. **Gates** — each feature gate is a component boundary; shipping the real feature means
   replacing the gate component, and the gate's event names keep working as a funnel.
5. **Waitlist → users** — `waitlist_entries.email_hash` lets us link a future account to its
   prelaunch intent without storing anything extra.
6. **What must be rebuilt** — persistence must move off `JsonFileDriver` (single-instance only),
   rate limiting must move from in-process memory to Redis/Upstash, and moderation must become
   a real workflow with legal review. These are listed as explicit debt in
   `docs/post-validation-roadmap.md`.
