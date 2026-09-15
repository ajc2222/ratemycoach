# Analytics Event Dictionary

The server accepts only the 19 names in `src/lib/analytics/events.ts`. Properties are also
allow-listed and email-shaped values are discarded. Free-text coach searches are stored in the
private `search_events` dataset, never in general analytics.

| Funnel area           | Events                                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Landing and discovery | `landing_viewed`, `hero_search_started`, `coach_search_submitted`, `coach_search_zero_results`                    |
| Directory             | `filter_selected`, `category_selected`, `coach_profile_opened`                                                    |
| Feature intent        | `review_feature_clicked`, `ai_summary_clicked`, `compare_clicked`, `save_coach_clicked`                           |
| Waitlist              | `waitlist_started`, `waitlist_completed`                                                                          |
| Supply                | `review_form_started`, `review_form_completed`, `coach_claim_started`, `coach_claim_completed`, `coach_requested` |
| Outbound              | `outbound_social_clicked`                                                                                         |

Every stored event receives visitor/session identifiers, experiment variant, page, device class,
and first-touch UTM attribution where available. No third-party provider is required.
