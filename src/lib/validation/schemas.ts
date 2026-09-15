import { z } from "zod";

import {
  ACQUISITION_SOURCE_VALUES,
  BUDGET_BAND_VALUES,
  CLIENT_RELATIONSHIP_VALUES,
  COACHING_TYPE_VALUES,
  COACH_INTEREST_VALUES,
  DECISION_FACTOR_VALUES,
  DELIVERY_VALUES,
  DIVISION_VALUES,
  FEDERATION_VALUES,
  FOCUS_VALUES,
  GATED_FEATURE_VALUES,
  INTENT_VALUES,
  ROLE_VALUES,
  WOULD_HIRE_AGAIN_VALUES,
} from "@/lib/taxonomy";

/**
 * Server-side validation for every write endpoint.
 *
 * Two rules run through all of it:
 *  - Enumerations are derived from `taxonomy.ts`, so a value that is not in the
 *    UI cannot be accepted by the API.
 *  - Consent and attestation booleans use `literal(true)`. A consent box that
 *    can be satisfied by `false` is not consent.
 */

const enumOf = <T extends string>(values: T[], message: string) =>
  z.enum(values as [T, ...T[]], { message });

export const emailSchema = z
  .string()
  .trim()
  .min(5, "Enter your email address.")
  .max(254, "That email address is too long.")
  // Deliberately permissive — the only authority on deliverability is a real
  // send, and an over-strict pattern loses genuine signups.
  .regex(/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/, "Enter a valid email address.");

const shortText = (max: number, label: string) =>
  z.string().trim().min(1, `${label} is required.`).max(max, `${label} is too long.`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "That's longer than we can store.")
    .optional()
    .transform((v) => (v === "" ? undefined : v));

/** Optional free-typed handle or URL. Normalisation happens after validation. */
const handleField = optionalText(200);

/** Fields every form posts. The honeypot must stay empty; the timestamp catches instant bots. */
export const envelopeSchema = z.object({
  /** Honeypot. Named to look attractive to a naive bot, hidden from people. */
  website_url: z.string().max(200).optional(),
  /** Milliseconds the form was on screen before submission. */
  elapsed_ms: z.coerce
    .number()
    .int()
    .min(0)
    .max(1000 * 60 * 60 * 24)
    .optional(),
  trigger_page: optionalText(200),
  trigger_coach_id: optionalText(64),
  trigger_feature: enumOf(GATED_FEATURE_VALUES, "Unknown feature.").optional(),
  session_id: optionalText(64),
});

export const waitlistSchema = envelopeSchema.extend({
  email: emailSchema,
  role: enumOf(ROLE_VALUES, "Choose which best describes you."),
  primary_division: enumOf(DIVISION_VALUES, "Choose a division or interest."),
  intent: enumOf(INTENT_VALUES, "Let us know where you are in the process."),
  consent_updates: z.literal(true, {
    message: "We need your permission before we can email you.",
  }),
  // Optional context
  coach_searched: optionalText(160),
  coach_handle: handleField,
  has_paid_for_coaching: z.boolean().optional(),
  budget_band: enumOf(BUDGET_BAND_VALUES, "Unknown budget option.").optional(),
  decision_factor: enumOf(DECISION_FACTOR_VALUES, "Unknown option.").optional(),
  acquisition_source: enumOf(ACQUISITION_SOURCE_VALUES, "Unknown option.").optional(),
  form_source: optionalText(64),
});
export type WaitlistInput = z.infer<typeof waitlistSchema>;

const ratingField = (label: string) =>
  z.coerce
    .number({ message: `Rate ${label}.` })
    .int()
    .min(1, `Rate ${label} from 1 to 5.`)
    .max(5, `Rate ${label} from 1 to 5.`);

/** `YYYY-MM` — we ask for month precision only; an exact date is more than we need. */
const monthField = z
  .string()
  .trim()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use the month picker.")
  .optional()
  .transform((v) => (v === "" ? undefined : v));

