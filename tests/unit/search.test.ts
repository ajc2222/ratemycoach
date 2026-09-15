import { describe, expect, it } from "vitest";

import { DEMO_COACHES } from "@/data/demo-coaches";
import {
  countActiveFilters,
  filterCoaches,
  filtersFromParams,
  filtersToSearchParams,
  matchesQuery,
  normalizeQuery,
  priceRangeLabel,
} from "@/lib/search";

describe("normalizeQuery", () => {
  it("collapses the ways people type a coach's name into one demand signal", () => {
    const expected = "priya raman";
    for (const input of [
      "Priya Raman",
      "  priya   raman  ",
      "@Priya_Raman",
      "PRIYA RAMAN",
      "priya-raman",
      "Priya.Raman",
      "https://instagram.com/priya raman",
    ]) {
      expect(normalizeQuery(input), input).toBe(expected);
    }
  });

  it("folds accents so 'Sofía' and 'Sofia' aggregate together", () => {
    expect(normalizeQuery("Sofía Iglesias")).toBe(normalizeQuery("Sofia Iglesias"));
  });

  it("strips profile URLs down to the handle", () => {
    expect(normalizeQuery("https://www.tiktok.com/@demo.parkmethod")).toBe("demo parkmethod");
  });

  it("returns an empty string for input with nothing to aggregate on", () => {
    expect(normalizeQuery("   ")).toBe("");
    expect(normalizeQuery("!!!")).toBe("");
  });
});

describe("matchesQuery", () => {
  const priya = DEMO_COACHES.find((c) => c.slug === "demo-priya-raman")!;

  it("matches on name, team, handles and specialties", () => {
    expect(matchesQuery(priya, "Priya")).toBe(true);
    expect(matchesQuery(priya, "Raman Performance")).toBe(true);
    expect(matchesQuery(priya, "@demo.priyaraman.prep")).toBe(true);
    expect(matchesQuery(priya, "posing included")).toBe(true);
  });

  it("requires every token to match, so unrelated tokens exclude", () => {
    expect(matchesQuery(priya, "priya raman")).toBe(true);
    expect(matchesQuery(priya, "priya wexler")).toBe(false);
  });

  it("treats an empty query as matching everything", () => {
    expect(matchesQuery(priya, "")).toBe(true);
  });

  it("does not match a coach who is not in the dataset", () => {
    expect(DEMO_COACHES.some((c) => matchesQuery(c, "Some Real Coach Who Is Not Listed"))).toBe(
      false,
    );
  });
});

describe("filterCoaches", () => {
  it("returns everything when no filters are applied", () => {
    expect(filterCoaches({})).toHaveLength(DEMO_COACHES.length);
  });

  it("ANDs across facets and ORs within a facet", () => {
    const bikini = filterCoaches({ divisions: ["bikini"] });
    const bikiniOrFigure = filterCoaches({ divisions: ["bikini", "figure"] });
    expect(bikiniOrFigure.length).toBeGreaterThanOrEqual(bikini.length);

    const narrowed = filterCoaches({ divisions: ["bikini"], coachingTypes: ["posing"] });
    expect(narrowed.length).toBeLessThanOrEqual(bikini.length);
    expect(narrowed.every((c) => c.divisions.includes("bikini"))).toBe(true);
    expect(narrowed.every((c) => c.coachingTypes.includes("posing"))).toBe(true);
  });

  it("treats a 'both' coach as a valid result for natural or enhanced", () => {
    const natural = filterCoaches({ focus: ["natural"] });
    expect(natural.every((c) => c.focus === "natural" || c.focus === "both")).toBe(true);
    expect(natural.some((c) => c.focus === "both")).toBe(true);
  });

  it("treats an explicit 'both' selection as asking for both", () => {
    expect(filterCoaches({ focus: ["both"] }).every((c) => c.focus === "both")).toBe(true);
  });

  it("treats hybrid delivery as satisfying remote and in-person", () => {
    const remote = filterCoaches({ delivery: ["remote"] });
    const inPerson = filterCoaches({ delivery: ["in-person"] });
    const hybridCoach = DEMO_COACHES.find((c) => c.delivery === "hybrid")!;
    expect(remote).toContain(hybridCoach);
    expect(inPerson).toContain(hybridCoach);
  });

  it("matches a price band when the coach's range overlaps it at all", () => {
    // Avery Stonebridge is $400–550, so both the 400-599 band and a wide
    // selection including it must return them.
    const avery = DEMO_COACHES.find((c) => c.slug === "demo-avery-stonebridge")!;
    expect(filterCoaches({ priceBands: ["400-599"] })).toContain(avery);
    expect(filterCoaches({ priceBands: ["under-150"] })).not.toContain(avery);
  });

  it("includes the open-ended top band", () => {
    const desmond = DEMO_COACHES.find((c) => c.slug === "demo-desmond-whitfield")!;
    expect(filterCoaches({ priceBands: ["600-plus"] })).toContain(desmond);
  });

  it("filters to coaches taking clients", () => {
    expect(filterCoaches({ acceptingOnly: true }).every((c) => c.acceptingClients)).toBe(true);
  });

  it("combines a text query with filters", () => {
    expect(filterCoaches({ q: "Raman", divisions: ["mens-bodybuilding"] })).toHaveLength(0);
    expect(filterCoaches({ q: "Raman", divisions: ["bikini"] })).toHaveLength(1);
  });

  it("returns nothing for a coach who isn't in the demonstration set", () => {
    expect(filterCoaches({ q: "An Unlisted Real Coach" })).toHaveLength(0);
  });
});

