import { describe, expect, it } from "vitest";

import {
  ALLOWED_PROPS,
  EVENT_NAMES,
  isEventName,
  queryLengthBand,
  sanitizeProps,
} from "@/lib/analytics/events";

/** The 19 events named in the analytics specification (§15 of the brief). */
const SPECIFIED_EVENTS = [
  "landing_viewed",
  "hero_search_started",
  "coach_search_submitted",
  "coach_search_zero_results",
  "filter_selected",
  "category_selected",
  "coach_profile_opened",
  "review_feature_clicked",
  "ai_summary_clicked",
  "compare_clicked",
  "save_coach_clicked",
  "waitlist_started",
  "waitlist_completed",
  "review_form_started",
  "review_form_completed",
  "coach_claim_started",
  "coach_claim_completed",
  "coach_requested",
  "outbound_social_clicked",
];

describe("event dictionary", () => {
  it("implements every event in the specification", () => {
    for (const name of SPECIFIED_EVENTS) {
      expect(EVENT_NAMES, name).toContain(name);
    }
  });

  it("defines no events beyond the specification", () => {
    expect([...EVENT_NAMES].sort()).toEqual([...SPECIFIED_EVENTS].sort());
  });

  it("recognises known names and rejects everything else", () => {
    expect(isEventName("landing_viewed")).toBe(true);
    expect(isEventName("made_up_event")).toBe(false);
    expect(isEventName(null)).toBe(false);
    expect(isEventName(42)).toBe(false);
  });
});

describe("sanitizeProps", () => {
  it("keeps allow-listed properties", () => {
    expect(sanitizeProps({ page: "/coaches", result_count: 3, zero_results: false })).toEqual({
      page: "/coaches",
      result_count: 3,
      zero_results: false,
    });
  });

  it("drops any property not on the allow-list", () => {
    expect(sanitizeProps({ email: "person@example.com", name: "A Person", page: "/" })).toEqual(
      {
        page: "/",
      },
    );
  });

  it("drops an email-shaped value even from an allow-listed property", () => {
    // This is the guarantee that matters: a coding mistake that puts an email
    // into `feature` must not reach the analytics table.
    expect(sanitizeProps({ feature: "person@example.com", page: "/" })).toEqual({ page: "/" });
  });

  it("never carries a raw search term — there is no property for one", () => {
    expect(ALLOWED_PROPS).not.toContain("query");
    expect(ALLOWED_PROPS).not.toContain("search_term");
    expect(sanitizeProps({ query: "a real coach name" })).toEqual({});
  });

  it("clamps long strings", () => {
    const result = sanitizeProps({ category: "x".repeat(500) });
    expect((result.category as string).length).toBeLessThanOrEqual(80);
  });

  it("drops non-finite numbers and null values", () => {
    expect(sanitizeProps({ result_count: Number.NaN, position: null })).toEqual({});
  });

  it("returns an empty object for junk input", () => {
    expect(sanitizeProps(null)).toEqual({});
    expect(sanitizeProps("string")).toEqual({});
    expect(sanitizeProps([1, 2, 3])).toEqual({});
  });
});

describe("queryLengthBand", () => {
  it("bands the length instead of recording the term", () => {
    expect(queryLengthBand("")).toBe("0");
    expect(queryLengthBand("abc")).toBe("1-5");
    expect(queryLengthBand("abcdefgh")).toBe("6-12");
    expect(queryLengthBand("a coach name here")).toBe("13-25");
    expect(queryLengthBand("a".repeat(40))).toBe("26+");
  });
});
