# Security Review

Implemented controls include server-side Zod validation, same-origin POST checks, honeypot and
minimum-completion traps, per-IP-hash rate limits, content screening, output-safe React rendering,
parameterized PostgreSQL queries, strict response headers, and HTTP Basic protection for all
`/admin` routes and exports.

Private records have no public read route. PostgreSQL migrations enable row-level security without
anonymous policies. Admin access fails closed when credentials are unset. Logs use pseudonyms and
exclude emails and review text.

Known production limitations:

- Rate limiting is process-local; use a shared Redis-compatible limiter before multi-instance scale.
- Basic authentication requires HTTPS and strong secret management.
- The CSP permits inline Next.js bootstrap scripts; adopt nonces if the rendering strategy changes.
- Automated moderation requires human and legal review before public review publication.
- Dependency, infrastructure, backup, and recovery reviews remain deployment responsibilities.
