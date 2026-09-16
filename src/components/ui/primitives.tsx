import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/** Tiny class joiner — enough for this codebase, no dependency needed. */
export function cx(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-[6px] font-bold " +
  "disabled:cursor-not-allowed disabled:opacity-60 " +
  // 44px minimum target (WCAG 2.5.8)
  "min-h-11 px-5 py-2.5 text-center";

/** Primary and secondary use the hard-offset treatment (see `.btn-hard`). */
const VARIANTS = {
  primary: "btn-hard bg-accent text-accent-ink hover:bg-accent-hover",
  secondary: "btn-hard bg-surface text-paper",
  ghost: "text-paper transition-colors hover:bg-surface-2",
  quiet:
    "text-accent transition-colors hover:text-accent-hover underline underline-offset-4 min-h-0 px-0 py-1",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return <button className={cx(BUTTON_BASE, VARIANTS[variant], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return <Link className={cx(BUTTON_BASE, VARIANTS[variant], className)} {...props} />;
}

export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "demo" | "ok" | "muted";
  className?: string;
}) {
  // Uppercase grey tags, RateMyProfessors-style. The demo marker keeps its
  // sentence case so it reads the same to people and to text-matching tools.
  const tones = {
    neutral: "bg-surface-2 text-paper uppercase tracking-[0.05em]",
    accent: "bg-accent-soft text-accent uppercase tracking-[0.05em]",
    demo: "bg-demo-bg text-demo",
    ok: "bg-ok-bg text-ok uppercase tracking-[0.05em]",
    muted: "bg-transparent text-subtle ring-1 ring-line ring-inset uppercase tracking-[0.05em]",
  } as const;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[0.6875rem] font-bold whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * The demonstration-data marker. Used on every card, profile and comparison
 * column that shows fictional data — the visitor should never have to guess.
 */
export function DemoBadge({ className }: { className?: string }) {
  return (
    <Chip tone="demo" className={className}>
      <span aria-hidden="true">◆</span> Demo
    </Chip>
  );
}

export function DemoBanner({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        "border-demo/30 bg-demo-bg flex items-start gap-3 rounded-[var(--radius-card)] border px-4 py-3",
        className,
      )}
    >
      <span aria-hidden="true" className="text-demo mt-0.5">
        ◆
      </span>
      <p className="text-demo text-sm">
        <strong className="font-semibold">Demonstration profile — not a real coach.</strong>{" "}
        <span className="text-demo/85">
          This example shows how a profile will be laid out. The name, team, biography and
          handles are invented. No ratings, reviews or client outcomes are shown anywhere on
          this site.
        </span>
      </p>
    </div>
  );
}

export function Card({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section" | "li";
}) {
  return (
    <Tag
      className={cx(
        "border-line bg-surface rounded-[var(--radius-card)] border p-5 shadow-[var(--shadow-card)] sm:p-6",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  id,
  className,
}: {
  eyebrow?: string;
  title: string;
  lead?: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <div className={cx("max-w-2xl", className)}>
      {eyebrow ? (
        <p className="text-accent mb-3 text-xs font-bold tracking-[0.16em] uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2 id={id} className="text-[1.75rem] sm:text-4xl">
        {title}
      </h2>
      {lead ? <p className="text-muted mt-3">{lead}</p> : null}
    </div>
  );
}

/**
 * Prelaunch disclosure. `onNavy` is the variant used inside dark bands such as
 * the hero, where the light-ground colours would disappear.
 */
export function PrelaunchPill({
  className,
  onNavy = false,
}: {
  className?: string;
  onNavy?: boolean;
}) {
  return (
    <span
      className={cx(
        "text-2xs inline-flex items-center gap-2 rounded-full border px-3 py-1 font-semibold tracking-wide uppercase",
        onNavy ? "border-on-navy/25 text-on-navy-muted" : "border-line bg-surface text-muted",
        className,
      )}
    >
      <span aria-hidden="true" className="bg-accent-bright pulse-dot size-1.5 rounded-full" />
      Early validation — not yet launched
    </span>
  );
}

/**
 * The RateMyProfessors-style score square. Until real, verified reviews exist
 * it only ever renders the empty state — there is no prop for a number on
 * purpose, so a fabricated score cannot be passed in by accident.
 */
export function ScoreBlock({
  label = "Overall",
  size = "md",
  className,
}: {
  label?: string;
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <div className={cx("shrink-0 text-center", className)}>
      <p className="text-paper mb-1.5 text-[0.6875rem] font-extrabold tracking-[0.08em] uppercase">
        {label}
      </p>
      <div
        className={cx(
          "bg-surface-2 text-subtle grid place-items-center rounded-[3px] font-extrabold",
          size === "lg" ? "size-24 text-5xl" : "size-[4.5rem] text-4xl",
        )}
      >
        <span aria-hidden="true">—</span>
        <span className="sr-only">No rating</span>
      </div>
      <p className="text-subtle mt-1.5 text-xs leading-tight">No reviews yet</p>
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cx("border-line border-0 border-t", className)} />;
}
