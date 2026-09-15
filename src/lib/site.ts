/**
 * Single source of truth for product naming and shared copy.
 * The repository is called `ratemycoach`; the product is "PrepCoach Reviews".
 * Renaming the product means editing this file and nothing else.
 */
export const site = {
  name: "PrepCoach Reviews",
  shortName: "PrepCoach",
  tagline: "Research your bodybuilding coach before committing to prep.",
  description:
    "An independent place to research online bodybuilding coaches — specialties, pricing, client experiences, communication standards and public discussion, before you commit to a prep.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  contactEmail: process.env.CONTACT_EMAIL ?? "hello@prepcoachreviews.com",
  /** Shown site-wide. This product does not exist yet and never pretends otherwise. */
  prelaunchNotice:
    "Early validation — PrepCoach Reviews has not launched. Preview profiles are fictional demonstrations.",
  locale: "en",
} as const;

/** Stable copy used in more than one place, so the wording can never drift. */
export const copy = {
  claimLimitation:
    "Claimed profiles may correct profile information and respond to reviews. Claiming a profile will not allow a coach to alter ratings or remove legitimate reviews.",
  reviewPrivacy:
    "We're collecting founding reviews privately. Your submission will not be publicly posted automatically. It must pass moderation and verification before any future publication.",
  featureGate:
    "This feature is being prepared for early access. Join the waitlist and tell us which coach you're researching.",
  demoLabel: "Demonstration profile — not a real coach",
  aiSummaryDisclaimer:
    "Public-source summaries will summarise approved public discussion with citations. They are not firsthand reviews and will always be labelled as summaries.",
} as const;
