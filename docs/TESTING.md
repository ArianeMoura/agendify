# Testing Strategy

How Agendify verifies correctness today, and what is deliberately deferred. Status markers:
**Implemented** (present and verifiable) / **Planned** (a deliberate next step).

## Philosophy — integration-first, by design

Agendify favors **high-fidelity integration tests against a real PostgreSQL** over a broad
base of mocked unit tests. The reason is specific to this system: the critical invariant
(`no_overlap`) exists **only in the database** (see [ADR-0002](adr/0002-db-enforced-invariant.md)).
A mocked test cannot observe it; a real Postgres can.

`TestDatabaseFixture` (an NUnit `[SetUpFixture]`) starts one ephemeral `postgres:16` via
**Testcontainers**, runs the real EF Core migrations (including the exclusion constraint), and
`TRUNCATE`s tables between tests. If `AGENDIFY_TEST_POSTGRES` is set, an external database is
used instead.

This inverts the classic "test pyramid" on purpose: risk is concentrated at the data layer,
so that is where the tests are concentrated. The admin panel adds component/accessibility tests
(Vitest + Testing Library + vitest-axe); a backend unit tier and E2E remain planned (see below).

## Test inventory — Implemented

All tests are NUnit integration tests in `src/api.Tests` against a real PostgreSQL.

| Suite | Tests | Focus |
| :--- | :---: | :--- |
| `BookingsServiceTests` | 10 | RN-01 overlap prevention, adjacency allowed, cross-space allowed, `Update` re-validation, availability & past-date rules, concurrency gate, user/space join, delete |
| `AuthServiceTests` | 5 | Login issues access+refresh, wrong password, refresh rotation invalidates old token, unknown token, logout revokes |
| `SpacesServiceTests` | 4 | `jsonb` round-trip of resources & hours, resource enrichment, create, delete |
| `PrivacyServiceTests` | 4 | LGPD: consent recorded, export + audit log, anonymize tombstone (keeps bookings), idempotent anonymize |
| **Total** | **23** | |

```bash
dotnet test src/api.Tests/api.Tests.csproj      # Docker required (Testcontainers)
```

## The concurrency gate — Implemented, release-blocking

`Create_Concurrent_SameSlot_ExactlyOnePersists` fires **100 concurrent** `Create` calls for
the identical slot and asserts that **exactly one** persists (each with its own
`AppDbContext`; the constraint, not app locking, does the arbitration). This test runs as a
dedicated step in CI before the full suite and **blocks the merge** if it fails — it is the
automated proof of RN-01.

## Coverage & static quality

| Control | Status |
| :--- | :--- |
| Code coverage (Coverlet), target ≥ 60% (RNF-008) | Implemented — via `src/api.Tests/generate-coverage-report.sh`; **not yet enforced in CI** |
| ESLint (admin: `next/core-web-vitals`+`typescript`; mobile: `eslint-config-expo`) | Implemented |
| Gitleaks secret scanning (CI + opt-in local hook) | Implemented |
| CodeQL SAST (C#, JS/TS) | Implemented |
| Unit-test tier distinct from integration | Planned (Moq is referenced but unused) |
| Frontend/component tests (Vitest + RTL + vitest-axe) | Implemented (admin); Planned (mobile) |
| E2E tests (Playwright/Cypress/Detox) | Planned (none today) |
| Prettier (admin: `format`/`format:check`); `.editorconfig`, .NET analyzers | Implemented (admin Prettier); Planned (rest) |
| Enforced Git hooks (Husky/lint-staged) | Planned (only an opt-in gitleaks hook exists) |

Coverage report (HTML, local):

```bash
bash src/api.Tests/generate-coverage-report.sh   # → TestResults/CoverageReport/index.html
```

## Related

- [Architecture](ARCHITECTURE.md) · [CI/CD](CICD.md) · [Roadmap](../ROADMAP.md)
