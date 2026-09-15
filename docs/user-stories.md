# User Stories and Acceptance Criteria

Roles: **Athlete** (prospective client) · **Former client** · **Coach** · **Operator** (us).
Each story maps to functional requirements in `docs/02-requirements.md` and is covered by the
tests listed in `docs/test-results.md`.

---

## Journey A — Athlete searching for a coach

### US-01 Understand the proposition quickly

_As an athlete arriving from Instagram, I want to understand what this site does within a few
seconds, so I can decide whether to keep reading._

- **AC1** Given a 360px viewport, when the landing page loads, then the headline, one
  supporting sentence, the primary CTA and the search field are visible without scrolling
  past the fold on a typical phone.
- **AC2** The headline is ≤ 12 words and names the audience (bodybuilding coach) and the job
  (research before committing).
- **AC3** An "early validation / prelaunch" disclosure is present on the page.
- **AC4** `landing_viewed` fires once per page view with the assigned variant.

### US-02 Search from the hero

_As an athlete, I want to type a coach's name, team or social handle in the hero, so I can go
straight to what I came for._

- **AC1** The field accepts free text and is labelled for screen readers.
- **AC2** Focusing or first keystroke fires `hero_search_started` at most once per page view.
- **AC3** Submitting navigates to `/coaches?q=<query>` and fires `coach_search_submitted`.
- **AC4** Submitting an empty query does not navigate and does not fire an event.

### US-03 Browse and filter the directory

_As an athlete, I want to filter coaches by what matters to me, so I can shortlist quickly._

- **AC1** All seven filter facets function against demo data and combine with AND semantics
  (multi-select within a facet is OR).
- **AC2** Filter state is encoded in the URL and restored on reload and back-navigation.
- **AC3** Each filter change fires `filter_selected` with facet, value and resulting count.
- **AC4** A visible count of matching demonstration profiles is shown; no aggregate
  marketplace statistics are displayed.
- **AC5** Clearing filters returns the full demo set.

### US-04 Recognise demonstration data

_As an athlete, I want to know immediately that preview profiles are not real coaches, so I am
not misled._

- **AC1** Every demo coach card carries a "Demo" marker.
- **AC2** Every demo profile page carries a banner reading "Demonstration profile — not a
  real coach".
- **AC3** Demo names are constructed to be obviously illustrative and no real coach, team or
  handle is represented.
- **AC4** Demo profile pages are `noindex` and excluded from the sitemap.

### US-05 Open a coach profile

_As an athlete, I want to open a profile and see what would be known about a coach._

- **AC1** Clicking a card opens `/coaches/<slug>` and fires `coach_profile_opened`.
- **AC2** The profile shows every field in FR-3.1.
- **AC3** Review-summary and public-source-summary areas are shown as unavailable, never as
  fabricated content.

### US-06 Hit an honest feature gate

_As an athlete, I want an honest explanation when a feature is not ready, so I keep trusting
the site._

- **AC1** Activating reviews / verified reviews / AI summary / compare / save opens a panel
  containing the early-access message.
- **AC2** The panel does not state or imply that reviews already exist behind it.
- **AC3** The triggering feature fires its event (`review_feature_clicked`,
  `ai_summary_clicked`, `compare_clicked`, `save_coach_clicked`).
- **AC4** The panel offers the waitlist with the coach and feature prefilled.
- **AC5** The panel is a focus-trapped dialog, closable with Escape, returning focus to the
  trigger.

### US-07 Join the waitlist from a gate

_As an athlete, I want to be told when the feature I wanted is ready._

- **AC1** Submitting stores `trigger_feature`, `trigger_coach_id` and `trigger_page`.
- **AC2** `waitlist_completed` fires with the trigger feature.

## Journey B — Former client

### US-08 Understand what happens to my review

_As a former client, I want to know my submission stays private, so I feel safe writing it._

- **AC1** The privacy statement appears above the form, before any field.
- **AC2** Publication requires a separate, unticked opt-in.
- **AC3** No verification documents or uploads are requested.

### US-09 Submit a structured review

_As a former client, I want to describe my experience in a structured way._

