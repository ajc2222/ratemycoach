import type { Metadata } from "next";
import Link from "next/link";

import { Card, PrelaunchPill } from "@/components/ui/primitives";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Methodology & trust",
  description:
    "How PrepCoach Reviews intends to collect, verify and moderate coach reviews — and what is and isn't true today during early validation.",
  alternates: { canonical: "/methodology" },
};

export default function MethodologyPage() {
  return (
    <div className="container-page py-10 sm:py-16">
      <div className="prose-page mx-auto">
        <PrelaunchPill />
        <h1 className="mt-4 text-3xl sm:text-4xl">Methodology and trust</h1>
        <p className="text-muted mt-4 text-lg">
          A review site is only worth anything if you know how it works. This page describes
          both what we intend to do and — more importantly right now — what is actually true
          today.
        </p>

        <Card className="border-accent/30 bg-accent/5 my-8">
          <h2 className="font-display mt-0 text-lg">What is true today</h2>
          <ul className="mt-3 mb-0 space-y-1.5 text-sm">
            <li>{site.name} has not launched and is in early validation.</li>
            <li>
              Every coach profile on this site is fictional and labelled as a demonstration.
            </li>
            <li>No reviews have been published. None are hidden behind a signup.</li>
            <li>No ratings exist for any real coach.</li>
            <li>No AI summaries have been generated from live forum or social data.</li>
            <li>We have not scraped Instagram, TikTok, Reddit or any forum.</li>
            <li>Reviews submitted now are stored privately and are not published.</li>
            <li>
              No coach has paid us anything, and nothing on this site is a paid placement.
            </li>
          </ul>
        </Card>

        <h2>The three layers of evidence</h2>
        <p>
          The central design decision is that different kinds of evidence are never blended
          together. When you read something here, you should always know who is speaking.
        </p>

        <h3>1. Verified client reviews</h3>
        <p>
          Firsthand accounts from people who paid for the coaching. A review will be accepted
          only from someone describing their own coaching relationship — never secondhand, never
          &ldquo;a friend told me&rdquo;. Reviews carry structured ratings for communication,
          personalisation and value alongside written text, because those are the dimensions
          athletes actually get let down on.
        </p>
        <p>
          <strong>Verification</strong> will mean that we have matched the review to evidence of
          a real coaching relationship. That process does not exist yet. Until it does, no
          review will carry a verified badge — an unearned badge is worse than no badge.
        </p>

        <h3>2. Coach-provided profile details</h3>
        <p>
          Pricing, services, divisions, federations and what is included. Supplied by the coach,
          labelled as the coach&apos;s own description, and editable by them once they claim the
          profile. We do not fact-check marketing claims; we label their source so you can weigh
          them yourself.
        </p>

        <h3>3. Public-source summaries</h3>
        <p>
          Summaries of discussion that is already public, with a citation for every point. These
          will always be labelled as summaries and will never be presented as, counted as, or
          averaged into reviews. They are a pointer to the source, not a verdict.
        </p>
        <p>
          We will only summarise sources we are permitted to use. We do not scrape platforms
          that do not allow it, and nothing has been ingested at this stage.
        </p>

        <h2>Moderation standards</h2>
        <p>These are the rules a review must pass before it could ever be published:</p>
        <ul>
          <li>
            <strong>Firsthand only.</strong> You describe your own coaching relationship.
          </li>
          <li>
            <strong>About the service.</strong> Coaching, communication, programming, pricing,
            what was and wasn&apos;t delivered. Not the coach&apos;s personal life.
          </li>
          <li>
            <strong>No criminal or abuse allegations.</strong> We are not equipped to
            investigate them, and publishing unverified accusations can ruin an innocent person
            and endanger the person reporting. Those belong with the police or the federation.
            Our submission form rejects them and tells you why.
          </li>
          <li>
            <strong>No third-party personal information.</strong> No other clients&apos; names,
            no phone numbers, no addresses.
          </li>
          <li>
            <strong>Right of reply.</strong> A coach can respond publicly to any review about
            them.
          </li>
          <li>
            <strong>No pay-to-remove.</strong> Never, at any price. A review comes down because
            it breaks a rule, not because someone paid or complained loudly.
          </li>
        </ul>

        <h2>Natural and enhanced</h2>
        <p>
          Filtering by a coach&apos;s natural or enhanced focus exists because it genuinely
          changes whether a coach is right for you. To be explicit: that label describes the
          kind of athlete a coach works with and what they will and won&apos;t advise on. It is
          never a statement about any individual athlete&apos;s choices, and we will not host
          claims about what any named person has taken.
        </p>

        <h2>Independence</h2>
        <p>
          We are not affiliated with, endorsed by or connected to the IFBB, NPC, WNBF, OCB,
          UKBFF, CPA or any other federation. We are not affiliated with any coach, team or
          supplement brand. If we ever make money from coaches — for example through promoted
          placement — it will be disclosed on the page where it appears and it will never affect
          reviews, ratings or moderation.
        </p>

        <h2>What we can&apos;t tell you</h2>
        <p>
          A coach who suits one athlete can be wrong for another. Reviews describe individual
          experiences and cannot predict yours. Nothing on this site is medical, nutritional or
          pharmacological advice, and no one — us, or any coach — can guarantee a physique
          outcome or a placing.
        </p>

        <h2>Questions, corrections and complaints</h2>
        <p>
          If something here is wrong, tell us and we&apos;ll fix it.{" "}
          <Link href="/contact">Contact us</Link> — coaches included. Our{" "}
          <Link href="/privacy">privacy notice</Link> covers what we store and how to have it
          deleted, and our <Link href="/terms">terms</Link> set out the limits of what this site
          is.
        </p>
      </div>
    </div>
  );
}
