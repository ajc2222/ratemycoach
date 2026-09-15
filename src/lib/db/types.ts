/**
 * Record shapes shared by both storage drivers. These mirror the SQL in
 * `supabase/migrations/` one-for-one; the SQL is the production source of
 * truth and these types are the application's view of it.
 *
 * Everything is snake_case to match the SQL columns, so a row read from
 * Postgres needs no mapping layer.
 */

export interface Attribution {
  variant: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  referrer: string | null;
  landing_page: string | null;
  device: string | null;
}

export const EMPTY_ATTRIBUTION: Attribution = {
  variant: null,
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_term: null,
  utm_content: null,
  referrer: null,
  landing_page: null,
  device: null,
};

export interface WaitlistEntry extends Attribution {
  id: string;
  created_at: string;
  updated_at: string;
  email: string;
  /** Stable pseudonym for the email, used in logs and for future account linking. */
  email_hash: string;
  role: string;
  primary_division: string | null;
  intent: string;
  consent_updates: boolean;
  consent_at: string | null;
  coach_searched: string | null;
  coach_searched_normalized: string | null;
  coach_handle: string | null;
  has_paid_for_coaching: boolean | null;
  budget_band: string | null;
  decision_factor: string | null;
  acquisition_source: string | null;
  trigger_page: string | null;
  trigger_coach_id: string | null;
  trigger_feature: string | null;
  form_source: string;
  visitor_id: string | null;
  submission_count: number;
}

export interface SearchEvent extends Attribution {
  id: string;
  created_at: string;
  raw_query: string;
  normalized_query: string;
  result_count: number;
  zero_results: boolean;
  filters: Record<string, unknown>;
  visitor_id: string | null;
  session_id: string | null;
  page: string | null;
}

export interface AnalyticsEvent {
  id: string;
  created_at: string;
  name: string;
  props: Record<string, unknown>;
  visitor_id: string | null;
  session_id: string | null;
  variant: string | null;
  page: string | null;
  device: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  referrer: string | null;
  landing_page: string | null;
  occurred_at: string | null;
}

export interface CoachRequest extends Attribution {
  id: string;
  created_at: string;
  coach_name: string;
  coach_name_normalized: string;
  team_name: string | null;
  instagram: string | null;
  tiktok: string | null;
  website: string | null;
  reason: string | null;
  email: string | null;
  email_hash: string | null;
  notify: boolean;
  source_query: string | null;
  visitor_id: string | null;
  form_source: string;
}

export interface PrivateReviewSubmission extends Attribution {
  id: string;
  created_at: string;
  /** Never published automatically. Requires moderation + verification. */
  status: "pending_moderation";
  coach_name: string;
  coach_name_normalized: string;
  coach_handle: string | null;
  demo_coach_id: string | null;
  relationship: string;
  coaching_started: string | null;
  coaching_ended: string | null;
  coaching_types: string[];
  division: string;
  focus: string;
  monthly_price_band: string | null;
  rating_overall: number;
  rating_communication: number;
  rating_personalization: number;
  rating_value: number;
  what_went_well: string;
  what_could_improve: string;
  would_hire_again: string;
  permission_contact: boolean;
  permission_publish: boolean;
  attestation: boolean;
  email: string;
  email_hash: string;
  visitor_id: string | null;
  /** Set when the content screen flagged something a moderator must read first. */
  screening_flags: string[];
}

export interface CoachClaimInterest extends Attribution {
  id: string;
  created_at: string;
  coach_name: string;
  coach_name_normalized: string;
  team_name: string | null;
  business_email: string;
  email_hash: string;
  instagram: string | null;
  tiktok: string | null;
  website: string | null;
  divisions: string[];
  coaching_types: string[];
  focus: string;
  monthly_price_band: string | null;
  accepting_clients: boolean | null;
  interests: string[];
  demo_coach_id: string | null;
  consent_contact: boolean;
  consent_at: string | null;
  visitor_id: string | null;
}

export interface ContactSubmission extends Attribution {
  id: string;
  created_at: string;
  email: string;
  email_hash: string;
  topic: string;
  message: string;
  visitor_id: string | null;
}

export interface ExperimentVariantRow {
  id: string;
  experiment: string;
  variant: string;
  label: string;
  headline: string;
  subhead: string;
  active: boolean;
  created_at: string;
}

export interface AdminUserRow {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
}

/** The complete set of tables the application reads and writes. */
export interface Tables {
  waitlist_entries: WaitlistEntry;
  search_events: SearchEvent;
  analytics_events: AnalyticsEvent;
  coach_requests: CoachRequest;
  private_review_submissions: PrivateReviewSubmission;
  coach_claim_interest: CoachClaimInterest;
  contact_submissions: ContactSubmission;
}

export type TableName = keyof Tables;

export const TABLE_NAMES: TableName[] = [
  "waitlist_entries",
  "search_events",
  "analytics_events",
  "coach_requests",
  "private_review_submissions",
  "coach_claim_interest",
  "contact_submissions",
];

export interface ListOptions {
  limit?: number;
  offset?: number;
  order?: "asc" | "desc";
}

export interface DemandRow {
  normalized_query: string;
  raw_example: string;
  searches: number;
  unique_visitors: number;
  zero_result_searches: number;
  requests: number;
}

export interface FunnelCounts {
  landing_viewed: number;
  hero_search_started: number;
  coach_search_submitted: number;
  coach_search_zero_results: number;
  coach_profile_opened: number;
  feature_intent_clicks: number;
  waitlist_started: number;
  waitlist_completed: number;
  review_form_started: number;
  review_form_completed: number;
  coach_claim_completed: number;
  coach_requested: number;
}

/**
 * The storage contract. Both the local JSON driver and the Postgres driver
 * implement exactly this, so route handlers never know which one they have.
 */
export interface Repository {
  readonly driver: "json" | "postgres";
  init(): Promise<void>;
  healthcheck(): Promise<{ ok: boolean; detail?: string }>;

  insert<T extends TableName>(
    table: T,
    row: Omit<Tables[T], "id" | "created_at"> & Partial<Pick<Tables[T], "id" | "created_at">>,
  ): Promise<Tables[T]>;

  insertMany<T extends TableName>(
    table: T,
    rows: (Omit<Tables[T], "id" | "created_at"> &
      Partial<Pick<Tables[T], "id" | "created_at">>)[],
  ): Promise<number>;

  /**
   * Waitlist upsert: a repeat signup must not create a second row, but the new
   * behavioural context (which coach, which feature, which channel) is worth
   * keeping, so non-empty new values are merged onto the existing record.
   */
  upsertWaitlist(
    row: Omit<WaitlistEntry, "id" | "created_at" | "updated_at" | "submission_count">,
  ): Promise<{ entry: WaitlistEntry; duplicate: boolean }>;

  list<T extends TableName>(table: T, options?: ListOptions): Promise<Tables[T][]>;
  count(table: TableName): Promise<number>;
  counts(): Promise<Record<TableName, number>>;
  coachDemand(limit?: number): Promise<DemandRow[]>;
  funnel(): Promise<FunnelCounts>;
  eventCountsByName(): Promise<Record<string, number>>;
  countsBy(table: TableName, column: string): Promise<{ value: string; count: number }[]>;
  deleteByEmailHash(emailHash: string): Promise<number>;
}
