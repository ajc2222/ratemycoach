create extension if not exists pgcrypto;

create table if not exists waitlist_entries (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), email text not null, email_hash text not null unique,
  role text not null, primary_division text, intent text not null, consent_updates boolean not null,
  consent_at timestamptz, coach_searched text, coach_searched_normalized text, coach_handle text,
  has_paid_for_coaching boolean, budget_band text, decision_factor text, acquisition_source text,
  trigger_page text, trigger_coach_id text, trigger_feature text, form_source text not null,
  visitor_id text, submission_count integer not null default 1,
  variant text, utm_source text, utm_medium text, utm_campaign text, utm_term text,
  utm_content text, referrer text, landing_page text, device text
);

create table if not exists search_events (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
  raw_query text not null, normalized_query text not null, result_count integer not null,
  zero_results boolean not null, filters jsonb not null default '{}'::jsonb, visitor_id text,
  session_id text, page text, variant text, utm_source text, utm_medium text, utm_campaign text,
  utm_term text, utm_content text, referrer text, landing_page text, device text
);

create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
  name text not null, props jsonb not null default '{}'::jsonb, visitor_id text, session_id text,
  variant text, page text, device text, utm_source text, utm_medium text, utm_campaign text,
  utm_term text, utm_content text, referrer text, landing_page text, occurred_at timestamptz
);

create table if not exists coach_requests (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
  coach_name text not null, coach_name_normalized text not null, team_name text, instagram text,
  tiktok text, website text, reason text, email text, email_hash text, notify boolean not null,
  source_query text, visitor_id text, form_source text not null, variant text, utm_source text,
  utm_medium text, utm_campaign text, utm_term text, utm_content text, referrer text,
  landing_page text, device text
);

create table if not exists private_review_submissions (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
  status text not null check (status = 'pending_moderation'), coach_name text not null,
  coach_name_normalized text not null, coach_handle text, demo_coach_id text, relationship text not null,
  coaching_started text, coaching_ended text, coaching_types text[] not null, division text not null,
  focus text not null, monthly_price_band text, rating_overall integer not null,
  rating_communication integer not null, rating_personalization integer not null,
  rating_value integer not null, what_went_well text not null, what_could_improve text not null,
  would_hire_again text not null, permission_contact boolean not null,
  permission_publish boolean not null, attestation boolean not null, email text not null,
  email_hash text not null, visitor_id text, screening_flags text[] not null default '{}',
  variant text, utm_source text, utm_medium text, utm_campaign text, utm_term text,
  utm_content text, referrer text, landing_page text, device text
);

create table if not exists coach_claim_interest (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
  coach_name text not null, coach_name_normalized text not null, team_name text,
  business_email text not null, email_hash text not null, instagram text, tiktok text, website text,
  divisions text[] not null, coaching_types text[] not null, focus text not null,
  monthly_price_band text, accepting_clients boolean, interests text[] not null, demo_coach_id text,
  consent_contact boolean not null, consent_at timestamptz, visitor_id text, variant text,
  utm_source text, utm_medium text, utm_campaign text, utm_term text, utm_content text,
  referrer text, landing_page text, device text
);

create table if not exists contact_submissions (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
  email text not null, email_hash text not null, topic text not null, message text not null,
  visitor_id text, variant text, utm_source text, utm_medium text, utm_campaign text,
  utm_term text, utm_content text, referrer text, landing_page text, device text
);

create table if not exists experiment_variants (
  id uuid primary key default gen_random_uuid(), experiment text not null, variant text not null,
  label text not null, headline text not null, subhead text not null, active boolean not null default true,
  created_at timestamptz not null default now(), unique (experiment, variant)
);

create index if not exists search_events_normalized_query_idx on search_events (normalized_query);
create index if not exists analytics_events_name_idx on analytics_events (name);
create index if not exists coach_requests_normalized_idx on coach_requests (coach_name_normalized);

alter table waitlist_entries enable row level security;
alter table search_events enable row level security;
alter table analytics_events enable row level security;
alter table coach_requests enable row level security;
alter table private_review_submissions enable row level security;
alter table coach_claim_interest enable row level security;
alter table contact_submissions enable row level security;
alter table experiment_variants enable row level security;
