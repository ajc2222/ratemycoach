# PrepCoach Reviews

An honest prelaunch smoke test for an independent bodybuilding-coach research and review
platform. The site uses clearly fictional demonstration profiles, collects private validation
signals, and never presents reviews, ratings, or AI summaries as already available.

## Local development

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>. With no `DATABASE_URL`, submissions are stored locally as ignored
NDJSON files in `.data/`. Configure `ADMIN_USER` and `ADMIN_PASSWORD` to enable `/admin`.

## Quality checks

```bash
npm run verify
npx playwright install --with-deps chromium # once per machine
npm run test:e2e
npm run format:check
```

`npm run verify` runs route type generation, strict TypeScript, ESLint, unit tests, and a
production build. Browser tests use an isolated `.data-e2e/` directory and port 3100.

## PostgreSQL / Supabase

Set `DATABASE_URL`, then run:

```bash
npm run db:migrate
npm run db:seed
```

Migrations live in `supabase/migrations`. Reset commands require the explicit
`ALLOW_DB_RESET=true` safety flag. See [deployment](docs/deployment.md) and
[data model](docs/data-model.md) for details.

## Documentation

- [Requirements](docs/02-requirements.md)
- [Architecture](docs/04-architecture.md)
- [Analytics](docs/analytics-events.md)
- [Privacy](docs/privacy-notes.md)
- [Security](docs/security-review.md)
- [Launch checklist](docs/launch-checklist.md)
- [Test results](docs/test-results.md)
