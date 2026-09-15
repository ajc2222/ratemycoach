# Phase 1 — Discovery

**Product:** PrepCoach Reviews (working name)
**Artifact type:** Prelaunch smoke test
**Date:** 2026-09-15

---

## 1.1 Repository inspection

The repository at `/home/aj/ratemycoach` was an initialised but **empty** git repository
(`main` branch, zero commits, no files other than `.git/`).

**Consequences for this build:**

| Finding                    | Consequence                                                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No existing stack          | Free choice of stack; picked the stack named in the brief (Next.js + TS + Tailwind + Postgres/Supabase + Zod + Vitest + Playwright).                    |
| No reusable components     | Everything is written from scratch; design tokens defined once in `src/app/globals.css` and reused.                                                     |
| No existing CI             | A minimal GitHub Actions workflow is provided (`.github/workflows/ci.yml`).                                                                             |
| Repo name is `ratemycoach` | Package name stays `ratemycoach`; the product name **PrepCoach Reviews** lives in content/config so it can be renamed in one place (`src/lib/site.ts`). |

**Environment constraints observed**

- Node v22.15.0, npm 10.9.2, Linux (WSL2). npm registry reachable.
- **No Supabase / Postgres credentials are present in the environment**, and no hosting
  provider credentials were supplied for an authorised deploy. The application therefore
  ships with a dual-driver persistence layer (see `docs/04-architecture.md`): a
  zero-dependency local JSON driver used by default, and a Postgres driver used whenever
  `DATABASE_URL` is set. Production configuration is documented in `docs/deployment.md`.

## 1.2 Customer

**Primary:** An amateur or aspiring competitive bodybuilder, 18–40, who is about to spend
$150–$600+/month on an online prep coach and has no independent way to check that coach out.

Segments inside that:

- **First-time competitor** — highest anxiety, lowest information, most likely to be
  oversold by transformation photos. Highest value for us.
- **Between coaches** — has had one bad experience (ghosting, copy-paste macros, unsafe
  peak week) and is now explicitly shopping on process, not results.
- **Off-season / improvement-season athlete** — lower urgency, longer research window.
- **Former client with a story** — the supply side of reviews. Motivated by warning others
  or crediting a coach who did well by them.

**Secondary:** The coach. Cares about reputation, wants to control their listing, is a
future monetisation surface but is _not_ the customer whose trust we are protecting.

## 1.3 Problem

Choosing a bodybuilding prep coach is a high-cost, high-consequence, information-poor
decision.

- Evidence available today is almost entirely **marketing supplied by the seller**:
  transformation photos, client show placings, Instagram testimonials.
- Real signal (communication latency, whether the plan is individualised, how peak week is
  handled, what happens post-show, whether the coach disappears when things go wrong)
  is scattered across Reddit threads, private DMs, gym-floor gossip and closed Discords.
- There is no neutral place to compare two coaches on price, division fit, federation
  experience, service scope, and client-reported experience side by side.
- The consequences of a bad match are health-relevant (extreme dieting, rebound,
  hormonal and psychological fallout) as well as financial.

## 1.4 Solution hypothesis (what we would eventually build)

An independent discovery + review platform layering three clearly separated evidence types:

1. **Verified client reviews** — firsthand, moderated, verification-gated.
2. **Coach-provided profile facts** — claimed and maintained by the coach, labelled as such.
3. **Public-source AI summaries** — summaries of _approved_ public discussion, with
   citations, never presented as firsthand reviews.

## 1.5 Assumptions and the riskiest hypotheses

Full register with confidence, impact and test method: **`docs/assumption-register.md`.**

The three riskiest, in order:

1. **H1 — Demand for coach-specific research exists.** Athletes will type a _named, real_
   coach into a search box hoping to find that coach's reputation. If they do not, there is
   no discovery product. _Test:_ unique named-coach searches, from real traffic.
2. **H2 — Supply of firsthand reviews exists.** Former clients will write a structured,
   honest, attributable account of a paid coaching relationship, in a niche where the
   community is small, coaches are socially powerful, and retaliation is plausible.
   If they will not, the review layer is empty and the product collapses to a directory.
   _Test:_ completed private founding-review submissions.
