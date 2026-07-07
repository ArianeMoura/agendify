# ADR-0004: Deploy-first on Render + Neon (free tier)

**Status:** Accepted.

## Context

Before a planned frontend redesign, the project needed a production environment to validate
environment/config concerns (secrets, connection strings, CORS, migrations on a fresh DB) and
to give the redesign a real API to build against. A prior `fly.toml` targeted Fly.io, but
Fly discontinued its free tier.

## Decision

Ship a thin end-to-end **walking skeleton** to production early, on free-tier services:

- **API → Render** — Docker build from `src/api/Dockerfile`, auto-deploy on push to `main`,
  region Virginia.
- **PostgreSQL → Neon** — managed serverless Postgres, `us-east-1`, co-located with the API.
- **Admin → Vercel** and **Mobile → Expo EAS** — after the redesign.

Secrets are provided as Render environment variables; migrations run on boot via
`ApplyMigrationsOnStartup=true`.

## Consequences

- Environment issues surfaced early, with few moving parts, and a known-good baseline exists
  before the redesign.
- API and DB are co-located (same region) so query latency stays low.
- Free-tier trade-off: the Render instance sleeps after ~15 min idle (cold start ~30–50 s).
  A paid/always-on tier is the scale-up path.
- Deployment is via the platforms' native Git integration, not a GitHub Actions deploy job
  (see [CICD.md](../CICD.md)).
