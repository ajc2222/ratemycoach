# Phase 2 — Product Requirements (PRD)

**Product:** PrepCoach Reviews — prelaunch smoke test
**Version:** 1.0 · 2026-09-15
**Owner:** Founding team
**Status:** Built

---

## 2.1 Summary

A production-quality prelaunch website that presents PrepCoach Reviews — an independent
discovery and review platform for online bodybuilding coaches — and instruments the visitor's
behaviour well enough to answer ten validation questions before marketplace engineering begins.

It is a **smoke test**, not a marketplace. It must present the future product honestly: no
capability is implied to exist that does not, no review is displayed, no rating is fabricated,
and every demonstration coach is visibly fictional.

## 2.2 Goals

| #   | Goal                                                           | Measure                                                 |
| --- | -------------------------------------------------------------- | ------------------------------------------------------- |
| G1  | Determine whether athletes search for named coaches            | Unique real coach names searched                        |
| G2  | Determine whether former clients will supply firsthand reviews | Completed private reviews                               |
| G3  | Determine whether coaches will self-list                       | Claim/listing submissions                               |
| G4  | Rank the three evidence layers by demand                       | Feature-gate click distribution                         |
| G5  | Rank divisions and filters by demand                           | Category/filter event distribution                      |
| G6  | Compare acquisition channels by intent                         | Conversion by UTM source                                |
| G7  | Do all of the above without misleading anyone                  | Content-safety review passes (`docs/content-safety.md`) |

## 2.3 Non-goals (MVP exclusions)

Explicitly **not** built: user authentication or public accounts; payments; coach
subscriptions; public review publishing; automated review verification; AI forum ingestion or
any scraping; automated moderation; coach↔athlete messaging; recommendation algorithms; a
production marketplace backend; native mobile apps; email sending/drip automation; real coach
records; per-coach SEO landing pages for real people.

## 2.4 The ten validation questions → where they are answered

| Q   | Question                                   | Instrumentation                                                            |
| --- | ------------------------------------------ | -------------------------------------------------------------------------- |
| Q1  | Will athletes search for a specific coach? | `hero_search_started`, `coach_search_submitted`, `SearchEvent`             |
| Q2  | Will athletes browse profiles?             | `coach_profile_opened`, search→profile conversion                          |
| Q3  | Which filters matter?                      | `filter_selected` by facet+value                                           |
| Q4  | Will visitors try to read reviews?         | `review_feature_clicked`                                                   |
| Q5  | Will clients submit reviews?               | `review_form_started` / `review_form_completed`, `PrivateReviewSubmission` |
| Q6  | Will visitors join the waitlist?           | `waitlist_started` / `waitlist_completed`                                  |
| Q7  | Will coaches ask to be listed?             | `coach_claim_*`, `CoachClaimInterest`                                      |
| Q8  | Reviews vs AI summaries vs comparison?     | `review_feature_clicked` vs `ai_summary_clicked` vs `compare_clicked`      |
| Q9  | Which divisions?                           | `category_selected`, division filters, waitlist division                   |
| Q10 | Which channel is highest-intent?           | UTM on every event + submission                                            |

## 2.5 Personas

- **P1 "First prep" — Maya, 26, Bikini.** Two IG coaches in mind, $300/mo, terrified of
  picking wrong. Needs: what do clients say, what does $300 actually buy.
- **P2 "Burned" — Dan, 31, Classic Physique.** Previous coach ghosted him at 4 weeks out.
  Shopping on communication and process. Most likely reviewer.
- **P3 "Coach" — Leah, 34, runs a 12-athlete team.** Wants control of her listing, wary of
  a review site she cannot moderate.
- **P4 "Lurker" — anonymous Reddit reader.** Won't sign up; may still search. Counts for Q1
  and nothing else.

## 2.6 User stories and acceptance criteria

Full list with Given/When/Then: **`docs/user-stories.md`** (US-01 … US-24).

## 2.7 Functional requirements

### FR-1 Landing page

