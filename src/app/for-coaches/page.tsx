import type { Metadata } from "next";
import { Suspense } from "react";

import { CoachClaimForm } from "@/components/forms/coach-claim-form";
import { Card, SectionHeading } from "@/components/ui/primitives";
import { copy } from "@/lib/site";

export const metadata: Metadata = {
  title: "For coaches — list or claim a profile",
  description:
    "Coaches can register interest in listing or claiming a PrepCoach Reviews profile. Claiming allows corrections and replies — never removal of legitimate reviews.",
  alternates: { canonical: "/for-coaches" },
};

export default function ForCoachesPage() {
  return (
    <div className="container-page py-10 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <SectionHeading
            eyebrow="For coaches"
            title="List your coaching, or claim your profile"
            lead="If athletes are going to research you, you should have a say in what's factually on the page — and a right of reply to what's said about you."
          />

          <div className="mt-8 space-y-4">
            <Card>
              <h2 className="font-display text-lg">What claiming gets you</h2>
              <ul className="text-muted mt-3 space-y-2 text-sm">
                <li>Correct the facts: pricing, services, divisions, what&apos;s included.</li>
                <li>Publicly reply to any review, in your own words, under the review.</li>
                <li>Mark whether you&apos;re taking clients.</li>
                <li>Be findable by the athletes already searching for you.</li>
              </ul>
            </Card>

            <Card className="border-accent/30">
              <h2 className="font-display text-lg">What it doesn&apos;t</h2>
              <p className="text-muted mt-3 text-sm">{copy.claimLimitation}</p>
              <p className="text-muted mt-3 text-sm">
                We won&apos;t remove a review because you dislike it, and there will never be a
                price for doing so. We will remove one that breaks our rules — not firsthand,
                factually wrong, naming uninvolved people, or making accusations we can&apos;t
                verify. Those rules apply the same way to every coach.
              </p>
            </Card>

            <Card>
              <h2 className="font-display text-lg">Where this is up to</h2>
              <p className="text-muted mt-3 text-sm">
                Nothing is live. No profile has been published, no review has been collected
                about any real coach, and no listing has been sold. This form registers interest
                so we can talk to you before any of that changes — and so we can gauge whether
                coaches want to be part of this at all.
              </p>
            </Card>
          </div>
        </div>

        <div className="lg:col-span-7">
          <Card>
            <h2 className="font-display text-xl">Register your interest</h2>
            <p className="text-muted mt-2 mb-6 text-sm">
              Takes about a minute. We&apos;ll verify your identity before handing over any
              profile.
            </p>
            <Suspense
              fallback={<div className="bg-surface-2 h-[50rem] animate-pulse rounded" />}
            >
              <CoachClaimForm />
            </Suspense>
          </Card>
        </div>
      </div>
    </div>
  );
}
