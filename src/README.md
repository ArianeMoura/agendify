# Developer Guide (`src/`)

Per-application setup for the Agendify monorepo. For the system overview and the fastest
path to a running backend, see the [root README](../README.md); for design rationale, see
[docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md).

```
src/
├─ api/        ASP.NET Core (.NET 9) Web API — source of truth
├─ api.Tests/  NUnit integration tests (Testcontainers + PostgreSQL)
├─ admin/      Next.js / React admin panel
└─ mobile/     Expo / React Native app
```

## API (`src/api`)

**Prerequisites:** .NET 9 SDK, and a PostgreSQL 16 instance (locally via
[`docker/docker-compose.yml`](../docker/docker-compose.yml)).

### 1. Start PostgreSQL

```bash
echo "POSTGRES_PASSWORD=change-me-locally" > docker/.env
docker compose -f docker/docker-compose.yml up -d
```

### 2. Configure secrets (required)

No secret is versioned. The database connection string and JWT secret come from **User
Secrets** (development) or **environment variables** (production). The API fails fast at
boot with a clear message if either is missing (`JwtSettings:Secret` must be ≥ 32 chars).

```bash
cd src/api
dotnet user-secrets set "DatabaseSettings:ConnectionString" \
  "Host=localhost;Port=5432;Database=agendify;Username=agendify;Password=change-me-locally"
dotnet user-secrets set "JwtSettings:Secret" "$(openssl rand -base64 48)"
```

Secrets are stored outside the repo (macOS/Linux: `~/.microsoft/usersecrets/`; Windows:
`%APPDATA%\Microsoft\UserSecrets\`). In production, set `DatabaseSettings__ConnectionString`
and `JwtSettings__Secret` as environment variables (`:` becomes `__`). See
[`.env.example`](../.env.example) for the full list.

> Managed Postgres providers (Neon, RDS, Azure) return a `postgresql://…` **URI**. Npgsql
> does not parse URIs — convert to key=value form:
> `Host=…;Database=…;Username=…;Password=…;SSL Mode=Require;Trust Server Certificate=true`.

### 3. Run

```bash
cd src/api
dotnet run    # http://localhost:5089  (health: /status, docs: /swagger in Development)
```

In `Development`, EF Core migrations apply automatically on boot — creating the schema, the
`btree_gist` extension, and the `no_overlap` exclusion constraint.

### 4. Integration tests

The suite runs against a real PostgreSQL. If `AGENDIFY_TEST_POSTGRES` is unset, it spins up
an ephemeral `postgres:16` container via Testcontainers (Docker required). See
[docs/TESTING.md](../docs/TESTING.md).

```bash
dotnet test src/api.Tests/api.Tests.csproj
```

### 5. Secret-leak protection

An opt-in pre-commit hook runs [gitleaks](https://github.com/gitleaks/gitleaks)
(`brew install gitleaks`). Enable it once:

```bash
git config core.hooksPath .githooks
```

CI also runs gitleaks on every push/PR ([`.github/workflows/security.yml`](../.github/workflows/security.yml)).

## Admin (`src/admin`) — Next.js

**Prerequisites:** Node.js 20+.

```bash
cd src/admin
npm ci
npm run dev     # http://localhost:3000
```

Reads the API base URL from `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:5089`).
Scripts: `dev`, `build`, `start`, `lint`.

## Mobile (`src/mobile`) — Expo / React Native

**Prerequisites:** Node.js 20+, and an Android emulator, iOS simulator (Xcode), or the
**Expo Go** app.

```bash
cd src/mobile
npm ci
npx expo start   # press a (Android), i (iOS), or scan the QR with Expo Go
```

Reads the API base URL from `EXPO_PUBLIC_API_URL` (defaults to `http://localhost:5089`);
build profiles are in [`eas.json`](mobile/eas.json).

## Hosting

The API is deployed on **Render** and the database on **Neon** (both free tier). See
[docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md). Demo credentials are created via a local seed on
request and are never versioned — see [SECURITY.md](../SECURITY.md).
