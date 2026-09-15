# Launch Checklist

- [ ] `npm ci` succeeds on a clean checkout.
- [ ] `npm run verify`, `npm run format:check`, and `npm run test:e2e` pass.
- [ ] PostgreSQL migrations and seed run in staging; `/api/health` reports `postgres`.
- [ ] Admin credentials, stable salts, canonical URL, HTTPS, and backups are configured.
- [ ] `/admin` and every CSV export reject unauthenticated access.
- [ ] Test submissions can be exported and deleted by email hash.
- [ ] Demo labels, noindex rules, legal pages, and footer disclosures are reviewed manually.
- [ ] Mobile layouts, keyboard flows, dialogs, validation errors, and consent defaults are checked.
- [ ] Analytics receives all 19 events without personal data.
- [ ] Legal/operator owners accept unresolved publication and moderation risks.
