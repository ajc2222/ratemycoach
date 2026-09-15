import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/** Tiny class joiner — enough for this codebase, no dependency needed. */
export function cx(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-semibold " +
  "transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 " +
  // 44px minimum target (WCAG 2.5.8)
  "min-h-11 px-5 py-2.5 text-center";

const VARIANTS = {
  primary: "bg-accent text-accent-ink hover:bg-accent-hover",
  secondary: "border border-line-strong bg-surface text-paper hover:bg-surface-2",
  ghost: "text-paper hover:bg-surface-2",
  quiet: "text-accent hover:text-accent-hover underline underline-offset-4 min-h-0 px-0 py-1",
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
  const tones = {
    neutral: "border-line bg-surface-2 text-muted",
    accent: "border-accent/40 bg-accent/10 text-accent",
    demo: "border-demo/50 bg-demo-bg text-demo",
    ok: "border-ok/40 bg-ok-bg text-ok",
    muted: "border-line bg-transparent text-subtle",
  } as const;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
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
        "border-demo/40 bg-demo-bg flex items-start gap-3 rounded-[var(--radius-card)] border px-4 py-3",
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
        "border-line bg-surface rounded-[var(--radius-card)] border p-5 sm:p-6",
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
        <p className="text-accent mb-2 text-xs font-semibold tracking-[0.18em] uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2 id={id} className="text-2xl sm:text-3xl">
        {title}
      </h2>
      {lead ? <p className="text-muted mt-3">{lead}</p> : null}
    </div>
  );
}

/** Prelaunch disclosure. Appears in the header of every page. */
export function PrelaunchPill({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        "border-line bg-surface text-2xs text-muted inline-flex items-center gap-2 rounded-full border px-3 py-1 font-medium tracking-wide uppercase",
        className,
      )}
    >
      <span aria-hidden="true" className="bg-accent size-1.5 rounded-full" />
      Early validation — not yet launched
    </span>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cx("border-line border-0 border-t", className)} />;
}
