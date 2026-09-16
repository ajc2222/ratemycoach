"use client";

import Link from "next/link";

import { GateButton } from "@/components/feature-gate";
import { ButtonLink, Card, cx } from "@/components/ui/primitives";
import { track } from "@/lib/analytics/client";
import type { DemoCoach } from "@/data/demo-coaches";

/**
 * Everything on a coach profile that a visitor can *press*.
 *
 * Each of these is a measurement instrument: the click tells us which evidence
 * layer people actually want. None of them imply that hidden content exists —
 * the copy says "not collected yet", never "unlock" or "sign up to see".
 */

const GATE_BUTTON =
  "btn-hard inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[6px] " +
  "bg-surface px-4 py-2.5 text-sm font-bold text-paper";

const RATING_ROWS = ["Excellent 5", "Great 4", "Good 3", "Poor 2", "Awful 1"];

/**
 * The RateMyProfessors-style breakdown, in the only state it can honestly
 * show today: empty. It exists so visitors can see what will be measured.
 */
function RatingBreakdown() {
  return (
    <div className="border-line bg-ink mt-5 grid gap-6 rounded-xl border p-5 sm:grid-cols-[auto_1fr] sm:gap-8">
      <div>
        <p className="text-subtle text-6xl leading-none font-extrabold tracking-tight">
          <span aria-hidden="true">—</span>
          <span className="sr-only">No overall rating</span>
          <span className="text-muted ml-1 text-xl font-semibold" aria-hidden="true">
            /5
          </span>
        </p>
        <p className="text-muted mt-2 text-sm">Overall quality · nothing published</p>
        <dl className="mt-4 flex gap-6">
          {["would hire again", "communication"].map((label) => (
            <div key={label} className="flex flex-col-reverse">
              <dt className="text-subtle text-xs">{label}</dt>
              <dd className="text-subtle text-2xl font-extrabold">
                <span aria-hidden="true">—</span>
                <span className="sr-only">Not rated</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <dl className="space-y-2" aria-label="Rating distribution">
        {RATING_ROWS.map((row) => (
          <div
            key={row}
            className="grid grid-cols-[5.5rem_1fr_2.5rem] items-center gap-3 text-sm"
          >
            <dt className="text-muted">{row}</dt>
            <dd className="bg-surface-2 h-5" aria-hidden="true" />
            <dd className="text-subtle text-right text-xs">none</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function ReviewEvidenceCard({ coach }: { coach: DemoCoach }) {
  return (
    <Card className="border-line-strong border-2 border-dashed shadow-none">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl">Client reviews</h2>
        <span className="bg-surface-2 text-paper rounded-full px-3 py-1 text-[0.6875rem] font-bold tracking-[0.05em] uppercase">
          Not collected yet
        </span>
      </div>
      <RatingBreakdown />
      <p className="text-muted mt-3 text-sm">
        This is where firsthand reviews from former clients will appear — structured ratings for
        communication, personalisation and value, plus written accounts of what the coaching was
        actually like.
      </p>
      <p className="text-muted mt-3 text-sm">
        <strong className="text-paper">
          There are no reviews here yet, hidden or otherwise.
        </strong>{" "}
        We&apos;re collecting founding reviews privately first so that this page has something
        real on it the day it opens.
      </p>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <GateButton
          feature="read-all-reviews"
          coachId={coach.id}
          coachName={coach.name}
          page={`/coaches/${coach.slug}`}
          className={GATE_BUTTON}
        >
          Read all reviews
        </GateButton>
        <GateButton
          feature="verified-reviews"
          coachId={coach.id}
          coachName={coach.name}
          page={`/coaches/${coach.slug}`}
          className={GATE_BUTTON}
        >
          View verified reviews
        </GateButton>
      </div>
    </Card>
  );
}

export function AiSummaryCard({ coach }: { coach: DemoCoach }) {
  return (
    <Card className="border-line-strong border-2 border-dashed shadow-none">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl">Public-source summary</h2>
        <span className="bg-surface-2 text-paper rounded-full px-3 py-1 text-[0.6875rem] font-bold tracking-[0.05em] uppercase">
          Not generated yet
        </span>
      </div>
      <p className="text-muted mt-3 text-sm">
        A summary of approved public discussion about a coach, with links to every source, so
        you can read the original yourself. It will always be labelled as a summary.
      </p>
      <p className="text-muted mt-3 text-sm">
        <strong className="text-paper">
          A summary is not a review and will never be presented as one.
        </strong>{" "}
        Nothing has been ingested, scraped or generated for this page.
      </p>
      <div className="mt-5">
        <GateButton
          feature="ai-summary"
          coachId={coach.id}
          coachName={coach.name}
          page={`/coaches/${coach.slug}`}
          className={GATE_BUTTON}
        >
          Open AI public-source summary
        </GateButton>
      </div>
    </Card>
  );
}

export function ProfileActionPanel({ coach }: { coach: DemoCoach }) {
  const page = `/coaches/${coach.slug}`;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <GateButton
          feature="compare"
          coachId={coach.id}
          coachName={coach.name}
          page={page}
          className={GATE_BUTTON}
        >
          Compare
        </GateButton>
        <GateButton
          feature="save-coach"
          coachId={coach.id}
          coachName={coach.name}
          page={page}
          className={GATE_BUTTON}
        >
          Save
        </GateButton>
      </div>
      <ButtonLink
        href={`/review?coach=${encodeURIComponent(coach.name)}&demo=${coach.id}`}
        className="w-full"
      >
        Review this coach
      </ButtonLink>
      <ButtonLink
        href={`/for-coaches?coach=${encodeURIComponent(coach.name)}&demo=${coach.id}&interest=claim-profile`}
        variant="secondary"
        className="w-full"
      >
        Claim this profile
      </ButtonLink>
      <p className="text-subtle text-xs leading-relaxed">
        Claimed profiles may correct profile information and respond to reviews. Claiming a
        profile will not allow a coach to alter ratings or remove legitimate reviews.
      </p>
    </div>
  );
}

/**
 * Social handles. For a demonstration profile the handle is fictional and must
 * not be rendered as a link — it would 404 at best and land on an unrelated
 * real account at worst. The outbound event still exists for real profiles.
 */
export function SocialLinks({ coach }: { coach: DemoCoach }) {
  const entries = [
    { network: "instagram", label: "Instagram", handle: coach.instagram },
    { network: "tiktok", label: "TikTok", handle: coach.tiktok },
  ].filter((entry): entry is { network: string; label: string; handle: string } =>
    Boolean(entry.handle),
  );

  if (entries.length === 0 && !coach.website) return null;

  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      {entries.map((entry) => (
        <li key={entry.network}>
          <span
            className="text-muted inline-flex items-center gap-1.5"
            title="Demonstration handle — this account does not exist"
          >
            <span className="text-subtle">{entry.label}</span>
            <span className="text-paper font-medium">@{entry.handle}</span>
            <span className="text-demo text-xs">(demo)</span>
          </span>
        </li>
      ))}
      {coach.website ? (
        <li>
          <span className="text-muted inline-flex items-center gap-1.5">
            <span className="text-subtle">Website</span>
            <span className="text-paper font-medium">example.com</span>
            <span className="text-demo text-xs">(demo)</span>
          </span>
        </li>
      ) : null}
    </ul>
  );
}

/**
 * Outbound social link used for real coach records. Not rendered for
 * demonstration profiles — kept here so the event is implemented and ready.
 */
export function OutboundSocialLink({
  href,
  network,
  coachId,
  children,
  className,
}: {
  href: string;
  network: string;
  coachId: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={cx("text-accent underline underline-offset-4", className)}
      onClick={() => track("outbound_social_clicked", { network, coach_id: coachId })}
    >
      {children}
    </a>
  );
}

export function ProfileFooterCta() {
  return (
    <Card className="mt-8">
      <h2 className="text-xl">Researching a real coach?</h2>
      <p className="text-muted mt-2 text-sm">
        Every profile on this site is a demonstration. Tell us which coach you actually wanted
        to look up — that&apos;s how we decide who to research first.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/submit-a-coach">Request a coach</ButtonLink>
        <Link
          href="/coaches"
          className="text-accent inline-flex min-h-11 items-center text-sm underline underline-offset-4"
        >
          Back to the directory
        </Link>
      </div>
    </Card>
  );
}
