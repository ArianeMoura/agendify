# CI/CD

Continuous integration and delivery for Agendify. Status markers: **Implemented** /
**Planned**.

## Continuous Integration — GitHub Actions (Implemented)

Four workflows under [`.github/workflows/`](../.github/workflows/):

| Workflow | Trigger | What it does |
| :--- | :--- | :--- |
| `security.yml` | push / PR to `main` | Gitleaks secret scan; .NET 9 build; **concurrency gate** (100-way double-booking test, release-blocking); full test suite |
| `admin.yml` | push / PR touching `src/admin/**` | `npm ci`, lint, typecheck, test (Vitest), build (Next.js) |
| `mobile.yml` | push / PR touching `src/mobile/**` | `expo lint` (full `tsc` typecheck deferred — legacy screens) |
| `codeql.yml` | push / PR + weekly cron | CodeQL static analysis (C#, JS/TS) |

The `security.yml` build-and-test job runs on `ubuntu-latest` (which provides Docker for
Testcontainers): it restores and builds in Release, runs the concurrency gate
(`--filter "Name~Concurrent"`) as a merge blocker, then the full suite. See
[TESTING.md](TESTING.md).

## Continuous Delivery (Implemented)

CD is handled by the platforms' native Git integration rather than a GitHub Actions deploy job —
a deliberate walking-skeleton choice that keeps the release path simple with fewer moving parts
while the product is small (see [ADR-0004](adr/0004-deploy-first-render-neon.md)):

- **API → Render** — auto-deploys on push to `main` (Docker build from `src/api/Dockerfile`,
  region Virginia).
- **Database → Neon** — managed PostgreSQL (`us-east-1`), co-located with the API.
- **Admin → Vercel** — Planned (panel is redesign-complete and deploy-ready).
- **Mobile → Expo EAS** — Planned (build & distribute).

See [DEPLOYMENT.md](DEPLOYMENT.md) and [ADR-0004](adr/0004-deploy-first-render-neon.md).

## Roadmap (Planned)

- Promote CD into a versioned pipeline (build → test gate → deploy) so releases are gated on
  the test suite.
- Enforce a **coverage threshold** in CI (currently coverage is a local script only).
- Add the deferred mobile typecheck once legacy screens are fixed.

## Related

- [Testing](TESTING.md) · [Deployment](DEPLOYMENT.md) · [Roadmap](../ROADMAP.md)
