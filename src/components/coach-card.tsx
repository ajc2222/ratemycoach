"use client";

import Link from "next/link";

import { useTilt } from "@/components/motion";
import { Chip, cx, DemoBadge, ScoreBlock } from "@/components/ui/primitives";
import type { DemoCoach } from "@/data/demo-coaches";
import { priceRangeLabel } from "@/lib/search";
import { COACHING_TYPES, DELIVERY, DIVISIONS, labelFor } from "@/lib/taxonomy";

/** Neutral placeholder avatar — initials, never a stock photo of a real person. */
export function CoachAvatar({
  initials,
  size = "md",
}: {
  initials: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "size-8 text-xs",
    md: "size-12 text-base",
    lg: "size-20 text-2xl",
  } as const;
  return (
    <span
      aria-hidden="true"
      className={cx(
        "bg-navy text-on-navy grid shrink-0 place-items-center rounded-full font-bold",
        sizes[size],
      )}
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

/** Value above label visually; label first in the DOM, as `<dl>` requires. */
function Stat({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col-reverse", className)}>
      <dt className="text-subtle text-xs">{label}</dt>
      <dd className="text-lg leading-tight font-bold tracking-tight">{children}</dd>
    </div>
  );
}

/**
 * Directory result, laid out like a RateMyProfessors card: score square on the
 * left, name and key facts on the right. The score square is always the empty
 * state — no reviews exist.
 */
export function CoachCard({ coach, position }: { coach: DemoCoach; position: number }) {
  const tiltRef = useTilt<HTMLLIElement>();
  return (
    <li
      ref={tiltRef}
      className="group border-line bg-surface hover:border-line-strong relative flex flex-col gap-4 rounded-[6px] border p-5 shadow-[var(--shadow-card)] transition-[box-shadow,border-color,transform] duration-200 will-change-transform hover:shadow-[var(--shadow-lift)]"
    >
      <div className="flex items-start gap-4">
        <ScoreBlock />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-xl leading-snug">
              {/*
                The `coach_profile_opened` event is fired by the profile page
                itself, not here, so that a shared link or a back-navigation
                counts exactly the same as a click from the directory. The
                position is carried in the URL for the same reason.
              */}
              <Link
                href={`/coaches/${coach.slug}?from=directory&pos=${position}`}
                className="hover:text-accent transition-colors after:absolute after:inset-0"
              >
                {coach.name}
              </Link>
            </h3>
            <DemoBadge />
          </div>
          <p className="text-muted text-sm">
            {[coach.team ?? "Independent", coach.location].join(" · ")}
          </p>
        </div>
      </div>

      <p className="text-muted text-sm">{coach.headline}</p>

      <dl className="flex flex-wrap gap-x-5 gap-y-3">
        <Stat label="per month">{priceRangeLabel(coach.priceMin, coach.priceMax)}</Stat>
        <Stat label="delivery" className="border-line border-l pl-5">
          {labelFor(DELIVERY, coach.delivery)}
        </Stat>
        <Stat label="taking clients" className="border-line border-l pl-5">
          <span className={coach.acceptingClients ? "text-ok" : "text-muted"}>
            {coach.acceptingClients ? "Yes" : "Not now"}
          </span>
        </Stat>
      </dl>

      <ul className="flex flex-wrap gap-1.5">
        {coach.divisions.slice(0, 2).map((division) => (
          <li key={division}>
            <Chip>{labelFor(DIVISIONS, division)}</Chip>
          </li>
        ))}
        {coach.coachingTypes.slice(0, 1).map((type) => (
          <li key={type}>
            <Chip>{labelFor(COACHING_TYPES, type)}</Chip>
          </li>
        ))}
        {coach.divisions.length + coach.coachingTypes.length > 3 ? (
          <li>
            <Chip tone="muted">
              +{coach.divisions.length + coach.coachingTypes.length - 3} more
            </Chip>
          </li>
        ) : null}
      </ul>

      <div className="border-line mt-auto flex items-center justify-between gap-3 border-t pt-4 text-sm">
        <span className="text-subtle">
          {coach.claimed ? "Claimed (demo)" : "Unclaimed (demo)"}
        </span>
        <p className="text-accent inline-flex items-center gap-1 font-bold" aria-hidden="true">
          View profile <span className="transition-transform group-hover:translate-x-1">→</span>
        </p>
      </div>
    </li>
  );
}
