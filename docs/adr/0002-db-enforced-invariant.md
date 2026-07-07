# ADR-0002: Enforce the no-overlap invariant in the database

**Status:** Accepted.

## Context

The rule "no two confirmed bookings overlap in the same space" (RN-01) must hold under
concurrency. An application-level "check if the slot is free, then insert" has a
**time-of-check-to-time-of-use (TOCTOU)** race: two requests can both pass the check before
either writes, producing a double-booking.

## Decision

Enforce the invariant in PostgreSQL as an atomic exclusion constraint:

```sql
ALTER TABLE bookings
  ADD CONSTRAINT no_overlap
  EXCLUDE USING gist (space_id WITH =, during WITH &&)
  WHERE (status = 'confirmed');
```

`during` is a generated `tstzrange` with half-open bounds `[)`. On violation, Postgres raises
SQLSTATE `23P01`; `BookingsService` catches it and throws `BookingConflictException`, which
the controller maps to HTTP 409. Application-level checks remain only to produce friendly
messages — they are not the guarantee.

## Consequences

- Double-booking is impossible regardless of the number of concurrent requests or API
  replicas — correctness does not depend on a single process (supports horizontal scaling).
- Verified by a release-blocking 100-way concurrency test (see [TESTING.md](../TESTING.md)).
- Half-open intervals allow back-to-back bookings (11:00 end / 11:00 start do not collide).
- Only `confirmed` bookings arbitrate a slot; pending/cancelled do not.
