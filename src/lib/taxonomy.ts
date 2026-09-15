/**
 * The vocabulary of the product. Everything the visitor can filter, select or
 * be categorised by is defined here once, and both the UI and the Zod schemas
 * derive from it — so a new division cannot be added to a dropdown without the
 * server also accepting it.
 */

export type Option<T extends string = string> = { value: T; label: string; short?: string };

export const DIVISIONS = [
  { value: "mens-bodybuilding", label: "Men's Bodybuilding", short: "Men's BB" },
  { value: "classic-physique", label: "Classic Physique", short: "Classic" },
  { value: "mens-physique", label: "Men's Physique", short: "Men's Physique" },
  { value: "womens-bodybuilding", label: "Women's Bodybuilding", short: "Women's BB" },
  { value: "womens-physique", label: "Women's Physique", short: "Women's Physique" },
  { value: "figure", label: "Figure", short: "Figure" },
  { value: "bikini", label: "Bikini", short: "Bikini" },
  { value: "wellness", label: "Wellness", short: "Wellness" },
  { value: "fitness", label: "Fitness", short: "Fitness" },
] as const satisfies readonly Option[];
export type Division = (typeof DIVISIONS)[number]["value"];
export const DIVISION_VALUES = DIVISIONS.map((d) => d.value) as Division[];

export const COACHING_TYPES = [
  { value: "contest-prep", label: "Contest prep" },
  { value: "improvement-season", label: "Improvement season / off-season" },
  { value: "lifestyle", label: "Lifestyle coaching" },
  { value: "posing", label: "Posing" },
  { value: "nutrition", label: "Nutrition" },
  { value: "training", label: "Training" },
  { value: "peak-week", label: "Peak-week support" },
  { value: "post-show", label: "Post-show support" },
] as const satisfies readonly Option[];
export type CoachingType = (typeof COACHING_TYPES)[number]["value"];
export const COACHING_TYPE_VALUES = COACHING_TYPES.map((c) => c.value) as CoachingType[];

/**
 * A description of what a coach works with — never a claim about any individual
 * athlete's drug use. This wording is load-bearing and is repeated in the UI.
 */
export const FOCUSES = [
  { value: "natural", label: "Natural" },
  { value: "enhanced", label: "Enhanced" },
  { value: "both", label: "Both" },
] as const satisfies readonly Option[];
export type Focus = (typeof FOCUSES)[number]["value"];
export const FOCUS_VALUES = FOCUSES.map((f) => f.value) as Focus[];

export const FEDERATIONS = [
  { value: "ifbb-pro", label: "IFBB Pro League" },
  { value: "npc", label: "NPC" },
  { value: "ocb", label: "OCB" },
  { value: "wnbf", label: "WNBF" },
  { value: "inbf", label: "INBF" },
  { value: "ukbff", label: "UKBFF" },
  { value: "cpa", label: "CPA" },
  { value: "other", label: "Other / regional" },
] as const satisfies readonly Option[];
export type Federation = (typeof FEDERATIONS)[number]["value"];
export const FEDERATION_VALUES = FEDERATIONS.map((f) => f.value) as Federation[];

/** Price bands in USD per month. `max: null` means "and above". */
export const PRICE_BANDS = [
  { value: "under-150", label: "Under $150/mo", min: 0, max: 149 },
  { value: "150-249", label: "$150–$249/mo", min: 150, max: 249 },
  { value: "250-399", label: "$250–$399/mo", min: 250, max: 399 },
  { value: "400-599", label: "$400–$599/mo", min: 400, max: 599 },
  { value: "600-plus", label: "$600+/mo", min: 600, max: null },
] as const;
export type PriceBand = (typeof PRICE_BANDS)[number]["value"];
export const PRICE_BAND_VALUES = PRICE_BANDS.map((p) => p.value) as PriceBand[];

export const DELIVERY = [
  { value: "remote", label: "Remote" },
  { value: "in-person", label: "In person" },
  { value: "hybrid", label: "Remote & in person" },
] as const satisfies readonly Option[];
export type Delivery = (typeof DELIVERY)[number]["value"];
export const DELIVERY_VALUES = DELIVERY.map((d) => d.value) as Delivery[];

export const ROLES = [
  { value: "athlete", label: "Athlete" },
  { value: "coach", label: "Coach" },
  { value: "both", label: "Both" },
  { value: "other", label: "Other" },
] as const satisfies readonly Option[];
export type Role = (typeof ROLES)[number]["value"];
export const ROLE_VALUES = ROLES.map((r) => r.value) as Role[];

