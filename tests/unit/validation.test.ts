import { describe, expect, it } from "vitest";

import {
  coachClaimSchema,
  coachRequestSchema,
  contactSchema,
  fieldErrors,
  reviewSchema,
  searchEventSchema,
  waitlistSchema,
} from "@/lib/validation/schemas";

const validWaitlist = {
  email: "athlete@example.com",
  role: "athlete",
  primary_division: "bikini",
  intent: "now",
  consent_updates: true,
};

const validReview = {
  coach_name: "A Coach",
  relationship: "former",
  coaching_types: ["contest-prep"],
  division: "bikini",
  focus: "natural",
  rating_overall: 4,
  rating_communication: 4,
  rating_personalization: 3,
  rating_value: 5,
  what_went_well:
    "Check-ins were answered within forty-eight hours every week and the feedback was specific.",
  what_could_improve:
    "The first block felt templated and only became individualised once I asked directly.",
  would_hire_again: "yes",
  permission_contact: true,
  permission_publish: false,
  attestation: true,
  email: "reviewer@example.com",
};

describe("waitlistSchema", () => {
  it("accepts a minimal valid submission", () => {
    expect(waitlistSchema.safeParse(validWaitlist).success).toBe(true);
  });

  it("rejects a missing or malformed email", () => {
    for (const email of ["", "nope", "a@b", "no-at-sign.com", "spaces @example.com"]) {
      expect(waitlistSchema.safeParse({ ...validWaitlist, email }).success, email).toBe(false);
    }
  });

  it("accepts real-world email shapes", () => {
    for (const email of ["a.b+tag@example.co.uk", "UPPER@Example.COM", "x@y.io"]) {
      expect(waitlistSchema.safeParse({ ...validWaitlist, email }).success, email).toBe(true);
    }
  });

  it("refuses consent that is absent or false — a box that accepts false is not consent", () => {
    expect(waitlistSchema.safeParse({ ...validWaitlist, consent_updates: false }).success).toBe(
      false,
    );
    const withoutConsent: Partial<typeof validWaitlist> = { ...validWaitlist };
    delete withoutConsent.consent_updates;
    expect(waitlistSchema.safeParse(withoutConsent).success).toBe(false);
  });

  it("rejects enum values that are not in the taxonomy", () => {
    expect(waitlistSchema.safeParse({ ...validWaitlist, role: "hacker" }).success).toBe(false);
    expect(
      waitlistSchema.safeParse({ ...validWaitlist, primary_division: "strongman" }).success,
    ).toBe(false);
    expect(waitlistSchema.safeParse({ ...validWaitlist, intent: "someday" }).success).toBe(
      false,
    );
  });

  it("accepts the optional behavioural context", () => {
    const parsed = waitlistSchema.safeParse({
      ...validWaitlist,
      coach_searched: "Someone",
      coach_handle: "@someone",
      has_paid_for_coaching: true,
      budget_band: "250-399",
      decision_factor: "communication",
      acquisition_source: "reddit",
      trigger_feature: "ai-summary",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a trigger feature that is not a real gate", () => {
    expect(
      waitlistSchema.safeParse({ ...validWaitlist, trigger_feature: "delete-reviews" }).success,
    ).toBe(false);
  });

  it("normalises empty optional strings to undefined rather than storing blanks", () => {
    const parsed = waitlistSchema.parse({ ...validWaitlist, coach_searched: "" });
    expect(parsed.coach_searched).toBeUndefined();
  });
});

describe("reviewSchema", () => {
  it("accepts a complete submission", () => {
    expect(reviewSchema.safeParse(validReview).success).toBe(true);
  });

  it("requires the firsthand attestation", () => {
    expect(reviewSchema.safeParse({ ...validReview, attestation: false }).success).toBe(false);
  });

  it("keeps the two permissions independent", () => {
    const parsed = reviewSchema.parse({
      ...validReview,
      permission_contact: false,
      permission_publish: true,
    });
    expect(parsed.permission_contact).toBe(false);
    expect(parsed.permission_publish).toBe(true);
  });

  it("rejects ratings outside 1–5", () => {
    for (const rating of [0, 6, -1, 2.5]) {
      expect(
        reviewSchema.safeParse({ ...validReview, rating_overall: rating }).success,
        String(rating),
      ).toBe(false);
    }
  });

  it("coerces numeric ratings arriving as strings from a form", () => {
    const parsed = reviewSchema.safeParse({ ...validReview, rating_overall: "5" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.rating_overall).toBe(5);
  });

  it("rejects free text that is too short to be usable", () => {
    expect(reviewSchema.safeParse({ ...validReview, what_went_well: "Good" }).success).toBe(
      false,
    );
  });

  it("rejects free text beyond the storage limit", () => {
    expect(
      reviewSchema.safeParse({ ...validReview, what_went_well: "a".repeat(4001) }).success,
    ).toBe(false);
  });

  it("requires at least one coaching type", () => {
    expect(reviewSchema.safeParse({ ...validReview, coaching_types: [] }).success).toBe(false);
  });

  it("accepts month-precision dates and rejects anything else", () => {
    expect(
      reviewSchema.safeParse({ ...validReview, coaching_started: "2025-03" }).success,
    ).toBe(true);
    expect(
      reviewSchema.safeParse({ ...validReview, coaching_started: "2025-13" }).success,
    ).toBe(false);
    expect(
      reviewSchema.safeParse({ ...validReview, coaching_started: "March 2025" }).success,
    ).toBe(false);
  });

  it("rejects an end month before the start month", () => {
    const result = reviewSchema.safeParse({
      ...validReview,
      coaching_started: "2025-06",
      coaching_ended: "2025-01",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error)).toHaveProperty("coaching_ended");
    }
  });

  it("allows 'not-applicable' for the natural/enhanced question", () => {
    expect(reviewSchema.safeParse({ ...validReview, focus: "not-applicable" }).success).toBe(
      true,
    );
  });
});

describe("coachClaimSchema", () => {
  const validClaim = {
    coach_name: "A Coach",
    business_email: "coach@example.com",
    divisions: ["bikini"],
    coaching_types: ["contest-prep"],
    focus: "both",
    interests: ["claim-profile"],
    consent_contact: true,
  };

  it("accepts a valid registration", () => {
    expect(coachClaimSchema.safeParse(validClaim).success).toBe(true);
  });

  it("requires contact consent", () => {
    expect(coachClaimSchema.safeParse({ ...validClaim, consent_contact: false }).success).toBe(
      false,
    );
  });

  it("requires at least one interest, division and coaching type", () => {
    expect(coachClaimSchema.safeParse({ ...validClaim, interests: [] }).success).toBe(false);
    expect(coachClaimSchema.safeParse({ ...validClaim, divisions: [] }).success).toBe(false);
    expect(coachClaimSchema.safeParse({ ...validClaim, coaching_types: [] }).success).toBe(
      false,
    );
  });

  it("accepts multiple interests including promoted placement", () => {
    expect(
      coachClaimSchema.safeParse({
        ...validClaim,
        interests: ["add-profile", "launch-updates", "promoted-placement"],
      }).success,
    ).toBe(true);
  });
});

describe("coachRequestSchema", () => {
  it("accepts a request with no email at all", () => {
    expect(coachRequestSchema.safeParse({ coach_name: "Someone" }).success).toBe(true);
  });

  it("requires an email when the visitor asked to be notified", () => {
    const result = coachRequestSchema.safeParse({ coach_name: "Someone", notify: true });
    expect(result.success).toBe(false);
    if (!result.success) expect(fieldErrors(result.error)).toHaveProperty("email");
  });

  it("accepts notify with an email", () => {
    expect(
      coachRequestSchema.safeParse({
        coach_name: "Someone",
        notify: true,
        email: "fan@example.com",
      }).success,
    ).toBe(true);
  });

  it("requires a coach name", () => {
    expect(coachRequestSchema.safeParse({ coach_name: "" }).success).toBe(false);
  });
});

describe("contactSchema", () => {
  it("accepts a data-deletion request", () => {
    expect(
      contactSchema.safeParse({
        email: "person@example.com",
        topic: "data-deletion",
        message: "Please delete everything you hold about me.",
      }).success,
    ).toBe(true);
  });

  it("rejects an unknown topic", () => {
    expect(
      contactSchema.safeParse({
        email: "person@example.com",
        topic: "spam",
        message: "Buy my product right now please.",
      }).success,
    ).toBe(false);
  });
});

describe("searchEventSchema", () => {
  it("accepts a zero-result search", () => {
    expect(searchEventSchema.safeParse({ query: "someone", result_count: 0 }).success).toBe(
      true,
    );
  });

  it("rejects a negative result count", () => {
    expect(searchEventSchema.safeParse({ query: "x", result_count: -1 }).success).toBe(false);
  });
});

describe("fieldErrors", () => {
  it("maps each invalid field to one message, keyed by field name", () => {
    const result = waitlistSchema.safeParse({ email: "bad", role: "nope" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = fieldErrors(result.error);
      expect(errors.email).toBeTruthy();
      expect(errors.role).toBeTruthy();
      expect(Object.values(errors).every((m) => typeof m === "string" && m.length > 0)).toBe(
        true,
      );
    }
  });
});
