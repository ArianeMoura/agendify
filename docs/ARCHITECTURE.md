# Architecture

Technical reference for the Agendify backend. For decision rationale, see the
[ADRs](adr/); for the entry point, see the [root README](../README.md).

## 1. System context

One backend is the single source of truth; web and mobile clients consume the same REST API.

```mermaid
flowchart TD
    A["Admin — Next.js (Vercel, planned)"] -->|HTTPS / JSON| API
    M["Mobile — Expo / React Native"] -->|HTTPS / JSON| API
    subgraph API["Agendify API — ASP.NET Core / .NET 9 (Render)"]
      direction TB
      C[Controllers] --> SV[Services]
      SV --> EF["EF Core + Npgsql (AppDbContext)"]
    end
    EF -->|SQL over TLS| PG[("PostgreSQL 16 — Neon")]
    AUTH["JWT Bearer + BCrypt"] -. authorizes .-> C
```

## 2. Layered design

The API uses a pragmatic layered architecture with clear seams. Controllers are thin;
business rules live in services; persistence is isolated in the `AppDbContext`.

| Layer | Responsibility | Representative types |
| :--- | :--- | :--- |
| Controllers | HTTP surface: routing, `[Authorize]`, status codes | `BookingsController`, `SpacesController`, `AuthController` (`/api/*`) |
| Services (scoped) | Business rules and orchestration | `BookingsService`, `AuthService`, `OrganizationsService`, `InvitationsService`, `PrivacyService`, `IdempotencyService`, `SpacesService`, `ReviewsService`, `AnalyticsService`, `UsersService`, `ResourcesService`, `FileUploadService`, `IEmailSender` (`ResendEmailSender` / `LoggingEmailSender`) |
| Tenancy | Multi-tenant isolation: resolves the tenant from JWT claims and scopes every query/write to it | `TenantResolutionMiddleware`, `ITenantContext`, `TenantConnectionInterceptor` (`Tenancy/`) |
| Data | EF Core persistence; entities map to `snake_case` tables | `AppDbContext`, `Migrations/` |
| Cross-cutting | Config binding, JWT validation, CORS, domain exceptions | `DatabaseSettings`, `JwtSettings`, `EmailSettings`, `BookingConflictException` |

Supporting patterns: **DTOs** for request shaping (e.g. `SpaceFormRequest` for multipart
uploads), **custom domain exceptions** translated to HTTP status at the controller boundary,
and **dependency injection** throughout (`Program.cs`).

## 3. Request pipeline

Middleware order in `src/api/Program.cs` (execution order):

1. Migrations on startup — `Database.Migrate()` when `IsDevelopment()` or `ApplyMigrationsOnStartup=true`.
2. `GET /status` — liveness timestamp.
3. Swagger UI — **Development only**.
4. `UseHttpsRedirection`.
5. `UseCors("AllowWebApp")` — dev origins plus `CORS_ALLOWED_ORIGINS` (comma-separated).
6. Static files for `/uploads`.
7. `UseAuthentication` → `TenantResolutionMiddleware` → `UseAuthorization`.
8. `MapControllers`.

Authentication is JWT Bearer (validates issuer, audience, lifetime, signing key).
Authorization uses roles (`PlatformOwner`, `OrgAdmin`, `Member`) with hierarchical policies —
`OrgAdmin` also satisfies `Member`, and `PlatformOwner` satisfies everything.

**Multi-tenancy.** Every request runs inside one organization (tenant): the middleware reads
the `tenant_id` claim from the JWT into a scoped `ITenantContext`; EF global query filters
scope reads, writes are auto-stamped with the tenant, and Postgres **Row-Level Security**
enforces the same isolation at the database (the `TenantConnectionInterceptor` sets the
tenant per connection), so a bug in the app layer cannot leak another tenant's rows.
Anonymous requests carry no tenant and match nothing. Public self-signup
(`POST /api/organizations`) creates the organization plus its first `OrgAdmin`; members join
by invitation (`/api/invitations`) via an e-mailed accept link.

## 4. Core write path — a booking under contention

`POST /api/bookings` shows the core write path: the invariant is enforced by the database and
surfaced as an HTTP status.