- FR-1.1 Hero with headline determined by experiment variant, supporting copy, primary CTA
  "Find a coach", secondary CTA "Review a coach".
- FR-1.2 Search field in the hero accepting coach name, team name, Instagram or TikTok handle;
  submitting navigates to the directory with the query applied.
- FR-1.3 "Three layers of evidence" trust section, stating explicitly that AI summaries
  summarise approved public sources and are not firsthand reviews.
- FR-1.4 Three-step "How it works".
- FR-1.5 Category exploration covering the 7 IFBB-style divisions plus natural/enhanced;
  every selection is tracked and navigates to a filtered directory.
- FR-1.6 At least one demonstration profile preview, visibly labelled "Demonstration profile
  — not a real coach".
- FR-1.7 Waitlist section listing exactly four early-member benefits; no rewards, discounts,
  or unapproved functionality promised.
- FR-1.8 FAQ answering the eight required questions in prelaunch-appropriate language.
- FR-1.9 An early-validation disclosure is visible on every page.

### FR-2 Directory

- FR-2.1 Search across coach name, team, Instagram handle, TikTok handle (case/punctuation
  and `@`-insensitive).
- FR-2.2 Filters: division, coaching type, natural/enhanced/both, federation, monthly price,
  remote/in-person, accepting clients. All functional against demo data.
- FR-2.3 Filter state is reflected in the URL (shareable, back-button safe).
- FR-2.4 8–15 fictional coach profiles spanning all divisions, both focuses, and the price range.
- FR-2.5 Coach card shows name, team, specialties, divisions, natural/enhanced focus, price
  range, remote/in-person, profile status, and a view-profile action.
- FR-2.6 Zero-result state offers "Request this coach" and captures the query.
- FR-2.7 No fabricated aggregate marketplace statistics anywhere.
- FR-2.8 Every search, filter change, result count and profile click is captured.

### FR-3 Coach profile preview

- FR-3.1 Renders all fields in §8 of the brief, including review-summary and public-source
  summary previews shown as _unavailable_, not as content.
- FR-3.2 Actions: read all reviews, verified reviews, AI summary, compare, save, review this
  coach, claim this profile.
- FR-3.3 Demonstration banner on every fictional profile.
- FR-3.4 `noindex` on demonstration profiles.

### FR-4 Feature-intent gates

- FR-4.1 The five gated features (reviews, verified reviews, AI summary, compare, save) open a
  transparent early-access panel.
- FR-4.2 The panel must not imply hidden reviews exist.
- FR-4.3 The triggering feature and coach are recorded and prefilled into the waitlist.

### FR-5 Waitlist

- FR-5.1 Required: email, role, primary division/interest, current intent, consent.
- FR-5.2 Optional: coach searched for, coach handle, has paid for coaching before, budget,
  most important decision factor, acquisition source.
- FR-5.3 Auto-attached: variant, referrer, UTM (source/medium/campaign/term/content), trigger
  page, trigger coach, trigger feature, device category, timestamp.
- FR-5.4 Consent is never preselected.
- FR-5.5 Duplicate emails do not create a second record; new behavioural context is merged
  onto the existing record and the submission count is incremented.

### FR-6 Private review submission

- FR-6.1 Collects all fields in §10 of the brief.
- FR-6.2 States clearly that submissions are private, not auto-published, and subject to
  moderation and verification.
- FR-6.3 No verification documents or file uploads are requested.
- FR-6.4 Never displayed publicly; not exposed by any public endpoint.
- FR-6.5 Server-side validation, rate limiting, honeypot, sanitisation, prohibited-content checks.
- FR-6.6 Two explicit permissions captured separately: contact, and publication-after-moderation.
- FR-6.7 Firsthand-accuracy attestation is required.

### FR-7 Coach listing / claim

- FR-7.1 Collects all fields in §11 of the brief.
- FR-7.2 Displays the claim limitation statement verbatim before submission.
- FR-7.3 Multi-select interest including "learn about future promoted placement".

### FR-8 Submit-a-coach

