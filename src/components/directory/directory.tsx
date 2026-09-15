"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CoachCard } from "@/components/coach-card";
import { Dialog } from "@/components/ui/dialog";
import { Button, ButtonLink, Card, cx } from "@/components/ui/primitives";
import { DEMO_COACHES } from "@/data/demo-coaches";
import { getSessionId, track } from "@/lib/analytics/client";
import { queryLengthBand } from "@/lib/analytics/events";
import {
  countActiveFilters,
  filterCoaches,
  filtersFromParams,
  filtersToSearchParams,
  normalizeQuery,
  type CoachFilters,
} from "@/lib/search";
import {
  COACHING_TYPES,
  DELIVERY,
  DIVISIONS,
  FEDERATIONS,
  FOCUSES,
  PRICE_BANDS,
  type Option,
} from "@/lib/taxonomy";

/**
 * The directory.
 *
 * The URL is the single source of truth for search + filter state, which makes
 * every result set shareable, back-button safe, and reproducible from an
 * analytics row. Filtering runs on the client over the fictional dataset
 * (twelve records — a network round-trip would be pure latency), while the
 * *search term* is posted to the server, because an unmatched search for a real
 * coach is the single most valuable signal this smoke test can collect.
 */

const FACETS: {
  key: keyof CoachFilters;
  param: string;
  legend: string;
  options: readonly Option[];
  hint?: string;
}[] = [
  { key: "divisions", param: "division", legend: "Division", options: DIVISIONS },
  { key: "coachingTypes", param: "type", legend: "Coaching type", options: COACHING_TYPES },
  {
    key: "focus",
    param: "focus",
    legend: "Natural or enhanced",
    options: FOCUSES,
    hint: "Describes the coach's stated focus — not a claim about any athlete.",
  },
  { key: "federations", param: "federation", legend: "Federation", options: FEDERATIONS },
  {
    key: "priceBands",
    param: "price",
    legend: "Monthly price",
    options: PRICE_BANDS.map((band) => ({ value: band.value, label: band.label })),
  },
  { key: "delivery", param: "delivery", legend: "Remote or in person", options: DELIVERY },
];

