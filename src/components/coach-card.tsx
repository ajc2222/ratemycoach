"use client";

import Link from "next/link";

import { Card, Chip, DemoBadge } from "@/components/ui/primitives";
import type { DemoCoach } from "@/data/demo-coaches";
import { priceRangeLabel } from "@/lib/search";
import { COACHING_TYPES, DELIVERY, DIVISIONS, labelFor } from "@/lib/taxonomy";

/** Neutral placeholder avatar — initials, never a stock photo of a real person. */
export function CoachAvatar({
  initials,
  size = "md",
}: {
  initials: string;
  size?: "md" | "lg";
}) {
  return (
    <span
      aria-hidden="true"
      className={
        size === "lg"
          ? "border-line-strong bg-surface-2 font-display text-muted grid size-20 shrink-0 place-items-center rounded-full border text-2xl"
          : "border-line-strong bg-surface-2 font-display text-muted grid size-12 shrink-0 place-items-center rounded-full border text-base"
      }
    >
      {initials}
    </span>
  );
}

export function FocusChip({ focus }: { focus: DemoCoach["focus"] }) {
  const label =
    focus === "both"
      ? "Natural & enhanced"
      : focus === "natural"
        ? "Natural focus"
        : "Enhanced focus";
  return <Chip tone="neutral">{label}</Chip>;
}

export function CoachCard({ coach, position }: { coach: DemoCoach; position: number }) {
  return (
    <Card
      as="li"
      className="hover:border-line-strong relative flex flex-col gap-4 transition-colors"
    >
      <div className="flex items-start gap-3">
        <CoachAvatar initials={coach.initials} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg leading-snug">
              {/*
                The `coach_profile_opened` event is fired by the profile page
                itself, not here, so that a shared link or a back-navigation
                counts exactly the same as a click from the directory. The
                position is carried in the URL for the same reason.
              */}
              <Link
                href={`/coaches/${coach.slug}?from=directory&pos=${position}`}
                className="hover:text-accent after:absolute after:inset-0"
              >
                {coach.name}
              </Link>
            </h3>
            <DemoBadge />
          </div>
          {coach.team ? <p className="text-muted text-sm">{coach.team}</p> : null}
          <p className="text-subtle mt-1 text-sm">{coach.location}</p>
        </div>
      </div>

      <p className="text-muted text-sm">{coach.headline}</p>

      <ul className="flex flex-wrap gap-1.5">
        {coach.divisions.slice(0, 3).map((division) => (
          <li key={division}>
            <Chip tone="accent">{labelFor(DIVISIONS, division)}</Chip>
          </li>
        ))}
        {coach.divisions.length > 3 ? (
          <li>
            <Chip tone="muted">+{coach.divisions.length - 3} more</Chip>
          </li>
        ) : null}
      </ul>

      <ul className="flex flex-wrap gap-1.5">
        {coach.coachingTypes.slice(0, 3).map((type) => (
          <li key={type}>
            <Chip>{labelFor(COACHING_TYPES, type)}</Chip>
          </li>
        ))}
        <li>
          <FocusChip focus={coach.focus} />
        </li>
      </ul>

      <dl className="border-line mt-auto grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-4 text-sm">
        <div>
          <dt className="text-subtle text-xs">Typical price</dt>
          <dd className="text-paper font-medium">
            {priceRangeLabel(coach.priceMin, coach.priceMax)}
          </dd>
        </div>
        <div>
          <dt className="text-subtle text-xs">Delivery</dt>
          <dd className="text-paper font-medium">{labelFor(DELIVERY, coach.delivery)}</dd>
        </div>
        <div>
          <dt className="text-subtle text-xs">Taking clients</dt>
          <dd
            className={
              coach.acceptingClients ? "text-ok font-medium" : "text-muted font-medium"
            }
          >
            {coach.acceptingClients ? "Yes" : "Not currently"}
          </dd>
        </div>
        <div>
          <dt className="text-subtle text-xs">Profile</dt>
          <dd className="text-muted font-medium">
            {coach.claimed ? "Claimed (demo)" : "Unclaimed (demo)"}
          </dd>
        </div>
      </dl>

      <p className="text-accent text-sm font-semibold" aria-hidden="true">
        View profile →
      </p>
    </Card>
  );
}