- FR-8.1 Collects coach name, team, IG, TikTok, website, reason, optional email.
- FR-8.2 Reachable from zero-result searches with the query prefilled.
- FR-8.3 Aggregated with unmatched searches to rank research priority (admin view).

### FR-9 Analytics

- FR-9.1 The 19 events in §15 are implemented and emitted.
- FR-9.2 Provider abstraction; internal event table is the default provider.
- FR-9.3 No email, name, or review text is ever sent to analytics.
- FR-9.4 Anonymous session id; no cross-site tracking; no third-party cookies.

### FR-10 Experiment

- FR-10.1 Two landing headline variants, A and B.
- FR-10.2 Deterministic per-visitor assignment, stable across pages and sessions.
- FR-10.3 `?variant=a|b` override for QA.
- FR-10.4 Variant attached to every event and submission.

### FR-11 Admin

- FR-11.1 Protected admin view of all collected submissions and demand rankings.
- FR-11.2 CSV export per dataset.
- FR-11.3 Denied without valid credentials; never linked publicly; `noindex`; excluded from sitemap.

### FR-12 Legal/trust pages

- FR-12.1 Methodology & trust, Privacy, Terms & disclaimer, all with the §19 disclosures.
- FR-12.2 Data-deletion and contact instructions.

## 2.8 Non-functional requirements

| #      | Requirement             | Target                                                                                      | Verification                                  |
| ------ | ----------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------- |
| NFR-1  | Mobile-first responsive | 360px → 1920px, no horizontal scroll                                                        | Playwright viewport tests                     |
| NFR-2  | Performance             | Static/ISR where possible; LCP element is text; no render-blocking third-party JS           | Build output; manual Lighthouse               |
| NFR-3  | Accessibility           | WCAG 2.2 AA where practical                                                                 | axe-core on every public page, keyboard tests |
| NFR-4  | Comprehension           | Proposition understandable in 5s                                                            | Hero ≤ 12 words + 1 sentence + 1 action       |
| NFR-5  | Security                | No public access to PII; rate limiting; honeypot; sanitisation; strict CSP-adjacent headers | Security tests + `docs/security-review.md`    |
| NFR-6  | Privacy                 | Data minimisation; consent not preselected; deletion path                                   | Privacy review                                |
| NFR-7  | Reliability             | Health endpoint; structured logs; graceful DB-failure UX                                    | `/api/health`, error-path tests               |
| NFR-8  | Portability             | Runs with zero external credentials (local driver)                                          | `npm run dev` on a clean clone                |
| NFR-9  | Maintainability         | TS strict, ESLint clean, Prettier formatted, typed validation at the boundary               | `npm run verify`                              |
| NFR-10 | Browser support         | Last 2 versions of evergreen browsers; graceful no-JS degradation for content               | Manual                                        |

## 2.9 Analytics plan

See **`docs/analytics-events.md`** (event dictionary) and §15 of the brief. Key rules:
one canonical `track()` entry point; events are queued and flushed with `sendBeacon`;
every event carries session id, variant, page, device, and UTM; property allow-list is
enforced **server-side** so a malicious client cannot inject PII into the event table.

## 2.10 Privacy requirements

See **`docs/privacy-notes.md`**. Summary: collect only what a validation question needs;
email is the only identifier requested and always with purpose-specific consent; review text
is private by default and publication requires separate opt-in; IP addresses are never stored
(only a salted, rotating hash for rate limiting); no third-party analytics; deletion on request.

## 2.11 Content-safety requirements

See **`docs/content-safety.md`**. Summary: no fake reviews/ratings/counts/scarcity; all demo
data visibly fictional; no claims about real people; no medical advice; natural/enhanced is a
coaching-focus label and never an allegation about an individual; submitted text is screened
for prohibited content and never auto-published; no scraping.

## 2.12 Experiment plan

See **`docs/experiment-plan.md`**.

## 2.13 Release criteria

The Definition of Done in §23 of the brief, verified in `docs/test-results.md` and
`docs/launch-checklist.md`.
