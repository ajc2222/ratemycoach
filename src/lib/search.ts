import { DEMO_COACHES, type DemoCoach } from "@/data/demo-coaches";
import { PRICE_BANDS, type PriceBand } from "@/lib/taxonomy";

/**
 * Normalises a search term so that "@Coach_Name", "coach name" and "Coach Name "
 * all collapse to the same demand signal. This is what gets persisted and
 * ranked — the raw term is kept alongside it for reading, but aggregation is
 * always done on the normalised form.
 */
export function normalizeQuery(raw: string): string {
  return (
    raw
      .toLowerCase()
      .normalize("NFKD")
      // strip combining marks so "Sofía" and "Sofia" aggregate together
      .replace(/[̀-ͯ]/g, "")
      .replace(/^@+/, "")
      .replace(/https?:\/\/(www\.)?(instagram|tiktok)\.com\//g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
  );
}

/** Tokens used for matching; single characters are dropped as noise. */
function tokens(normalized: string): string[] {
  return normalized.split(" ").filter((t) => t.length > 1);
}

/** All the text of a coach that a visitor might plausibly search by. */
function haystack(coach: DemoCoach): string {
  return normalizeQuery(
    [
      coach.name,
      coach.team ?? "",
      coach.instagram ?? "",
      coach.tiktok ?? "",
      coach.specialties.join(" "),
      coach.location,
    ].join(" "),
  );
}

const HAYSTACKS = new WeakMap<DemoCoach, string>();
function cachedHaystack(coach: DemoCoach): string {
  let h = HAYSTACKS.get(coach);
  if (!h) {
    h = haystack(coach);
    HAYSTACKS.set(coach, h);
  }
  return h;
}

export function matchesQuery(coach: DemoCoach, query: string): boolean {
  const normalized = normalizeQuery(query);
  if (!normalized) return true;
  const hay = cachedHaystack(coach);
  const ts = tokens(normalized);
  // A one-character or all-noise query falls back to a raw substring test.
  if (ts.length === 0) return hay.includes(normalized);
  // Every token must appear: "raman bikini" should not match a coach named
  // Raman who does not do bikini, but "priya raman" should.
  return ts.every((t) => hay.includes(t));
}

export interface CoachFilters {
  q?: string;
  divisions?: string[];
  coachingTypes?: string[];
  focus?: string[];
  federations?: string[];
  priceBands?: string[];
  delivery?: string[];
  acceptingOnly?: boolean;
}

export const EMPTY_FILTERS: CoachFilters = {};

function priceBandMatches(coach: DemoCoach, band: PriceBand): boolean {
  const def = PRICE_BANDS.find((b) => b.value === band);
  if (!def) return false;
  const max = def.max ?? Number.POSITIVE_INFINITY;
  // A coach matches a band if their advertised range overlaps it at all.
  return coach.priceMin <= max && coach.priceMax >= def.min;
}

function deliveryMatches(coach: DemoCoach, selected: string[]): boolean {
  if (selected.length === 0) return true;
  // "hybrid" satisfies a search for either remote or in-person.
  return selected.some((s) => {
    if (coach.delivery === "hybrid")
      return s === "remote" || s === "in-person" || s === "hybrid";
    return coach.delivery === s;
  });
}

function focusMatches(coach: DemoCoach, selected: string[]): boolean {
  if (selected.length === 0) return true;
  // A coach whose focus is "both" is a legitimate result for natural *or*
  // enhanced; selecting "both" explicitly asks for coaches who work with both.
  return selected.some((s) => {
    if (s === "both") return coach.focus === "both";
    return coach.focus === s || coach.focus === "both";
  });
}

function overlaps(a: readonly string[], b: readonly string[]): boolean {
  return b.length === 0 || a.some((v) => b.includes(v));
}

/**
 * Pure filtering over the demonstration dataset. Semantics: AND across facets,
 * OR within a facet. Kept free of React and of the DB so it can be unit tested
 * and reused on the server for result counts.
 */
export function filterCoaches(
  filters: CoachFilters,
  coaches: DemoCoach[] = DEMO_COACHES,
): DemoCoach[] {
  return coaches.filter((coach) => {
    if (filters.q && !matchesQuery(coach, filters.q)) return false;
    if (!overlaps(coach.divisions, filters.divisions ?? [])) return false;
    if (!overlaps(coach.coachingTypes, filters.coachingTypes ?? [])) return false;
    if (!overlaps(coach.federations, filters.federations ?? [])) return false;
    if (!focusMatches(coach, filters.focus ?? [])) return false;
    if (!deliveryMatches(coach, filters.delivery ?? [])) return false;
    const bands = filters.priceBands ?? [];
    if (bands.length > 0 && !bands.some((b) => priceBandMatches(coach, b as PriceBand)))
      return false;
    if (filters.acceptingOnly && !coach.acceptingClients) return false;
    return true;
  });
}

export function countActiveFilters(filters: CoachFilters): number {
  return (
    (filters.divisions?.length ?? 0) +
    (filters.coachingTypes?.length ?? 0) +
    (filters.focus?.length ?? 0) +
    (filters.federations?.length ?? 0) +
    (filters.priceBands?.length ?? 0) +
    (filters.delivery?.length ?? 0) +
    (filters.acceptingOnly ? 1 : 0)
  );
}

/** URL <-> filter state. The URL is the single source of truth for the directory. */
export const FILTER_PARAM_KEYS = {
  divisions: "division",
  coachingTypes: "type",
  focus: "focus",
  federations: "federation",
  priceBands: "price",
  delivery: "delivery",
} as const;

type MultiKey = keyof typeof FILTER_PARAM_KEYS;

export function filtersFromParams(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): CoachFilters {
  const get = (key: string): string[] => {
    if (params instanceof URLSearchParams)
      return params.getAll(key).flatMap((v) => v.split(","));
    const v = params[key];
    if (v === undefined) return [];
    return (Array.isArray(v) ? v : [v]).flatMap((x) => x.split(","));
  };
  const first = (key: string): string | undefined => get(key)[0];

  const filters: CoachFilters = {};
  const q = first("q");
  if (q) filters.q = q;
  for (const [field, param] of Object.entries(FILTER_PARAM_KEYS) as [MultiKey, string][]) {
    const values = get(param).filter(Boolean);
    if (values.length > 0) filters[field] = values;
  }
  if (first("accepting") === "1") filters.acceptingOnly = true;
  return filters;
}

export function filtersToSearchParams(filters: CoachFilters): URLSearchParams {
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);
  for (const [field, param] of Object.entries(FILTER_PARAM_KEYS) as [MultiKey, string][]) {
    const values = filters[field];
    if (values && values.length > 0) sp.set(param, values.join(","));
  }
  if (filters.acceptingOnly) sp.set("accepting", "1");
  return sp;
}

export function priceRangeLabel(min: number, max: number): string {
  if (min === max) return `$${min}/mo`;
  return `$${min}–$${max}/mo`;
}
