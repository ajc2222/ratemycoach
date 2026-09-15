import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ReviewForm } from "@/components/forms/review-form";
import { Card } from "@/components/ui/primitives";
import { copy } from "@/lib/site";

export const metadata: Metadata = {
  title: "Review a coach — privately",
  description:
    "Share your firsthand experience of a bodybuilding coach. Submissions are stored privately during early validation and are never published automatically.",
  alternates: { canonical: "/review" },
};

export default function ReviewPage() {
  return (
    <div className="container-page py-10 sm:py-16">
      <div className="prose-page mx-auto">
        <p className="text-accent text-xs font-semibold tracking-[0.18em] uppercase">
          Founding reviews
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl">
          Write the review you wish you&apos;d been able to read
        </h1>
        <p className="text-muted mt-4 text-lg">
          Before you paid that coach, you probably searched for what their clients said and
          found transformation photos. This is the other side of that.
        </p>
      </div>

      <Card className="border-accent/30 bg-accent/5 mx-auto mt-8 max-w-2xl">
        <h2 className="font-display text-lg">What happens to what you write</h2>
        <p className="text-muted mt-3 text-sm">{copy.reviewPrivacy}</p>
        <ul className="text-muted mt-4 space-y-2 text-sm">
          <li className="flex gap-2">
            <span aria-hidden="true" className="text-accent">
              ·
            </span>
            It is stored privately and is not visible on this site to anyone.
          </li>
          <li className="flex gap-2">
            <span aria-hidden="true" className="text-accent">
              ·
            </span>
            It is never published automatically — publication needs your separate permission
            <em> and </em> moderation <em>and</em> verification, none of which exist yet.
          </li>
          <li className="flex gap-2">
            <span aria-hidden="true" className="text-accent">
              ·
            </span>
            Your email is never attached to anything public.
          </li>
          <li className="flex gap-2">
            <span aria-hidden="true" className="text-accent">
              ·
            </span>
            We don&apos;t ask for receipts, screenshots or documents. Not during validation — we
            haven&apos;t built somewhere safe to keep them.
          </li>
          <li className="flex gap-2">
            <span aria-hidden="true" className="text-accent">
              ·
            </span>
            You can have it deleted at any time by{" "}
            <Link href="/contact" className="text-accent underline underline-offset-4">
              emailing us
            </Link>
            .
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
