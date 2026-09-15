import type { Metadata } from "next";
import { Suspense } from "react";

import { WaitlistForm } from "@/components/forms/waitlist-form";
import { Card, SectionHeading } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Join the waitlist",
  description:
    "Be notified when PrepCoach Reviews opens, request specific coach profiles, and get the option to become a founding reviewer.",
  alternates: { canonical: "/waitlist" },
};

const BENEFITS = [
  {
    title: "A notification when it launches",
    body: "One email when there's something real to look at. Not a newsletter.",
  },
  {
    title: "Request specific coach profiles",
    body: "Tell us who you want researched. Most-requested coaches get built first.",
  },
  {
    title: "The option to become a founding reviewer",
    body: "If you've been coached before, your account of it shapes what launches.",
  },
  {
    title: "Early access to coach comparisons",
    body: "Side-by-side comparison opens to waitlist members before anyone else.",
  },
];

export default function WaitlistPage() {
  return (
    <div className="container-page py-10 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading
            eyebrow="Waitlist"
            title="Be there when it opens"
            lead="PrepCoach Reviews is being validated before it's built. Joining the waitlist is a vote that it should exist — and tells us what to build first."
          />
          <ul className="mt-8 space-y-5">
            {BENEFITS.map((benefit) => (
              <li key={benefit.title} className="flex gap-3">
                <span aria-hidden="true" className="text-accent mt-1">
                  ✓
                </span>
                <div>
                  <h2 className="text-paper font-sans text-base font-semibold">
                    {benefit.title}
                  </h2>
                  <p className="text-muted text-sm">{benefit.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-subtle mt-8 max-w-md text-sm">
            No discounts, no lifetime deals, no countdown timers. We don&apos;t know the launch
            date and won&apos;t invent one. If validation says this shouldn&apos;t be built,
            we&apos;ll email you that instead.
          </p>
        </div>

        <Card>
          <h2 className="font-display text-xl">Join the waitlist</h2>
          <p className="text-muted mt-2 mb-6 text-sm">
            Two required questions and an email. Everything else is optional.
          </p>
          <Suspense fallback={<div className="bg-surface-2 h-96 animate-pulse rounded" />}>
            <WaitlistForm formSource="waitlist-page" triggerPage="/waitlist" />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}
