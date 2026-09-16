import type { Metadata } from "next";
import { Suspense } from "react";

import { Directory } from "@/components/directory/directory";

export const metadata: Metadata = {
  title: "Coach directory preview",
  description:
    "Search and filter a preview of the PrepCoach Reviews coach directory. All profiles shown are fictional demonstrations — no real coaches are listed yet.",
  alternates: { canonical: "/coaches" },
  // The directory itself is a legitimate landing page; its *contents* are
  // fictional, so crawlers are told not to follow through to demo profiles.
  robots: { index: true, follow: false },
};

function DirectorySkeleton() {
  return (
    <div className="container-page py-8 sm:py-12" aria-busy="true">
      <div className="skeleton h-4 w-24" />
      <div className="skeleton mt-3 h-11 w-2/3 max-w-md" />
      <div className="skeleton mt-4 h-5 w-full max-w-2xl" />
      <div className="skeleton mt-6 h-12 w-full" />
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:ml-72">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="border-line bg-surface flex gap-4 rounded-[6px] border p-5"
          >
            <div className="skeleton size-[4.5rem] shrink-0" />
            <div className="flex-1 space-y-2.5">
              <div className="skeleton h-5 w-2/3" />
              <div className="skeleton h-4 w-1/2" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-4/5" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading the directory…</span>
    </div>
  );
}

export default function CoachesPage() {
  return (
    <Suspense fallback={<DirectorySkeleton />}>
      <Directory />
    </Suspense>
  );
}
