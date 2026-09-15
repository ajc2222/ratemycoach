# Phase 3 — UX and Design

## 3.1 Sitemap

```
/                          Landing (experiment variants A/B)
/coaches                   Directory preview: search + filters + results
/coaches/[slug]            Demonstration coach profile
/compare                   Coach comparison preview (gated)
/waitlist                  Waitlist form (also opened as a dialog from gates)
/review                    Private founding-review form
/for-coaches               Coach listing / claim-interest form
/submit-a-coach            Request a missing coach
/methodology               How this will work + trust + verification standards
/privacy                   Privacy notice
/terms                     Terms and disclaimers
/admin                     Protected operator view        [noindex, robots-disallow]
/admin/export/[dataset]    CSV export                     [protected]
/api/health                Health check
/api/events                Analytics ingest (POST)
/api/waitlist|review|coach-claim|coach-request|search  Form + search endpoints (POST)
/sitemap.xml, /robots.txt, /opengraph-image
```

Global navigation (header): Find a coach · Review a coach · For coaches · How it works ·
[Join waitlist].
Footer: Methodology · Privacy · Terms · Contact · prelaunch disclosure.

## 3.2 User flows

**A — Athlete search**
`Landing → hero search → /coaches?q= → (match) card → /coaches/slug → gate click → early-access
dialog → waitlist (coach + feature prefilled) → success`

**A' — Browse without search**
`Landing → category chip → /coaches?division=bikini → filter → profile → gate → waitlist`

**B — Former client**
`Any page → "Review a coach" → /review → privacy explanation → identify coach → structured
experience → permissions → submit → private-confirmation + optional founding-reviewer waitlist`

**C — Coach**
`Landing/footer → /for-coaches → interest multi-select → business details → claim-limitation
statement → submit → confirmation`

**D — Unmatched search**
`/coaches?q=<real name> → zero results → "We don't have this coach yet" → "Request this coach"
→ /submit-a-coach?coach=<query> → optional email → success → offer waitlist`

Every flow's terminal state offers exactly one next action, and no flow dead-ends.

## 3.3 Layout specifications (low-fidelity)

### Landing (mobile 360–430px, single column, 16px gutters)

```
┌──────────────────────────────┐
│ [logo]            [☰ / CTA]  │  sticky header, 56px
├──────────────────────────────┤
│ • Early validation · prelaunch│  disclosure pill
│ H1  Research your            │  clamp(2rem,8vw,3.5rem), 2–3 lines
│     bodybuilding coach       │
│     before committing to prep│
│ Sub: Discover specialties,   │  1 sentence, 17px, muted
│ pricing, client experiences… │
│ ┌──────────────────────────┐ │
│ │ 🔍 Search by coach, team,│ │  44px+ tall, label sr-only
│ │    Instagram, or TikTok  │ │
│ └──────────────────────────┘ │
│ [ Find a coach ]  (primary)  │  full-width 48px
│ [ Review a coach ] (secondary)│
├──────────────────────────────┤
│ THREE LAYERS OF EVIDENCE     │  3 stacked cards, numbered
│ 1 Verified client reviews    │
│ 2 Coach-provided details     │
│ 3 Public-source AI summaries │
│   ⚠ summaries of approved    │
│   public sources — not       │
│   firsthand reviews          │
├──────────────────────────────┤
│ HOW IT WORKS  1 → 2 → 3      │
├──────────────────────────────┤
│ EXPLORE BY DIVISION          │  wrapped chips, 9 options
│ [Men's BB][Classic][Physique]│
│ [Bikini][Wellness][Figure]…  │
├──────────────────────────────┤
│ SAMPLE PROFILE               │
│ ┌─ Demonstration profile ──┐ │  amber banner
│ │ not a real coach         │ │
│ │ [avatar] Name · Team     │ │
│ │ chips: divisions/services│ │
│ │ $ range · Remote         │ │
│ │ [View demo profile]      │ │
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ WAITLIST  4 benefit bullets  │
│ [email] [role] [division]    │
│ [intent] ☐ consent  [Join]   │
├──────────────────────────────┤
│ FAQ (8 × <details>)          │
├──────────────────────────────┤
│ footer + disclosures         │
└──────────────────────────────┘
```

**Desktop (≥1024px):** hero is a 7/5 split (copy + search left, demo profile card right);
evidence layers become 3 columns; categories become a 3×3 grid; waitlist is a centred 640px
card; FAQ is two columns. Max content width 1152px.

### Directory

```
mobile:  [search bar]
         [Filters (3) ▾]  ← opens bottom sheet, focus-trapped
         "12 demonstration profiles"
         [card][card][card]…
desktop: 280px sticky filter rail | results grid (2 cols @1024, 3 @1280)
```

Card: name + Demo chip / team / divisions row / specialties row / focus badge / price /
remote badge / status badge / "View profile →" (whole card is the link target; nested
actions are avoided).

Zero-result state: heading "We don't have this coach yet", one explanatory line, primary
"Request this coach", secondary "Clear filters".

