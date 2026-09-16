"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { CoachSearchField } from "@/components/coach-search";
import { Button } from "@/components/ui/primitives";
import { track, trackOnce } from "@/lib/analytics/client";
import { queryLengthBand } from "@/lib/analytics/events";

/**
 * The hero search field — the first behavioural question the site asks:
 * "will you type a coach's name?".
 *
 * `hero_search_started` fires once, on the first keystroke rather than on
 * focus, so an accidental tab-through is not counted as intent.
 */
export function HeroSearch({ page = "/" }: { page?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      formRef.current?.querySelector("input")?.focus();
      return;
    }
    // The directory records the search itself (result count included), so this
    // only carries the intent to leave the landing page.
    track("hero_search_started", {
      page,
      query_length: queryLengthBand(trimmed),
      has_query: true,
      source: "hero-submit",
    });
    router.push(`/coaches?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} role="search" className="w-full">
      {/* The white box sits on navy, so hard-offset edges go back to navy here. */}
      <div className="bg-surface text-paper relative flex flex-col gap-2 rounded-2xl p-2 text-left shadow-[0_24px_60px_rgb(0_0_0/0.35)] [--edge:var(--color-paper)] sm:flex-row sm:items-center sm:rounded-full sm:pl-3">
        <CoachSearchField
          id="hero-search"
          variant="bare"
          anchorToForm
          className="flex-1"
          value={query}
          onValueChange={setQuery}
          onInput={() =>
            trackOnce("hero-search-start", "hero_search_started", {
              page,
              source: "hero-typing",
            })
          }
          placeholder="Search by coach, team, Instagram, or TikTok handle"
          source="hero"
        />
        <Button type="submit" className="min-h-12 sm:mr-1 sm:rounded-full sm:px-7">
          Find a coach
        </Button>
      </div>
    </form>
  );
}
