import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";

import { CoachAvatar, FocusChip } from "@/components/coach-card";
import { PageViewTracker } from "@/components/page-view-tracker";
import { CategoryExplorer } from "@/components/sections/category-explorer";
import { HeroSearch } from "@/components/sections/hero-search";
import { WaitlistForm } from "@/components/forms/waitlist-form";
import {
  ButtonLink,
  Card,
  Chip,
  DemoBadge,
  Divider,
  PrelaunchPill,
  SectionHeading,
} from "@/components/ui/primitives";
import { DEMO_COACHES } from "@/data/demo-coaches";
import { getVariant } from "@/lib/experiment";
import { COOKIES } from "@/lib/request-context";
import { priceRangeLabel } from "@/lib/search";
import { copy, site } from "@/lib/site";
import { COACHING_TYPES, DIVISIONS, labelFor } from "@/lib/taxonomy";

export const metadata: Metadata = {
  title: "Research your bodybuilding coach before committing to prep",
  description: site.description,
  alternates: { canonical: "/" },
};

const EVIDENCE_LAYERS = [
  {
    number: "01",
    title: "Verified client reviews",
    body: "Firsthand accounts from people who actually paid for the coaching — rated on communication, personalisation and value, not just the physique that came out the other end. Verification means we've matched the review to evidence of a real coaching relationship.",
    status: "Being collected privately now",
  },
  {
    number: "02",
    title: "Coach-provided profile details",
    body: "Pricing, services, divisions, federations, what's included and what isn't — supplied by the coach and clearly labelled as their own description. Coaches can claim a profile to keep it accurate and reply to reviews.",
    status: "Open for coaches to register interest",
  },
  {
    number: "03",
    title: "Public-source AI summaries",
    body: "Summaries of approved public discussion, with a citation for every claim so you can read the original yourself. These are summaries of what has been said in public — never firsthand reviews, and always labelled as summaries.",
    status: "Not generated yet",
  },
];

const STEPS = [
  {
    title: "Search for a coach",
    body: "By name, team, Instagram or TikTok handle — the way you already know them.",
  },
  {
    title: "Compare evidence and client experiences",
    body: "See what they offer, what it costs, who they've coached, and what former clients say about the process — with each type of evidence kept visibly separate.",
  },
  {
    title: "Make a more informed decision",
    body: "Ask better questions before you hand over a card, and know what you're buying.",
  },
];

const FAQS = [
  {
    q: "What is PrepCoach Reviews?",
    a: "An independent place to research online bodybuilding coaches before you hire one. It isn't built yet — this site is an early validation preview, and what you see here is how we intend it to work. We're testing whether athletes actually want this before building it.",
  },
  {
    q: "Are reviews verified?",
    a: "Not yet — no reviews have been published at all. The intention is that reviews are firsthand only, and that a review can be marked verified when we've matched it to evidence of a real coaching relationship. Until that process exists and has been tested, no review will carry a verified badge.",
  },
  {
    q: "What is a public-source AI summary?",
    a: "A summary of discussion about a coach that is already public, with a citation for every point so you can read the source yourself. It is a summary of what others have said — not a review, not our opinion, and not evidence of anything on its own. Nothing has been ingested or generated yet, and we don't scrape platforms that don't permit it.",
  },
  {
    q: "Can coaches respond?",
    a: "Yes — that's the intent. A coach who claims their profile will be able to correct factual details and publicly reply to reviews. Claiming a profile will not let a coach alter ratings or remove legitimate reviews.",
  },
  {
    q: "Will natural and enhanced coaches be included?",
    a: "Both. You'll be able to filter by a coach's stated focus, because it's one of the first things athletes want to know. To be clear: that label describes what a coach works with — it is never a claim about any individual athlete.",
  },
  {
    q: "Is the platform affiliated with any federation?",
    a: "No. We aren't affiliated with, endorsed by, or connected to the IFBB, NPC, WNBF, OCB, UKBFF or any other federation, and we don't take money from coaches to influence what appears.",
  },
  {
    q: "Can a coach pay to remove a review?",
    a: "No. Not now, not at launch. A review can be removed if it breaks our rules — it isn't firsthand, it's inaccurate, it names people who aren't involved, or it makes accusations we can't verify. A coach's displeasure is not one of those reasons, and paying us will never be a route to it.",
  },
  {
    q: "When will the platform launch?",
    a: "We don't have a date, and we'd rather say so than invent one. What happens next depends on what this validation round shows us — including the possibility that we don't build it. Waitlist members hear first either way.",
  },
];