```mermaid
sequenceDiagram
    participant U as Client
    participant C as BookingsController
    participant S as BookingsService
    participant DB as PostgreSQL
    U->>C: POST /api/bookings (Bearer JWT)
    Note over C: [Authorize] validates JWT; userId from token claims
    C->>S: Create(booking)
    S->>S: ValidateSpaceRulesAsync (friendly checks)
    S->>DB: INSERT booking (SaveChanges)
    alt slot is free
        DB-->>S: OK
        S-->>C: created
        C-->>U: 201 Created
    else overlap with a confirmed booking
        DB-->>S: 23P01 exclusion_violation
        S-->>C: throw BookingConflictException
        C-->>U: 409 Conflict
    end
```

**Idempotency.** `POST /api/bookings` honors an `Idempotency-Key` header: a replay with the
same key returns the original response instead of creating a duplicate (backed by the
`idempotency_keys` table).

## 5. Data model

PostgreSQL 16 via EF Core migrations (six today, from `InitialCreate` to
`EnableRowLevelSecurity`). Relationships are modeled through string foreign-key columns (no
navigation properties). Tenant-scoped tables carry a `tenant_id` column (FK to
`organizations`) protected by RLS policies.

| Table | Purpose |
| :--- | :--- |
| `organizations` | Tenants; each row is one customer organization (with a URL `slug`) |
| `users` | Accounts; unique email; `role`; `anonymized_at` for LGPD tombstoning |
| `invitations` | Pending invites: hashed token, invited e-mail, expiry, accepted-at |
| `spaces` | Bookable spaces; `available_hours` as `text[]`; embedded `resources` as `jsonb` |
| `resources` | Space amenities (projector, A/C, …) |
| `bookings` | Links user + space + time range; carries the anti-overlap constraint |
| `refresh_tokens` | Hashed long-lived tokens for JWT renewal |
| `idempotency_keys` | Composite PK `(key, user_id)` — dedupes retried writes |
| `consents`, `audit_logs` | LGPD: consent ledger and audit trail |
| `reviews` | Space ratings |

**Why string FK columns and no navigation properties.** The schema deliberately keeps plain
`text` foreign-key columns (`user_id`, `space_id`) without EF Core navigation properties or
database-level FK constraints. This is a pragmatic carry-over from the document-store origin: it
minimized the migration surface, keeps writes simple (no cascade semantics to reason about), and
makes the service layer's joins explicit — `BookingsService` composes `BookingWithUserAndSpace`
by loading the related rows itself. The trade-off is that referential integrity is not
engine-enforced (an orphaned `user_id` is possible), which the services must respect; adding FK
constraints is a low-risk future hardening step.

## 6. The concurrency invariant (RN-01)

The product's critical rule — no two confirmed bookings overlap in the same space — lives in
the database as an atomic exclusion constraint, not in application code. See
[ADR-0002](adr/0002-db-enforced-invariant.md).

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings
  ADD COLUMN during tstzrange
  GENERATED ALWAYS AS (tstzrange(start_date_time, end_date_time, '[)')) STORED;

ALTER TABLE bookings
  ADD CONSTRAINT no_overlap
  EXCLUDE USING gist (space_id WITH =, during WITH &&)
  WHERE (status = 'confirmed');
