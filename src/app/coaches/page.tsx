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
    <div className="container-page py-8 sm:py-12">
      <div className="bg-surface-2 h-9 w-2/3 max-w-md rounded" />
      <div className="bg-surface mt-4 h-5 w-full max-w-2xl rounded" />
      <div className="bg-surface mt-6 h-12 w-full rounded-[var(--radius-control)]" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-surface h-64 rounded-[var(--radius-card)]" />
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
