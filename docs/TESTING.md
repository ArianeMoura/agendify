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
(Vitest + Testing Library + vitest-axe) and the mobile app adds screen and component tests with
jest-expo + Testing Library; E2E remains planned (see below).

## Test inventory — Implemented

NUnit tests in `src/api.Tests` — integration tests against a real PostgreSQL, except the
e-mail sender and file-upload unit tests.

**Service tests** (`Services/`) call the services directly:

| Suite | Tests | Focus |
| :--- | :---: | :--- |
| `BookingsServiceTests` | 10 | RN-01 overlap prevention, adjacency allowed, cross-space allowed, `Update` re-validation, availability & past-date rules, concurrency gate, user/space join, delete |
| `PasswordResetServiceTests` | 10 | RF-003: hash-only persistence, explicit tenant on the anonymous flow, unknown e-mail sends nothing, single use, expiry, a new request invalidates the previous link, reset revokes live sessions |
| `FileUploadServiceTests` | 8 | Format detected from magic bytes (not the filename), non-image bytes rejected, 5 MB cap, old image only deleted after the new one is written |
| `OnboardingTests` | 7 | Self-signup creates org + OrgAdmin, duplicate e-mail rejected, invite → accept creates Member in the inviting tenant, unknown/reused token rejected, invite e-mail carries the accept link |
| `AuthServiceTests` | 5 | Login issues access+refresh, wrong password, refresh rotation invalidates old token, unknown token, logout revokes |
| `ImageStorageTests` | 5 | S3-compatible storage against a real **MinIO** (Testcontainers): upload, public URL, content-type, distinct keys, delete, best-effort on missing objects |
| `SpacesServiceTests` | 4 | `jsonb` round-trip of resources & hours, resource enrichment, create, delete |
| `PrivacyServiceTests` | 4 | LGPD: consent recorded, export + audit log, anonymize tombstone (keeps bookings), idempotent anonymize |
| `TenantIsolationTests` | 4 | Reads scoped to the current tenant (even by id), writes auto-stamped with `tenant_id`, PlatformOwner sees all tenants |
| `RowLevelSecurityTests` | 3 | Postgres RLS hides/blocks cross-tenant rows even if the EF filter is bypassed; PlatformOwner bypass |
| `ResendEmailSenderTests` | 1 | Unit (no network): captures the HTTP request and asserts Resend URL, auth header and recipient/link |

**Endpoint tests** (`Endpoints/`) drive the real HTTP pipeline via `WebApplicationFactory` —
model binding, JWT auth and the tenant middleware included. This layer had no coverage until
a `400 TenantId` bug reached production through it: the service tests never crossed model
binding, so nothing caught it. Each suite sends the exact payloads the real clients send.

| Suite | Tests | Focus |
| :--- | :---: | :--- |
| `UsersEndpointTests` | 13 | Role policies, ownership checked by hand inside the actions, a Member cannot change someone else's password nor self-escalate to OrgAdmin, hashes never leak in responses |
| `SpacesEndpointTests` | 12 | Multipart + manual `Deserialize<Space>`, `tenantId` injected in `spaceData` is ignored, magic-byte rejection over HTTP, tenant isolation, malformed JSON → 400 |
| `PrivacyAndReviewsEndpointTests` | 12 | LGPD export/anonymize keyed off the claim (never a request id), review author from the claim, analytics restricted to OrgAdmin |
| `BookingsEndpointTests` | 13 | The 4 endpoints that returned `400 TenantId`, both client casings, idempotent replay, 409 on conflict, ownership on `PUT` |
| `ResourcesEndpointTests` | 6 | Create/update without a client-sent `tenantId`, tenant stamping, role policy |
| `InvitationsEndpointTests` | 8 | Invite restricted to OrgAdmin, anonymous accept stays anonymous, hash-only token, single use |
| `AuthEndpointTests` | 6 | `forgot-password` answers identically for known and unknown e-mails, validation, reset with an invalid token |
| `OrganizationsEndpointTests` | 6 | Anonymous self-signup creates tenant + first OrgAdmin, duplicate e-mail, weak password, login right after |
| `SmokeEndpointTests` | 1 | The app boots under the factory (no secret fail-fast, no startup migration with the restricted role) |
| **Total** | **137** | |

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
| Code coverage (Coverlet), target ≥ 60% (RNF-008) | Enforced in CI — the full-suite step fails the build when **line** coverage drops below 60% (currently ~94%). Branch coverage (~59%) is not gated; see [Roadmap](../ROADMAP.md) |
| ESLint (admin: `next/core-web-vitals`+`typescript`; mobile: `eslint-config-expo`) | Implemented |
| Gitleaks secret scanning (CI + opt-in local hook) | Implemented |
| CodeQL SAST (C#, JS/TS) | Implemented |
| Unit-test tier distinct from integration | Started (`ResendEmailSenderTests`, `FileUploadServiceTests`); the data layer stays integration-first by design |
| Endpoint tests (`WebApplicationFactory`) | Implemented — all 10 controllers, exercising model binding, JWT auth and role policies |
| Frontend/component tests | Implemented — admin (Vitest + RTL + vitest-axe, 2 files); mobile (jest-expo + Testing Library, 17 files / 47 cases: screens in `__tests__/`, components next to each component) |
| E2E tests (Playwright/Cypress/Detox) | Planned (none today) |
| Prettier (`format`/`format:check`); `.editorconfig`, .NET analyzers | Implemented (admin & mobile Prettier); Planned (rest) |
| Enforced Git hooks (Husky/lint-staged) | Planned (only an opt-in gitleaks hook exists) |

Coverage report (HTML, local):

```bash
bash src/api.Tests/generate-coverage-report.sh   # → TestResults/CoverageReport/index.html
```

## Related

- [Architecture](ARCHITECTURE.md) · [CI/CD](CICD.md) · [Roadmap](../ROADMAP.md)