### Coach profile

```
mobile:  [Demonstration banner]
         avatar, name, team, socials
         status chips (accepting / remote / claimed)
         [Compare] [Save]                  ← gates
         Bio
         Divisions · Federations · Services · Focus · Price
         ┌ Client reviews ─────────────┐   ← gate card, "not yet available"
         │ [Read all reviews] [Verified]│
         ├ Public-source summary ───────┤   ← gate card
         │ [Open AI summary]            │
         └──────────────────────────────┘
         [Review this coach] [Claim this profile]
desktop: 2-column — left 2/3 content, right 1/3 sticky action panel
```

### Forms (all)

Single column, max 640px, 8px-grid spacing, fieldsets with `<legend>`, one question per row on
mobile. Long forms (`/review`) are sectioned with numbered `<fieldset>` groups and a progress
line ("Section 2 of 4") that is text, not a fake progress bar.

## 3.4 States

| State               | Treatment                                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Empty (no results)  | Explanatory heading + one next action, never a bare "0 results"                                                           |
| Loading (submit)    | Button enters `aria-busy`, label → "Sending…", control disabled, form values retained                                     |
| Loading (directory) | Filtering is synchronous on the client over demo data — no spinner; result count updates in a `aria-live="polite"` region |
| Success             | Full panel replacing the form: what happened, what happens next, one onward action                                        |
| Field error         | Red border + message under the field, `aria-describedby`, `aria-invalid`, focus moved to the first invalid field          |
| Form error          | Alert at the top of the form, `role="alert"`, retains all entered values                                                  |
| Rate limited        | Friendly "too many submissions, try again in a minute", not a raw 429                                                     |
| Offline/DB down     | "We couldn't save that right now" + retry; the entered data stays on screen                                               |

## 3.5 Design tokens

Implemented as CSS custom properties in `src/app/globals.css` and exposed to Tailwind v4 via
`@theme inline`.

**Colour** — editorial, not supplement-brand. Dark charcoal ground, warm white text, one
restrained accent (a desaturated amber/brass that reads as "evidence/archive", not "energy drink").

| Token                | Value     | Use                            |
| -------------------- | --------- | ------------------------------ |
| `--color-ink`        | `#0E0F11` | page ground                    |
| `--color-surface`    | `#16181C` | cards                          |
| `--color-surface-2`  | `#1E2127` | raised/hover                   |
| `--color-line`       | `#2A2E36` | hairlines                      |
| `--color-paper`      | `#F4F1EA` | primary text (warm white)      |
| `--color-muted`      | `#A7A79E` | secondary text (≥4.5:1 on ink) |
| `--color-accent`     | `#C8963E` | brass — primary actions, links |
| `--color-accent-ink` | `#171205` | text on accent                 |
| `--color-demo`       | `#E0A458` | demonstration-data marker      |
| `--color-danger`     | `#E2725B` | errors                         |
| `--color-ok`         | `#7FA88A` | success                        |

Contrast: paper-on-ink ≈ 16.8:1, muted-on-ink ≈ 7.4:1, accent-on-ink ≈ 7.0:1,
accent-ink-on-accent ≈ 9.4:1 — all ≥ AA, most ≥ AAA.

**Type** — system-adjacent stack for speed, no webfont round-trip:
display `ui-serif, Georgia, 'Times New Roman', serif` for headings (editorial authority);
body `ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`.
Scale: 12 / 14 / 16 / 18 / 21 / 27 / 34 / 44 / 56 px, fluid via `clamp()` at the top end.
Body 17px/1.65 on mobile. Measure capped at 68ch.

**Space** 4·8·12·16·24·32·48·64·96. **Radius** 6 (controls) / 12 (cards) / 999 (chips).
**Shadow** used sparingly; elevation is carried by `--color-surface-2` and hairlines.
**Motion** ≤160ms, ease-out, opacity/transform only, all disabled under
`prefers-reduced-motion`.

## 3.6 Accessibility patterns (WCAG 2.2 AA)

- Skip link to `#main` as the first focusable element.
- Landmarks: `header/nav/main/footer`; one `<h1>` per page; no heading-level skips.
- Focus: 2px accent ring with 2px offset, never removed (2.4.11 focus-not-obscured respected —
  sticky header is 56px and scroll-margin on targets is 72px).
- Targets ≥ 44×44px (2.5.8).
- Dialogs: `role="dialog" aria-modal="true"`, labelled by their heading, focus trapped,
  Escape closes, focus returns to the trigger, background inert.
- Filters are real checkboxes/radios in a `<fieldset>`; the bottom sheet is a dialog.
- Ratings are radio groups (1–5) with visible numeric labels — not icon-only stars.
- Errors: 3.3.1 identified in text, 3.3.3 with a suggestion, live-region announced.
- Consent checkboxes are never prechecked (and never `required` by styling alone —
  enforced server-side too).
- Colour is never the only signal: demo state, status and errors all carry text.
- Reduced motion honoured; no autoplay; no parallax.
