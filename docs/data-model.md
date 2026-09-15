# Data Model

The application persists seven operator datasets through a shared repository interface:

| Dataset                      | Purpose                                          | Sensitive fields             |
| ---------------------------- | ------------------------------------------------ | ---------------------------- |
| `waitlist_entries`           | Deduplicated launch interest and trigger context | Email                        |
| `search_events`              | Named-coach demand and zero-result searches      | Raw search query             |
| `analytics_events`           | Allow-listed behavioral events                   | Anonymous IDs only           |
| `coach_requests`             | Requests to research an unlisted coach           | Optional email and free text |
| `private_review_submissions` | Unpublished firsthand reviews                    | Email and review text        |
| `coach_claim_interest`       | Listing/claim interest                           | Business email               |
| `contact_submissions`        | Contact and privacy requests                     | Email and message            |

`experiment_variants` is configuration seeded for operational reference, not an admin-export
dataset. Local development uses ignored NDJSON files. Production uses PostgreSQL tables created by
`supabase/migrations/001_initial.sql`, with row-level security enabled and no anonymous policies.

Email hashes support deduplication and human-operated privacy deletion. Raw IP addresses are never
stored.
