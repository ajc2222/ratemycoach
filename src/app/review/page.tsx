import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ReviewForm } from "@/components/forms/review-form";
import { Card } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Review a coach — privately",
  description:
    "Share your firsthand experience of a bodybuilding coach. Submissions are stored privately during early validation and are never published automatically.",
  alternates: { canonical: "/review" },
};

const PRIVACY_POINTS = [
  // Exact wording matters: this is the privacy promise shown before any field.
  "Your submission will not be publicly posted automatically.",
  "Your email is never made public.",
  "No receipts or screenshots needed.",
];

export default function ReviewPage() {
  return (
    <div className="container-page py-10 sm:py-16">
      <div className="prose-page mx-auto">
        <p className="text-accent text-xs font-bold tracking-[0.16em] uppercase">
          Founding reviews
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl">
          Write the review you wish you&apos;d been able to read
        </h1>
        <p className="text-muted mt-4 text-lg">
          Tell future athletes what the coaching was actually like.
        </p>
      </div>

      <Card className="mx-auto mt-8 max-w-2xl">
        <h2 className="text-lg">Your review stays private</h2>
        <ul className="text-muted mt-3 space-y-2 text-sm">
          {PRIVACY_POINTS.map((point) => (
            <li key={point} className="flex items-start gap-2.5">
              <span aria-hidden="true" className="text-accent font-bold">
                ✓
              </span>
              <span>{point}</span>
            </li>
          ))}
          <li className="flex items-start gap-2.5">
            <span aria-hidden="true" className="text-accent font-bold">
              ✓
            </span>
            <span>
              Deleted any time —{" "}
              <Link href="/contact" className="text-accent underline underline-offset-4">
                just ask
              </Link>
              .
            </span>
          </li>
        </ul>
      </Card>

      <div className="mx-auto mt-10 max-w-2xl">
        <Suspense fallback={<div className="bg-surface h-[60rem] animate-pulse rounded" />}>
          <ReviewForm />
        </Suspense>
      </div>

      <div className="mx-auto mt-12 max-w-2xl">
        <h2 className="font-display text-xl">What makes a review useful</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Card>
            <h3 className="text-ok font-sans text-sm font-semibold">Useful</h3>
            <ul className="text-muted mt-3 space-y-2 text-sm">
              <li>&ldquo;Check-ins were answered within 48 hours, every week.&rdquo;</li>
              <li>
                &ldquo;The first four weeks were a template; it was individualised after I
                pushed.&rdquo;
              </li>
              <li>&ldquo;Peak week was explained in writing two weeks out.&rdquo;</li>
              <li>&ldquo;Post-show reverse was included and followed through.&rdquo;</li>
            </ul>
          </Card>
          <Card>
            <h3 className="text-danger font-sans text-sm font-semibold">Not usable</h3>
            <ul className="text-muted mt-3 space-y-2 text-sm">
              <li>Anything you heard secondhand rather than experienced.</li>
              <li>
                Accusations of crimes or abuse — report those to the police or federation.
              </li>
              <li>Other people&apos;s names, phone numbers or addresses.</li>
              <li>&ldquo;Terrible coach, avoid&rdquo; with nothing behind it.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