```

- `'[)'` is a **half-open** interval: back-to-back bookings do not collide.
- `WHERE (status = 'confirmed')` means only confirmed bookings arbitrate a slot.
- A violation raises SQLSTATE **`23P01`**, caught in `BookingsService` and re-thrown as
  `BookingConflictException` → HTTP 409. This is atomic and immune to the check-then-insert
  **TOCTOU** race, verified by a 100-way concurrency test (see [TESTING.md](TESTING.md)).

### Edge cases

Beyond the basic race, two higher-order scenarios shape the design:

- **Concurrent cancel + waitlist release (planned, RF-017).** If a cancellation frees a slot at
  the instant another user and an automatic waitlist offer both try to claim it, the same
  `no_overlap` constraint arbitrates: whoever inserts the confirmed booking first wins; the others
  get 409 and fall through to the next in line. The cancellation and its `SlotReleased` event
  should be written in one transaction (outbox, §9) so no slot is silently lost or double-granted.
- **Partial failure / dual-write and DST.** A booking may commit while a downstream notification
  or payment fails, or a reservation may cross a daylight-saving transition. Timestamps are stored
  in **UTC** (the code forces `DateTimeKind.Utc`), so the stored range is unambiguous; a slot key
  is computed in the space's timezone to avoid double-counting across DST. Reliable notification
  without phantom or duplicate bookings is a job for the outbox pattern plus idempotency (§9).

## 7. Configuration & secrets

Config resolves `appsettings.json` → `appsettings.{Environment}.json` → **User Secrets**
(dev) → **environment variables** (prod). Two fail-fast guards in `Program.cs` abort boot if
the DB connection string is empty or `JwtSettings:Secret` is shorter than 32 characters.
Settings classes: `DatabaseSettings`, `JwtSettings`.

## 8. Error handling & observability (current state)

See the [Roadmap](../ROADMAP.md) for planned hardening.

- **Error handling:** per-controller `try/catch` (no global exception middleware yet).
  `BookingsController` maps `BookingConflictException` → 409 and `InvalidOperationException`
  → 400.
- **Logging:** default `Microsoft.Extensions.Logging` only (no structured logging).
- **Health:** a single `GET /status` timestamp (no DB probe).

Planned: RFC 7807 `ProblemDetails` via a global `IExceptionHandler`, structured logging with
correlation IDs, real health checks with a Npgsql probe, and OpenTelemetry.

## 9. Communication & real-time (design rationale)

Only REST is implemented today; the rest are forward-looking design notes.

- **REST/HTTPS + JSON (implemented).** The domain is resource-oriented (`bookings`, `spaces`,
  `users`); request/response semantics fit, tooling is mature, and responses are cacheable. Writes
  accept an `Idempotency-Key` (implemented); errors return `409` for booking conflicts. API
  versioning under `/api/v1` and publishing the OpenAPI as an artifact are planned (RNF-018).
- **SignalR for real-time (planned, RF-008/RF-020).** Availability is inherently multi-user and
  must propagate live; polling wastes bandwidth and goes stale. SignalR is the native .NET
  bidirectional transport with automatic fallback (WebSocket → SSE → long-polling) and a React
  Native client. Servers would publish `SlotReserved`/`SlotReleased` to per-space groups; clients
  update their React Query cache and degrade gracefully to light polling on socket loss (RNF-020).
- **gRPC — internal only (future).** Justified for service-to-service calls (e.g. a future
  notifications microservice) via protobuf/HTTP-2 — not for the mobile edge, where gRPC-web/React
  Native support is weaker and booking payloads are small.
- **GraphQL — out of scope.** Client queries are not heterogeneous enough to justify the added
  complexity; REST plus a few aggregation endpoints suffices.
- **Outbox pattern (planned).** Writing a domain event to an `outbox` table inside the same
  transaction as the booking, then publishing it at-least-once from a background worker, removes
  the dual-write inconsistency between persisting a booking and notifying/releasing a slot. For
  the current solo MVP, direct send with retry is adequate; the outbox arrives with payments or
  external integrations.

## 10. Quality attributes

What the architecture actually guarantees today (the non-functional requirements are
catalogued in [02-Especificação](02-Especificação%20do%20Projeto.md)):

- **Correctness under concurrency** — the no-overlap invariant is enforced atomically in the
  database (§6) and proven by a 100-way concurrency test in CI.
- **Security & isolation** — JWT + BCrypt, tenant isolation enforced twice (EF filters and
  Postgres RLS), LGPD export/erasure endpoints. See [SECURITY.md](../SECURITY.md).
- **Testability** — integration-first suite against a real Postgres ([TESTING.md](TESTING.md)).
- **Accessibility** — WCAG 2.2 AA on the admin panel (checked with vitest-axe); accessible
  roles/labels and touch targets on the mobile app.
- **Maintainability** — thin controllers, business rules in services, persistence isolated in
  `AppDbContext`; decisions recorded as [ADRs](adr/).

## Related

- [ADRs](adr/) — decision records
- [Testing](TESTING.md) · [CI/CD](CICD.md) · [Deployment](DEPLOYMENT.md)