export const reviewSchema = envelopeSchema
  .extend({
    coach_name: shortText(160, "The coach or team name"),
    coach_handle: handleField,
    demo_coach_id: optionalText(64),
    relationship: enumOf(
      CLIENT_RELATIONSHIP_VALUES,
      "Tell us if you're a current or former client.",
    ),
    coaching_started: monthField,
    coaching_ended: monthField,
    coaching_types: z
      .array(enumOf(COACHING_TYPE_VALUES, "Unknown coaching type."))
      .min(1, "Choose at least one type of coaching.")
      .max(COACHING_TYPE_VALUES.length),
    division: enumOf(DIVISION_VALUES, "Choose your division."),
    focus: z.enum(["natural", "enhanced", "not-applicable"], {
      message: "Choose one option.",
    }),
    monthly_price_band: enumOf(BUDGET_BAND_VALUES, "Unknown price option.").optional(),
    rating_overall: ratingField("your overall experience"),
    rating_communication: ratingField("communication"),
    rating_personalization: ratingField("personalisation"),
    rating_value: ratingField("value"),
    what_went_well: z
      .string()
      .trim()
      .min(40, "Please write at least a couple of sentences — short notes aren't usable.")
      .max(4000, "Please keep this under 4000 characters."),
    what_could_improve: z
      .string()
      .trim()
      .min(40, "Please write at least a couple of sentences — short notes aren't usable.")
      .max(4000, "Please keep this under 4000 characters."),
    would_hire_again: enumOf(WOULD_HIRE_AGAIN_VALUES, "Choose one option."),
    permission_contact: z.boolean(),
    permission_publish: z.boolean(),
    attestation: z.literal(true, {
      message: "Please confirm this is your own firsthand experience and is accurate.",
    }),
    email: emailSchema,
    join_founding_reviewers: z.boolean().optional(),
  })
  .refine(
    (data) =>
      !data.coaching_started ||
      !data.coaching_ended ||
      data.coaching_ended >= data.coaching_started,
    { message: "The end month can't be before the start month.", path: ["coaching_ended"] },
  );
export type ReviewInput = z.infer<typeof reviewSchema>;

export const coachClaimSchema = envelopeSchema.extend({
  coach_name: shortText(160, "Your name"),
  team_name: optionalText(160),
  business_email: emailSchema,
  instagram: handleField,
  tiktok: handleField,
  website: optionalText(300),
  divisions: z
    .array(enumOf(DIVISION_VALUES, "Unknown division."))
    .min(1, "Choose at least one division you coach.")
    .max(DIVISION_VALUES.length),
  coaching_types: z
    .array(enumOf(COACHING_TYPE_VALUES, "Unknown coaching type."))
    .min(1, "Choose at least one type of coaching you offer.")
    .max(COACHING_TYPE_VALUES.length),
  focus: enumOf(FOCUS_VALUES, "Choose your coaching focus."),
  monthly_price_band: enumOf(BUDGET_BAND_VALUES, "Unknown price option.").optional(),
  accepting_clients: z.boolean().optional(),
  interests: z
    .array(enumOf(COACH_INTEREST_VALUES, "Unknown option."))
    .min(1, "Choose at least one thing you're interested in."),
  demo_coach_id: optionalText(64),
  consent_contact: z.literal(true, {
    message: "We need your permission before we can contact you.",
  }),
});
export type CoachClaimInput = z.infer<typeof coachClaimSchema>;

export const coachRequestSchema = envelopeSchema
  .extend({
    coach_name: shortText(160, "The coach's name"),
    team_name: optionalText(160),
    instagram: handleField,
    tiktok: handleField,
    website: optionalText(300),
    reason: optionalText(1200),
    email: emailSchema.optional().or(z.literal("").transform(() => undefined)),
    notify: z.boolean().optional(),
    source_query: optionalText(160),
  })
  .refine((data) => !data.notify || Boolean(data.email), {
    message: "Add your email if you'd like to be notified.",
    path: ["email"],
  });
export type CoachRequestInput = z.infer<typeof coachRequestSchema>;

export const contactSchema = envelopeSchema.extend({
  email: emailSchema,
  topic: z.enum(["general", "data-deletion", "data-access", "coach", "press", "correction"], {
    message: "Choose a topic.",
  }),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a little more.")
    .max(4000, "Please keep this under 4000 characters."),
});
export type ContactInput = z.infer<typeof contactSchema>;

/** Directory search, recorded server-side so unmatched demand is never lost. */
export const searchEventSchema = z.object({
  query: z.string().trim().max(200),
  result_count: z.coerce.number().int().min(0).max(10_000),
  filters: z.record(z.string(), z.unknown()).optional(),
  page: optionalText(200),
  session_id: optionalText(64),
});
export type SearchEventInput = z.infer<typeof searchEventSchema>;

export const filtersQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  division: z.array(enumOf(DIVISION_VALUES, "Unknown division.")).optional(),
  type: z.array(enumOf(COACHING_TYPE_VALUES, "Unknown type.")).optional(),
  focus: z.array(enumOf(FOCUS_VALUES, "Unknown focus.")).optional(),
  federation: z.array(enumOf(FEDERATION_VALUES, "Unknown federation.")).optional(),
  delivery: z.array(enumOf(DELIVERY_VALUES, "Unknown delivery option.")).optional(),
  accepting: z.boolean().optional(),
});

/** Flattens a ZodError into `{ field: message }` for the form UI. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_form";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