describe("filter URL round-trip", () => {
  it("survives a serialise/parse cycle unchanged", () => {
    const filters = {
      q: "raman",
      divisions: ["bikini", "wellness"],
      coachingTypes: ["posing"],
      focus: ["natural"],
      federations: ["npc"],
      priceBands: ["250-399"],
      delivery: ["remote"],
      acceptingOnly: true,
    };
    const params = filtersToSearchParams(filters);
    expect(filtersFromParams(params)).toEqual(filters);
  });

  it("parses repeated and comma-joined params identically", () => {
    expect(filtersFromParams(new URLSearchParams("division=bikini&division=figure"))).toEqual({
      divisions: ["bikini", "figure"],
    });
    expect(filtersFromParams(new URLSearchParams("division=bikini,figure"))).toEqual({
      divisions: ["bikini", "figure"],
    });
  });

  it("accepts the Next.js searchParams record shape", () => {
    expect(filtersFromParams({ q: "x", division: ["bikini"], accepting: "1" })).toEqual({
      q: "x",
      divisions: ["bikini"],
      acceptingOnly: true,
    });
  });

  it("omits empty facets from the URL", () => {
    expect(filtersToSearchParams({ divisions: [] }).toString()).toBe("");
  });
});

describe("countActiveFilters", () => {
  it("counts each selected value, plus the accepting toggle", () => {
    expect(countActiveFilters({})).toBe(0);
    expect(
      countActiveFilters({
        divisions: ["bikini", "figure"],
        focus: ["natural"],
        acceptingOnly: true,
      }),
    ).toBe(4);
  });

  it("does not count the free-text query as a filter", () => {
    expect(countActiveFilters({ q: "raman" })).toBe(0);
  });
});

describe("priceRangeLabel", () => {
  it("formats a range and a single value", () => {
    expect(priceRangeLabel(250, 350)).toBe("$250–$350/mo");
    expect(priceRangeLabel(300, 300)).toBe("$300/mo");
  });
});

describe("demonstration dataset integrity", () => {
  it("has between 8 and 15 profiles, as specified", () => {
    expect(DEMO_COACHES.length).toBeGreaterThanOrEqual(8);
    expect(DEMO_COACHES.length).toBeLessThanOrEqual(15);
  });

  it("marks every record as demonstration data", () => {
    expect(DEMO_COACHES.every((c) => c.isDemo === true)).toBe(true);
    expect(DEMO_COACHES.every((c) => c.slug.startsWith("demo-"))).toBe(true);
  });

  it("prefixes every social handle so it cannot resolve to a real account", () => {
    for (const coach of DEMO_COACHES) {
      if (coach.instagram) expect(coach.instagram.startsWith("demo.")).toBe(true);
      if (coach.tiktok) expect(coach.tiktok.startsWith("demo.")).toBe(true);
      if (coach.website) expect(coach.website).toMatch(/^https:\/\/example\.com\//);
    }
  });

  it("carries no ratings, review counts or client outcomes", () => {
    for (const coach of DEMO_COACHES) {
      const keys = Object.keys(coach);
      expect(keys).not.toContain("rating");
      expect(keys).not.toContain("reviewCount");
      expect(keys).not.toContain("testimonials");
      expect(keys).not.toContain("clientResults");
    }
  });

  it("uses unique ids and slugs", () => {
    expect(new Set(DEMO_COACHES.map((c) => c.id)).size).toBe(DEMO_COACHES.length);
    expect(new Set(DEMO_COACHES.map((c) => c.slug)).size).toBe(DEMO_COACHES.length);
  });

  it("covers every division, both focuses and the whole price range", () => {
    const divisions = new Set(DEMO_COACHES.flatMap((c) => c.divisions));
    expect(divisions.size).toBe(9);
    const focuses = new Set(DEMO_COACHES.map((c) => c.focus));
    expect(focuses).toEqual(new Set(["natural", "enhanced", "both"]));
    expect(Math.min(...DEMO_COACHES.map((c) => c.priceMin))).toBeLessThan(150);
    expect(Math.max(...DEMO_COACHES.map((c) => c.priceMax))).toBeGreaterThanOrEqual(600);
  });

  it("includes coaches both taking and not taking clients, claimed and unclaimed", () => {
    expect(DEMO_COACHES.some((c) => c.acceptingClients)).toBe(true);
    expect(DEMO_COACHES.some((c) => !c.acceptingClients)).toBe(true);
    expect(DEMO_COACHES.some((c) => c.claimed)).toBe(true);
    expect(DEMO_COACHES.some((c) => !c.claimed)).toBe(true);
  });
});