- **AC1** All FR-6.1 fields are present; the four ratings use an accessible 1–5 control.
- **AC2** Required fields are enforced server-side with field-level error messages.
- **AC3** `review_form_started` fires on first interaction; `review_form_completed` on success.
- **AC4** The success state confirms privacy and offers the founding-reviewer waitlist.
- **AC5** The submission is stored and is not retrievable from any public endpoint.

### US-10 Be protected from my own mistakes

_As a former client, I want to be stopped from submitting something legally dangerous._

- **AC1** Server-side prohibited-content screening flags criminal accusations and contact-detail
  dumps and returns a non-judgemental correction message.
- **AC2** Flagged submissions are rejected with guidance, not silently stored.

## Journey C — Coach

### US-11 List or claim

_As a coach, I want to add or claim my profile._

- **AC1** All FR-7.1 fields are present; business email is required and validated.
- **AC2** The claim-limitation statement is displayed before the submit control.
- **AC3** `coach_claim_started` / `coach_claim_completed` fire.
- **AC4** Interest is multi-select.

### US-12 Understand the limits of claiming

_As a coach, I want to know exactly what claiming gives me._

- **AC1** The statement appears on the form page and on every demo profile's claim action.
- **AC2** The site never offers review removal, anywhere.

## Journey D — Unmatched search

### US-13 Be told honestly that a coach is missing

_As an athlete searching a real coach, I want a clear "not yet" and a way to be notified._

- **AC1** Zero results renders "We don't have this coach yet."
- **AC2** `coach_search_zero_results` fires with the normalised query.
- **AC3** The query is persisted as a `SearchEvent` with `result_count = 0`.
- **AC4** "Request this coach" prefills the query into the submit-a-coach form.
- **AC5** The form accepts IG/TikTok handles and an optional email.
- **AC6** `coach_requested` fires on success and the request is linked to the waitlist entry
  when an email is supplied.

### US-14 Aggregate repeat demand

_As the operator, I want repeated searches for the same coach ranked, so I know who to research._

- **AC1** Search terms are normalised (lowercased, `@`/punctuation/whitespace collapsed).
- **AC2** The admin view ranks unmatched terms by unique-session count.

## Operator

### US-15 See what came in

- **AC1** `/admin` requires credentials and returns 401 without them.
- **AC2** It shows counts and recent rows for all seven persisted datasets plus funnel and demand rankings.

### US-16 Export

- **AC1** Each dataset exports as CSV with a stable header row and RFC-4180 escaping.
- **AC2** Export requires the same credentials.

### US-17 Protect private data

- **AC1** No public route returns waitlist emails, review text, or coach contact details.
- **AC2** Admin routes are `noindex`, disallowed in `robots.txt`, absent from the sitemap.

### US-18 Trust and disclosure pages

- **AC1** Methodology, Privacy and Terms are reachable from the footer of every page.
- **AC2** All ten §19 disclosures appear across those pages.

### US-19 Attribution is preserved

- **AC1** UTM and referrer captured on first landing, persisted for the session, attached to
  every event and submission.
- **AC2** Later internal navigation does not overwrite the original attribution.

### US-20 Consistent experiment assignment

- **AC1** Assignment is deterministic from the anonymous visitor id.
- **AC2** The same visitor sees the same variant on every page and on return.
- **AC3** `?variant=b` overrides for QA and is reflected in events.

### US-21 Health and observability

- **AC1** `/api/health` returns status, version, database driver and timestamp.
- **AC2** Submissions and failures emit structured JSON logs without PII.

### US-22 Graceful failure

- **AC1** A database failure returns a friendly error and preserves entered form values.
- **AC2** Analytics failure never blocks navigation or form submission.

### US-23 Abuse resistance

- **AC1** Per-IP-hash rate limits on all write endpoints return 429 with `Retry-After`.
- **AC2** A filled honeypot is accepted at the HTTP level but not persisted.

### US-24 Accessible forms

- **AC1** Every control has a programmatic label; errors use `aria-describedby` and are
  announced in a live region.
- **AC2** Full keyboard operability; visible focus; no keyboard traps outside intentional
  dialog traps.