const WAITLIST_BENEFITS = [
  "A notification when the platform launches",
  "The ability to request specific coach profiles",
  "The opportunity to become a founding reviewer",
  "Early access to coach comparisons",
];

export default async function LandingPage() {
  // Variant is assigned in middleware and read here, so the server renders the
  // correct headline immediately — no flash, no client-side swap.
  const cookieStore = await cookies();
  const variant = getVariant(cookieStore.get(COOKIES.variant)?.value);
  const featured = DEMO_COACHES[1];

  return (
    <>
      <PageViewTracker event="landing_viewed" props={{ page: "/" }} />

      {/* ---------------------------------------------------------------- Hero */}
      <section className="border-line border-b">
        <div className="container-page py-12 sm:py-16 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <PrelaunchPill />
              <h1 className="mt-5 text-[2.125rem] leading-[1.1] sm:text-5xl lg:text-[3.25rem]">
                {variant.headline}
              </h1>
              <p className="text-muted mt-5 max-w-xl text-lg">{variant.subhead}</p>

              <div className="mt-8 max-w-xl">
                <HeroSearch />
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/coaches">Find a coach</ButtonLink>
                <ButtonLink href="/review" variant="secondary">
                  Review a coach
                </ButtonLink>
              </div>
            </div>

            {/* Sample profile preview */}
            <div className="lg:col-span-5">
              <Card className="h-full">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-subtle text-xs font-semibold tracking-[0.15em] uppercase">
                    Sample profile
                  </p>
                  <DemoBadge />
                </div>
                <div className="flex items-start gap-4">
                  <CoachAvatar initials={featured.initials} size="lg" />
                  <div className="min-w-0">
                    <h2 className="font-display text-xl">{featured.name}</h2>
                    <p className="text-muted text-sm">{featured.team}</p>
                    <p className="text-subtle mt-1 text-sm">{featured.location}</p>
                  </div>
                </div>
                <p className="text-muted mt-4 text-sm">{featured.headline}</p>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {featured.divisions.map((division) => (
                    <li key={division}>
                      <Chip tone="accent">{labelFor(DIVISIONS, division)}</Chip>
                    </li>
                  ))}
                  <li>
                    <FocusChip focus={featured.focus} />
                  </li>
                </ul>
                <dl className="border-line mt-5 grid grid-cols-2 gap-4 border-t pt-4 text-sm">
                  <div>
                    <dt className="text-subtle text-xs">Typical price</dt>
                    <dd className="font-medium">
                      {priceRangeLabel(featured.priceMin, featured.priceMax)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-subtle text-xs">Includes</dt>
                    <dd className="font-medium">
                      {labelFor(COACHING_TYPES, featured.coachingTypes[1] ?? "posing")}
                    </dd>
                  </div>
                </dl>
                <p className="border-demo/40 bg-demo-bg text-demo mt-4 rounded-[var(--radius-control)] border px-3 py-2 text-xs">
                  {copy.demoLabel}. Invented for this preview — no ratings, reviews or client
                  outcomes are shown anywhere on this site.
                </p>
                <ButtonLink
                  href={`/coaches/${featured.slug}`}
                  variant="secondary"
                  className="mt-4 w-full"
                >
                  View demonstration profile
                </ButtonLink>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Three evidence layers */}
      <section className="container-page py-14 sm:py-20" aria-labelledby="evidence">
        <SectionHeading
          id="evidence"
          eyebrow="How we'll show evidence"
          title="Three kinds of evidence, never mixed together"
          lead="A transformation photo, a coach's own sales page and a former client's account are three different things. Most places blend them. We won't."
        />
        <ol className="mt-10 grid gap-4 lg:grid-cols-3">
          {EVIDENCE_LAYERS.map((layer) => (
            <Card as="li" key={layer.number} className="flex flex-col">
              <span className="font-display text-accent text-3xl">{layer.number}</span>
              <h3 className="font-display mt-3 text-xl">{layer.title}</h3>
              <p className="text-muted mt-3 flex-1 text-sm">{layer.body}</p>
              <p className="border-line text-subtle mt-4 border-t pt-3 text-xs">
                Status: {layer.status}
              </p>
            </Card>
          ))}
        </ol>
        <Card className="border-accent/30 bg-accent/5 mt-4">
          <p className="text-muted text-sm">
            <strong className="text-paper">On AI summaries specifically:</strong>{" "}
            {copy.aiSummaryDisclaimer} We do not scrape Instagram, TikTok, Reddit or forums, and
            no summaries have been generated from live data.
          </p>
        </Card>
      </section>

      <Divider />

      {/* ----------------------------------------------------------- How it works */}
      <section className="container-page py-14 sm:py-20" aria-labelledby="how-it-works">
        <SectionHeading
          id="how-it-works"
          eyebrow="How it works"
          title="Three steps, once it's built"
        />
        <ol className="mt-10 grid gap-8 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <div className="flex items-center gap-3">
                <span className="border-accent/40 text-accent grid size-8 shrink-0 place-items-center rounded-full border font-sans text-sm font-semibold">
                  {index + 1}
                </span>
                <h3 className="font-display text-lg">{step.title}</h3>
              </div>
              <p className="text-muted mt-3 text-sm">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------------------------------------------- Categories */}
      <section className="border-line bg-surface border-y">
        <div className="container-page py-14 sm:py-20">
          <SectionHeading
            eyebrow="Explore"
            title="Which division are you competing in?"
            lead="Every selection tells us where demand actually is, which decides whose profiles we research first."
          />
          <div className="mt-8">
            <CategoryExplorer />
          </div>
          <p className="text-subtle mt-6 max-w-2xl text-sm">
            &ldquo;Natural&rdquo; and &ldquo;enhanced&rdquo; describe the kind of athlete a
            coach works with and what they will and won&apos;t advise on. They are never
            statements about any individual athlete&apos;s choices.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------ Directory CTA */}
      <section className="container-page py-14 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Directory preview"
              title={`Try the search and filters on ${DEMO_COACHES.length} demonstration profiles`}
              lead="Search and every filter genuinely work. The profiles behind them are invented, so you can see the mechanics without us pretending to have coverage we don't have."
            />
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/coaches">Open the directory</ButtonLink>
              <ButtonLink href="/submit-a-coach" variant="secondary">
                Request a real coach
              </ButtonLink>
            </div>
          </div>
          <Card>
            <h3 className="font-display text-lg">You can filter by</h3>
            <ul className="text-muted mt-4 grid grid-cols-2 gap-2 text-sm">
              {[
                "Division",
                "Coaching type",
                "Natural / enhanced",
                "Federation",
                "Monthly price",
                "Remote or in person",
                "Taking clients",
                "Team or solo",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span aria-hidden="true" className="text-accent mt-1">
                    ·
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      {/* -------------------------------------------------------------- Waitlist */}
      <section className="border-line bg-surface border-t" id="waitlist">
        <div className="container-page py-14 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <SectionHeading
                eyebrow="Waitlist"
                title="Be there when it opens"
                lead="We're building the review side first, because a directory without honest client experiences is just another list of adverts."
              />
              <ul className="mt-6 space-y-3">
                {WAITLIST_BENEFITS.map((benefit) => (
                  <li key={benefit} className="text-muted flex items-start gap-3">
                    <span aria-hidden="true" className="text-accent mt-0.5">
                      ✓
                    </span>
                    {benefit}
                  </li>
                ))}
              </ul>
              <p className="text-subtle mt-6 max-w-md text-sm">
                That&apos;s the whole list. No discounts, no lifetime deals, no promises about
                features we haven&apos;t decided to build.
              </p>
            </div>
            <Card>
              <WaitlistForm formSource="landing" compact triggerPage="/" />
            </Card>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- FAQ */}
      <section className="container-page py-14 sm:py-20" aria-labelledby="faq">
        <SectionHeading id="faq" eyebrow="Questions" title="Straight answers" />
        <div className="mt-8 grid gap-3 lg:grid-cols-2">
          {FAQS.map((faq) => (
            <details
              key={faq.q}
              className="group border-line bg-surface open:bg-surface-2 rounded-[var(--radius-card)] border px-5 py-4"
            >
              <summary className="font-display flex cursor-pointer list-none items-start justify-between gap-4 text-lg marker:hidden">
                {faq.q}
                <span
                  aria-hidden="true"
                  className="text-accent mt-1 shrink-0 transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="text-muted mt-3 text-sm">{faq.a}</p>
            </details>
          ))}
        </div>
        <p className="text-subtle mt-8 text-sm">
          More detail on standards and moderation in our{" "}
          <Link href="/methodology" className="text-accent underline underline-offset-4">
            methodology and trust
          </Link>{" "}
          page.
        </p>
      </section>
    </>
  );
}
