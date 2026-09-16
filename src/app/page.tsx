import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";

import { CoachCard } from "@/components/coach-card";
import { CountUp } from "@/components/motion";
import { PageViewTracker } from "@/components/page-view-tracker";
import { CategoryExplorer } from "@/components/sections/category-explorer";
import { HeroSearch } from "@/components/sections/hero-search";
import { WaitlistForm } from "@/components/forms/waitlist-form";
import {
  ButtonLink,
  Card,
  Chip,
  Divider,
  PrelaunchPill,
  SectionHeading,
} from "@/components/ui/primitives";
import { DEMO_COACHES } from "@/data/demo-coaches";
import { getVariant } from "@/lib/experiment";
import { COOKIES } from "@/lib/request-context";
import { site } from "@/lib/site";
import { DIVISIONS } from "@/lib/taxonomy";

export const metadata: Metadata = {
  title: "Research your bodybuilding coach before committing to prep",
  description: site.description,
  alternates: { canonical: "/" },
};

/** True, countable facts only — never an audience or review figure. */
const FACTS = [
  { value: DEMO_COACHES.length, label: "demonstration profiles to try" },
  { value: DIVISIONS.length, label: "divisions covered" },
  { value: 3, label: "kinds of evidence, kept separate" },
  { value: 0, label: "ways for a coach to pay to remove a review" },
];

const SAMPLE_COACHES = [DEMO_COACHES[1], DEMO_COACHES[0], DEMO_COACHES[2]];

/** Renders `text` with `phrase` marked, falling back to plain text. */
function Highlighted({ text, phrase }: { text: string; phrase: string }) {
  const index = text.indexOf(phrase);
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="text-on-navy bg-transparent bg-[linear-gradient(transparent_82%,var(--color-accent-bright)_82%,var(--color-accent-bright)_94%,transparent_94%)] box-decoration-clone">
        {phrase}
      </mark>
      {text.slice(index + phrase.length)}
    </>
  );
}

const EVIDENCE_LAYERS = [
  {
    number: "01",
    title: "Verified client reviews",
    body: "Firsthand accounts from paying clients, matched to a real coaching relationship.",
    status: "Collecting privately",
  },
  {
    number: "02",
    title: "Coach-provided details",
    body: "Pricing, services and divisions, supplied by the coach and labelled as theirs.",
    status: "Open to coaches",
  },
  {
    number: "03",
    title: "Public-source AI summaries",
    body: "Cited summaries of public discussion. Never presented as reviews.",
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

  return (
    <>
      <PageViewTracker event="landing_viewed" props={{ page: "/" }} />

      {/* ---------------------------------------------------------------- Hero */}
      <section className="on-navy hero-glow">
        <div className="container-page py-12 text-center sm:py-20 lg:py-24">
          <PrelaunchPill onNavy />
          <h1 className="mx-auto mt-5 max-w-4xl text-[2.25rem] sm:text-6xl lg:text-[4.25rem]">
            <Highlighted text={variant.headline} phrase={variant.highlight} />
          </h1>
          <p className="text-on-navy-muted mx-auto mt-5 max-w-xl text-base sm:text-lg">
            {variant.subhead}
          </p>

          <div className="mx-auto mt-8 max-w-2xl">
            <HeroSearch />
            <p className="text-on-navy-muted mt-3 text-sm">
              No real coaches are listed yet. If we don&apos;t have who you&apos;re looking for,
              you can tell us who they are.
            </p>
          </div>

          <div className="mt-7">
            <CategoryExplorer variant="hero" />
          </div>

          <p className="text-on-navy-muted mt-8 text-sm">
            Former client?{" "}
            <Link
              href="/review"
              className="text-on-navy font-semibold underline decoration-[var(--color-accent-bright)] decoration-2 underline-offset-4"
            >
              Review a coach privately →
            </Link>
          </p>
        </div>
      </section>

      {/* --------------------------------------------------------------- Facts */}
      <section aria-label="At a glance" className="border-line bg-surface border-b">
        <dl className="container-page grid grid-cols-2 gap-y-6 py-8 sm:py-10 lg:grid-cols-4">
          {FACTS.map((fact) => (
            <div key={fact.label} className="flex flex-col-reverse px-2 text-center">
              <dt className="text-muted mt-1 text-sm">{fact.label}</dt>
              <dd className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                <CountUp value={fact.value} />
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ------------------------------------------------------ Sample profiles */}
      <section className="container-page py-14 sm:py-20" aria-labelledby="samples">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            id="samples"
            eyebrow="Sample profiles"
            title="What a coach card will look like"
            lead={
              <>
                Every profile here is a fictional demonstration, not a real coach. No ratings,
                reviews or client outcomes are shown anywhere on this site, so every score reads
                &ldquo;No reviews yet&rdquo;.
              </>
            }
          />
          <ButtonLink href="/coaches" variant="secondary" className="shrink-0">
            Browse all {DEMO_COACHES.length} <span aria-hidden="true">→</span>
          </ButtonLink>
        </div>
        <ul className="reveal mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {SAMPLE_COACHES.map((coach, index) => (
            <CoachCard key={coach.id} coach={coach} position={index + 1} />
          ))}
        </ul>
      </section>

      {/* ------------------------------------------------ Three evidence layers */}
      <section className="container-page py-14 sm:py-20" aria-labelledby="evidence">
        <SectionHeading
          id="evidence"
          eyebrow="How we'll show evidence"
          title="Three kinds of evidence, never mixed together"
          lead="Most sites blend them. We keep them apart."
        />
        <ol className="reveal mt-10 grid gap-5 lg:grid-cols-3">
          {EVIDENCE_LAYERS.map((layer) => (
            <Card as="li" key={layer.number} className="flex flex-col">
              <div className="flex items-center justify-between gap-3">
                <span className="bg-navy text-on-navy grid size-11 place-items-center rounded-[4px] font-extrabold">
                  {layer.number}
                </span>
                <Chip tone="muted">{layer.status}</Chip>
              </div>
              <h3 className="mt-4 text-xl">{layer.title}</h3>
              <p className="text-muted mt-2 text-sm">{layer.body}</p>
            </Card>
          ))}
        </ol>
      </section>

      <Divider />

      {/* ----------------------------------------------------------- How it works */}
      <section className="container-page py-14 sm:py-20" aria-labelledby="how-it-works">
        <SectionHeading
          id="how-it-works"
          eyebrow="How it works"
          title="Three steps, once it's built"
        />
        <ol className="reveal mt-10 grid gap-8 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <div className="flex items-center gap-3">
                <span className="bg-accent text-accent-ink grid size-9 shrink-0 place-items-center rounded-full text-sm font-extrabold">
                  {index + 1}
                </span>
                <h3 className="text-lg">{step.title}</h3>
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
          <div className="reveal mt-8">
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
            <h3 className="text-lg">You can filter by</h3>
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
        <div className="reveal mt-8 grid gap-3 lg:grid-cols-2">
          {FAQS.map((faq) => (
            <details
              key={faq.q}
              className="group border-line bg-surface open:border-paper rounded-[var(--radius-card)] border-2 px-5 py-4 transition-colors open:shadow-[3px_3px_0_var(--color-paper)]"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-base font-bold marker:hidden sm:text-lg">
                {faq.q}
                <span
                  aria-hidden="true"
                  className="text-accent mt-0.5 shrink-0 text-xl leading-none transition-transform duration-300 group-open:rotate-45"
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
