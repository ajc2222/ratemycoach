"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      inputRef.current?.focus();
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
    <form onSubmit={handleSubmit} role="search" className="w-full">
      <label htmlFor="hero-search" className="sr-only">
        Search by coach, team, Instagram, or TikTok handle
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          ref={inputRef}
          id="hero-search"
          type="search"
          name="q"
          value={query}
          onChange={(event) => {
            setQuery(event.currentTarget.value);
            trackOnce("hero-search-start", "hero_search_started", {
              page,
              source: "hero-typing",
            });
          }}
          placeholder="Search by coach, team, Instagram, or TikTok handle"
          autoComplete="off"
          className="border-line-strong bg-surface text-paper placeholder:text-subtle hover:border-muted focus:border-accent min-h-12 w-full flex-1 rounded-[var(--radius-control)] border px-4 py-3"
        />
        <Button type="submit" className="min-h-12 sm:w-auto sm:px-6">
          Find a coach
        </Button>
      </div>
      <p className="text-subtle mt-2 text-sm">
        No real coaches are listed yet. If we don&apos;t have who you&apos;re looking for, you
        can tell us who they are.
      </p>
    </form>
  );
}
