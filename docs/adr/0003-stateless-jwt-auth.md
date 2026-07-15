# ADR-0003: Stateless authentication with JWT + refresh tokens

**Status:** Accepted. The decision stands; the role names below were later superseded — see the
update note at the end.

## Context

The API serves multiple clients (web admin, mobile). Server-side sessions would require
shared session storage and sticky routing, complicating horizontal scaling.

## Decision

Use **stateless JWT Bearer** authentication. On login, the API issues a short-lived signed
access token (identity in claims) plus a long-lived **refresh token** stored **hashed** in
`refresh_tokens`. Clients send `Authorization: Bearer <access>`; the API validates the
signature (with `JwtSettings:Secret`) without a database round-trip. Passwords are stored as
**BCrypt** hashes, never in plaintext. Authorization uses roles (`Administrator`, `Common`)
and an `AdminOnly` policy.

## Consequences

- No session store; the API scales horizontally without affinity.
- Refresh rotation balances UX (stay logged in) with security (short access-token lifetime,
  revocable refresh tokens).
- Trade-off: immediate revocation of an access token is harder — mitigated by short lifetimes.
- `JwtSettings:Secret` must be ≥ 32 chars; the API fails fast at boot otherwise.

## Update — multi-tenancy (roles renamed)

The two roles above no longer exist. Making the product multi-tenant replaced them with three —
`PlatformOwner`, `OrgAdmin` (the former `Administrator`) and `Member` (the former `Common`) — served
by hierarchical policies of the same names; there is no `AdminOnly` policy. The access token also
carries a `tenant_id` claim, which the API resolves into the request's tenant. The stateless
decision itself is unchanged. See [Architecture §3](../ARCHITECTURE.md) and [SECURITY.md](../../SECURITY.md).
