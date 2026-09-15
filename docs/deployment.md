# Deployment

## Required production configuration

- Node.js 20.9 or newer
- `DATABASE_URL` pointing to migrated PostgreSQL/Supabase
- `DATABASE_SSL=require` for a remote database when auto-detection is unsuitable
- Long, unique `ADMIN_USER` and `ADMIN_PASSWORD` values
- Stable `EXPERIMENT_SALT` and `IP_HASH_SALT` values
- Canonical `NEXT_PUBLIC_SITE_URL`

Run `npm ci`, `npm run db:migrate`, `npm run db:seed`, and `npm run verify` before release. Deploy
the resulting Next.js Node application, then verify `/api/health` reports PostgreSQL and admin
configuration as healthy.

Do not deploy the JSON driver to an ephemeral or multi-instance host: its files are local to one
process and are not durable shared storage. PostgreSQL is the production path.

Rollback application code independently. Migrations are additive and forward-only; take a database
backup before schema changes. Keep credentials and salts in the hosting provider's secret manager.