3. **H3 — Coaches will engage rather than fight.** Coaches will ask to be listed / claim a
   profile even knowing they cannot delete legitimate reviews. If coaches uniformly refuse
   or react with hostility, the profile-quality and (later) monetisation paths are damaged.
   _Test:_ claim/listing submissions, and their tone.

Secondary but decision-relevant: which evidence layer people actually click (reviews vs AI
summary vs comparison), which divisions dominate, and which acquisition channel produces
intent rather than curiosity.

## 1.6 What this smoke test CAN prove

- That people arriving from a given channel understand the proposition (bounce/scroll/CTA).
- **Revealed** interest in researching a specific named coach (search queries are behaviour,
  not opinion).
- Relative demand between the three evidence layers, via feature-intent gate clicks.
- Relative demand by division and by natural/enhanced focus.
- Willingness to give an email against a stated intent horizon ("looking now" vs "later").
- **Willingness to do real work**: writing a multi-field firsthand review is costly, so a
  completed review is a strong signal.
- Whether coaches self-identify and volunteer contact information.
- Channel quality differences (Reddit vs IG vs TikTok vs direct outreach).

## 1.7 What this smoke test CANNOT prove

- **That reviews will be truthful, fair, or legally safe at scale.** A moderation and
  defamation-exposure model is unproven and is the single biggest non-demand risk.
- **That review supply is sustainable.** Early submissions are drawn from an unusually
  motivated population (people with a strong story, often negative). It does not predict
  steady-state coverage or balance.
- **That coverage density is achievable.** A directory is only useful once a searched coach
  is usually present. Nothing here proves we can reach that density.
- **Willingness to pay** — by anyone, on either side. No pricing is tested.
- **Retention or repeat use.** A smoke test measures a first session.
- **Unit economics or CAC** — organic/community traffic at small volume does not predict paid.
- **That AI public-source summaries are feasible, accurate, or permissible.** Nothing is
  ingested or generated here; only _interest_ in the concept is measured.
- **Legal/platform risk from coaches.** Takedown pressure appears at publication, and we
  publish nothing.

## 1.8 Alternative behaviours and competitors

Described from general category knowledge. No competitor content, copy, data or design was
copied, and nothing was scraped for this document.

**What athletes do today (the real competition is a behaviour, not a company):**

| Alternative                                | Why it is used                    | Where it fails                                                                               |
| ------------------------------------------ | --------------------------------- | -------------------------------------------------------------------------------------------- |
| Ask on Reddit / Discord / forums           | Free, candid, community-moderated | Unsearchable later, anecdotal, thread rot, brigading, name-dropping discouraged in some subs |
| Coach's own Instagram / TikTok             | Rich, immediate, shows physiques  | Entirely seller-controlled; survivorship bias by construction                                |
| Word of mouth at the gym / from a teammate | High trust                        | Tiny sample; geographically and socially bounded                                             |
| Ask the coach for client references        | Direct                            | Coach picks the references                                                                   |
| Federation / show-placing records          | Objective                         | Measures the _athlete's_ result, not the coaching relationship                               |
| General review sites (Trustpilot-style)    | Familiar format                   | Almost no coverage of individual online coaches; no division/prep vocabulary                 |
| Coach-marketplace / directory apps         | Convenient booking                | Coach-supplied listings, usually pay-to-rank; reviews collected by the party being reviewed  |
| Physique-community "call-out" content      | Highly viral                      | Adversarial, unverified, frequently defamatory — the thing we must not become                |

**Category patterns worth borrowing (generic, not copied):** structured multi-dimension
ratings rather than a single star; verification badges tied to evidence of a real
transaction; a right of reply for the reviewed party; visible moderation policy.

**Our differentiated position:** independent of coaches (they do not collect or gate their
own reviews), _prep-literate_ vocabulary (division, federation, peak week, improvement
season, natural/enhanced focus), and explicit separation of evidence types so a reader
always knows whether they are reading a client, a coach, or a machine summary.

**Structural risk this creates:** the same independence that makes the product credible
makes coaches adversarial. Mitigation is a defensible moderation standard, a right of
reply, and firsthand-only sourcing.
