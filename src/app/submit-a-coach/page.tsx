import type { Metadata } from "next";
import { Suspense } from "react";

import { CoachRequestForm } from "@/components/forms/coach-request-form";
import { Card, SectionHeading } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Request a coach",
  description:
    "Tell us which bodybuilding coach you were trying to research. The most-requested coaches are the ones we research and add first.",
  alternates: { canonical: "/submit-a-coach" },
};

export default function SubmitACoachPage() {
  return (
    <div className="container-page py-10 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <SectionHeading
            eyebrow="Missing coach"
            title="Who were you trying to look up?"
            lead="No real coaches are in the directory yet — everything there is a demonstration. Telling us who you actually wanted is the single most useful thing you can do on this site."
          />
          <Card className="mt-8">
            <h2 className="font-display text-lg">What happens to this</h2>
            <ul className="text-muted mt-3 space-y-2 text-sm">
              <li>
                Requests are counted. The coaches asked for most often are researched and added
                first.
              </li>
              <li>
                We will not contact the coach on your behalf, and your request is never shown to
                them.
              </li>
              <li>
                Anything we eventually publish about a real coach will be factual, sourced, and
                open to their reply.
              </li>
              <li>Your email is optional and used only for the notification you ask for.</li>
            </ul>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card>
            <Suspense
              fallback={<div className="bg-surface-2 h-[40rem] animate-pulse rounded" />}
            >
              <CoachRequestForm />
            </Suspense>
          </Card>
        </div>
      </div>
    </div>
  );
}