export const INTENTS = [
  { value: "now", label: "Looking for a coach now" },
  { value: "three-months", label: "Looking within three months" },
  { value: "later", label: "Looking later" },
  { value: "not-looking", label: "Not currently looking" },
] as const satisfies readonly Option[];
export type Intent = (typeof INTENTS)[number]["value"];
export const INTENT_VALUES = INTENTS.map((i) => i.value) as Intent[];

export const DECISION_FACTORS = [
  { value: "client-results", label: "Client results" },
  { value: "communication", label: "Communication and responsiveness" },
  { value: "price", label: "Price" },
  { value: "division-experience", label: "Experience in my division" },
  { value: "personalisation", label: "How individualised the plan is" },
  { value: "health-safety", label: "Health and safety approach" },
  { value: "posing", label: "Posing ability" },
  { value: "reputation", label: "Reputation and word of mouth" },
] as const satisfies readonly Option[];
export type DecisionFactor = (typeof DECISION_FACTORS)[number]["value"];
export const DECISION_FACTOR_VALUES = DECISION_FACTORS.map((d) => d.value) as DecisionFactor[];

export const BUDGET_BANDS = [
  { value: "under-150", label: "Under $150/mo" },
  { value: "150-249", label: "$150–$249/mo" },
  { value: "250-399", label: "$250–$399/mo" },
  { value: "400-599", label: "$400–$599/mo" },
  { value: "600-plus", label: "$600+/mo" },
  { value: "unsure", label: "Not sure yet" },
] as const satisfies readonly Option[];
export type BudgetBand = (typeof BUDGET_BANDS)[number]["value"];
export const BUDGET_BAND_VALUES = BUDGET_BANDS.map((b) => b.value) as BudgetBand[];

export const ACQUISITION_SOURCES = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "reddit", label: "Reddit" },
  { value: "youtube", label: "YouTube" },
  { value: "forum", label: "A bodybuilding forum" },
  { value: "friend", label: "A friend or training partner" },
  { value: "search", label: "Search engine" },
  { value: "other", label: "Somewhere else" },
] as const satisfies readonly Option[];
export type AcquisitionSource = (typeof ACQUISITION_SOURCES)[number]["value"];
export const ACQUISITION_SOURCE_VALUES = ACQUISITION_SOURCES.map(
  (a) => a.value,
) as AcquisitionSource[];

/** Features that are deliberately not built yet, and the gate they trigger. */
export const GATED_FEATURES = [
  { value: "read-all-reviews", label: "Read all reviews" },
  { value: "verified-reviews", label: "View verified reviews" },
  { value: "ai-summary", label: "Open AI public-source summary" },
  { value: "compare", label: "Compare coaches" },
  { value: "save-coach", label: "Save coach" },
] as const satisfies readonly Option[];
export type GatedFeature = (typeof GATED_FEATURES)[number]["value"];
export const GATED_FEATURE_VALUES = GATED_FEATURES.map((f) => f.value) as GatedFeature[];

export const COACH_INTERESTS = [
  { value: "add-profile", label: "Add my profile" },
  { value: "claim-profile", label: "Claim an existing profile" },
  { value: "launch-updates", label: "Receive launch updates" },
  { value: "promoted-placement", label: "Learn about future promoted placement" },
] as const satisfies readonly Option[];
export type CoachInterest = (typeof COACH_INTERESTS)[number]["value"];
export const COACH_INTEREST_VALUES = COACH_INTERESTS.map((c) => c.value) as CoachInterest[];

export const CLIENT_RELATIONSHIPS = [
  { value: "current", label: "Current client" },
  { value: "former", label: "Former client" },
] as const satisfies readonly Option[];
export type ClientRelationship = (typeof CLIENT_RELATIONSHIPS)[number]["value"];
export const CLIENT_RELATIONSHIP_VALUES = CLIENT_RELATIONSHIPS.map(
  (c) => c.value,
) as ClientRelationship[];

export const WOULD_HIRE_AGAIN = [
  { value: "yes", label: "Yes" },
  { value: "maybe", label: "Maybe / with caveats" },
  { value: "no", label: "No" },
] as const satisfies readonly Option[];
export type WouldHireAgain = (typeof WOULD_HIRE_AGAIN)[number]["value"];
export const WOULD_HIRE_AGAIN_VALUES = WOULD_HIRE_AGAIN.map((w) => w.value) as WouldHireAgain[];

/** Utility: look a label up from any option list, falling back to the raw value. */
export function labelFor(options: readonly Option[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

export function labelsFor(options: readonly Option[], values: readonly string[]): string[] {
  return values.map((v) => labelFor(options, v));
}