function FilterControls({
  filters,
  onToggle,
  onAcceptingChange,
  idPrefix,
}: {
  filters: CoachFilters;
  onToggle: (key: keyof CoachFilters, facet: string, value: string) => void;
  onAcceptingChange: (checked: boolean) => void;
  idPrefix: string;
}) {
  return (
    <div className="space-y-6">
      {FACETS.map((facet) => {
        const selected = (filters[facet.key] as string[] | undefined) ?? [];
        return (
          <fieldset key={facet.key}>
            <legend className="text-paper mb-2 text-sm font-semibold">{facet.legend}</legend>
            {facet.hint ? <p className="text-subtle mb-2 text-xs">{facet.hint}</p> : null}
            <div className="flex flex-wrap gap-2">
              {facet.options.map((option) => {
                const id = `${idPrefix}-${facet.key}-${option.value}`;
                const checked = selected.includes(option.value);
                return (
                  <label
                    key={option.value}
                    htmlFor={id}
                    className={cx(
                      "inline-flex min-h-11 cursor-pointer items-center rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                      checked
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-line bg-ink text-muted hover:border-muted hover:text-paper",
                    )}
                  >
                    <input
                      id={id}
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => onToggle(facet.key, facet.param, option.value)}
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      <label className="border-line flex min-h-11 cursor-pointer items-center gap-3 border-t pt-4 text-sm">
        <input
          type="checkbox"
          checked={Boolean(filters.acceptingOnly)}
          onChange={(event) => onAcceptingChange(event.currentTarget.checked)}
          className="size-5 accent-[var(--color-accent)]"
        />
        <span>Only show coaches taking clients</span>
      </label>
    </div>
  );
}

export function Directory() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => filtersFromParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [queryInput, setQueryInput] = useState(filters.q ?? "");
  const [sheetOpen, setSheetOpen] = useState(false);
  const searchStarted = useRef(false);
  const lastRecorded = useRef<string | null>(null);

  // Keep the visible input in step with back/forward navigation.
  useEffect(() => {
    setQueryInput(filters.q ?? "");
  }, [filters.q]);

  const results = useMemo(() => filterCoaches(filters), [filters]);
  const activeFilterCount = countActiveFilters(filters);

  const pushFilters = useCallback(
    (next: CoachFilters) => {
      const params = filtersToSearchParams(next);
      const query = params.toString();
      router.replace(query ? `/coaches?${query}` : "/coaches", { scroll: false });
    },
    [router],
  );

  /**
   * Records the search server-side. Only fires for a *submitted* search, never
   * per keystroke: keystroke-level capture would bury the real demand signal in
   * prefixes ("j", "jo", "joh"…) and is needless surveillance of typing.
   */
  const recordSearch = useCallback(
    (rawQuery: string, resultCount: number, activeFilters: CoachFilters) => {
      const normalized = normalizeQuery(rawQuery);
      if (!normalized) return;
      // One record per distinct term per page session. Without this, the URL
      // effect and the submit handler both fire for the same search, and every
      // subsequent filter toggle would re-count it.
      if (lastRecorded.current === normalized) return;
      lastRecorded.current = normalized;

      track("coach_search_submitted", {
        result_count: resultCount,
        zero_results: resultCount === 0,
        query_length: queryLengthBand(rawQuery),
        filters_active: countActiveFilters(activeFilters),
      });
      if (resultCount === 0) {
        track("coach_search_zero_results", {
          query_length: queryLengthBand(rawQuery),
          filters_active: countActiveFilters(activeFilters),
        });
      }

      void fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: rawQuery,
          result_count: resultCount,
          filters: {
            divisions: activeFilters.divisions ?? [],
            coachingTypes: activeFilters.coachingTypes ?? [],
            focus: activeFilters.focus ?? [],
            federations: activeFilters.federations ?? [],
            priceBands: activeFilters.priceBands ?? [],
            delivery: activeFilters.delivery ?? [],
            acceptingOnly: Boolean(activeFilters.acceptingOnly),
          },
          page: "/coaches",
          session_id: getSessionId(),
        }),
        keepalive: true,
      }).catch(() => undefined);
    },
    [],
  );

  // A search arriving from the hero (or a shared link) must be recorded too.
  useEffect(() => {
    if (!filters.q) return;
    recordSearch(filters.q, filterCoaches(filters).length, filters);
  }, [filters, recordSearch]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = { ...filters, q: queryInput.trim() || undefined };
    if (!next.q) delete next.q;
    pushFilters(next);
    if (next.q) recordSearch(next.q, filterCoaches(next).length, next);
  };

  const handleToggle = (key: keyof CoachFilters, facet: string, value: string) => {
    const current = (filters[key] as string[] | undefined) ?? [];
    const selected = current.includes(value);
    const nextValues = selected ? current.filter((v) => v !== value) : [...current, value];
    const next: CoachFilters = { ...filters };
    if (nextValues.length > 0) {
      (next[key] as string[]) = nextValues;
    } else {
      delete next[key];
    }
    pushFilters(next);
    // Deselecting is as informative as selecting; both are recorded.
    track("filter_selected", {
      filter_facet: facet,
      filter_value: value,
      result_count: filterCoaches(next).length,
      filters_active: countActiveFilters(next),
      step: selected ? "removed" : "added",
    });
  };

  const handleAcceptingChange = (checked: boolean) => {
    const next: CoachFilters = { ...filters };
    if (checked) next.acceptingOnly = true;
    else delete next.acceptingOnly;
    pushFilters(next);
    track("filter_selected", {
      filter_facet: "accepting",
      filter_value: checked ? "yes" : "any",
      result_count: filterCoaches(next).length,
      filters_active: countActiveFilters(next),
      step: checked ? "added" : "removed",
    });
  };

  const clearAll = () => {
    setQueryInput("");
    router.replace("/coaches", { scroll: false });
  };

  const hasQuery = Boolean(filters.q);
  const zeroResults = results.length === 0;

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="max-w-2xl">
        <h1 className="text-3xl sm:text-4xl">Coach directory preview</h1>
        <p className="text-muted mt-3">
          Search and filtering are live, running against{" "}
          <strong className="text-paper">
            {DEMO_COACHES.length} fictional demonstration profiles
          </strong>{" "}
          built to show how the directory will work. No real coaches are listed yet — if you
          search for one, tell us who, and they go to the top of our research list.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        role="search"
        className="mt-6 flex flex-col gap-3 sm:flex-row"
      >
        <div className="flex-1">
          <label htmlFor="directory-search" className="sr-only">
            Search by coach, team, Instagram, or TikTok handle
          </label>
          <input
            id="directory-search"
            type="search"
            name="q"
            value={queryInput}
            onChange={(event) => {
              setQueryInput(event.currentTarget.value);
              if (!searchStarted.current) {
                searchStarted.current = true;
                track("hero_search_started", { page: "/coaches", source: "directory" });
              }
            }}
            placeholder="Search by coach, team, Instagram, or TikTok handle"
            autoComplete="off"
            className="border-line-strong bg-surface text-paper placeholder:text-subtle hover:border-muted focus:border-accent min-h-12 w-full rounded-[var(--radius-control)] border px-4 py-3"
          />
        </div>
        <Button type="submit" className="sm:w-auto">
          Search
        </Button>
      </form>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        {/* Desktop filter rail */}
        <aside className="hidden w-64 shrink-0 lg:block" aria-label="Filters">
          <div className="sticky top-20">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg">Filters</h2>
              {activeFilterCount > 0 || hasQuery ? (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-accent text-sm underline underline-offset-4"
                >
                  Clear all
                </button>
              ) : null}
            </div>
            <FilterControls
              filters={filters}
              onToggle={handleToggle}
              onAcceptingChange={handleAcceptingChange}
              idPrefix="rail"
            />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-5 flex items-center justify-between gap-4">
            <p aria-live="polite" className="text-muted text-sm">
              <strong className="text-paper">{results.length}</strong>{" "}
              {results.length === 1 ? "demonstration profile" : "demonstration profiles"}
              {hasQuery ? (
                <>
                  {" "}
                  matching <span className="text-paper">&ldquo;{filters.q}&rdquo;</span>
                </>
              ) : null}
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSheetOpen(true)}
              className="px-4 py-2 text-sm lg:hidden"
            >
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </Button>
          </div>

          {zeroResults ? (
            <Card className="text-center">
              <h2 className="font-display text-2xl">We don&apos;t have this coach yet.</h2>
              <p className="text-muted mx-auto mt-3 max-w-md">
                {hasQuery ? (
                  <>
                    Nothing in the demonstration set matches{" "}
                    <strong className="text-paper">&ldquo;{filters.q}&rdquo;</strong>. That is
                    expected — the directory is a preview, and no real coaches are listed. We
                    have recorded the search so we know who people are looking for.
                  </>
                ) : (
                  <>No demonstration profiles match those filters. Try removing one.</>
                )}
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                {hasQuery ? (
                  <ButtonLink
                    href={`/submit-a-coach?coach=${encodeURIComponent(filters.q ?? "")}`}
                  >
                    Request this coach
                  </ButtonLink>
                ) : null}
                <Button type="button" variant="secondary" onClick={clearAll}>
                  Clear {hasQuery ? "search and filters" : "filters"}
                </Button>
              </div>
            </Card>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((coach, index) => (
                <CoachCard key={coach.id} coach={coach} position={index + 1} />
              ))}
            </ul>
          )}

          {!zeroResults ? (
            <Card className="mt-6 border-dashed">
              <p className="text-muted text-sm">
                <strong className="text-paper">Looking for a specific coach?</strong> These are
                demonstrations, not real listings. Tell us who you were hoping to research and
                we&apos;ll prioritise them.{" "}
                <Link
                  href={
                    hasQuery
                      ? `/submit-a-coach?coach=${encodeURIComponent(filters.q ?? "")}`
                      : "/submit-a-coach"
                  }
                  className="text-accent underline underline-offset-4"
                >
                  Request a coach →
                </Link>
              </p>
            </Card>
          ) : null}
        </div>
      </div>

      {/* Mobile filter sheet */}
      <Dialog
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filters"
        description={`${results.length} demonstration ${
          results.length === 1 ? "profile" : "profiles"
        } match.`}
      >
        <FilterControls
          filters={filters}
          onToggle={handleToggle}
          onAcceptingChange={handleAcceptingChange}
          idPrefix="sheet"
        />
        <div className="mt-6 flex gap-3">
          <Button type="button" onClick={() => setSheetOpen(false)} className="flex-1">
            Show {results.length} {results.length === 1 ? "profile" : "profiles"}
          </Button>
          <Button type="button" variant="secondary" onClick={clearAll}>
            Clear
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
