# ADR-0001: PostgreSQL over MongoDB

**Status:** Accepted · Supersedes the original MongoDB persistence.

## Context

Agendify began on MongoDB. Its critical invariant — no two confirmed reservations may
overlap in the same space — is fundamentally a constraint over *ranges* of time per space.
A document store has no native, atomic way to reject overlapping ranges; enforcing it would
require application-level locking or transactions across a replica set, which are fragile
and easy to get subtly wrong under concurrency.

## Decision

Migrate persistence to **PostgreSQL 16**, accessed via **EF Core + Npgsql**. Use Postgres's
range types (`tstzrange`) and the `btree_gist` extension to express the invariant as a
native exclusion constraint (see [ADR-0002](0002-db-enforced-invariant.md)).

## Consequences

- The core business rule becomes correct by construction, enforced atomically by the engine.
- Gain relational integrity: typed columns, unique constraints (e.g. email), migrations.
- Cost: a data-layer migration and schema modeling (`snake_case` tables, `jsonb` for embedded
  resources, `text[]` for available hours).
- Managed hosting must support `btree_gist` (Neon, RDS, Azure all do) — a hard requirement
  validated before any deploy.
