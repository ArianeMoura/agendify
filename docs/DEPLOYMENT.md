# Deployment

Production topology and the steps to deploy Agendify. Rationale:
[ADR-0004](adr/0004-deploy-first-render-neon.md).

## Topology

| Component | Host | Notes |
| :--- | :--- | :--- |
| API (.NET 9) | **Render** (Docker) | Auto-deploys on push to `main`; region Virginia |
| PostgreSQL 16 | **Neon** (serverless) | Region `us-east-1`; co-located with the API |
| Admin (Next.js) | **Vercel** | Planned (panel is redesign-complete and deploy-ready) |
| Mobile (Expo) | **Expo EAS** | Planned (build & distribute, not hosted) |

API and database are kept in the same US-East region so query latency stays low.

## PostgreSQL (Neon)

1. Create a Neon project, PostgreSQL 16, region **US East (N. Virginia)**.
2. Confirm the required extension in the Neon SQL Editor (hard requirement — the
   `no_overlap` constraint depends on it):
   ```sql
   CREATE EXTENSION IF NOT EXISTS btree_gist;
   ```
3. Copy the **direct** connection string (not the `-pooler` one). Neon returns a
   `postgresql://…` URI; Npgsql needs key=value form:
   ```
   Host=<ep-…>.us-east-1.aws.neon.tech;Database=neondb;Username=neondb_owner;Password=<secret>;SSL Mode=Require;Trust Server Certificate=true
   ```

## API (Render)

Create a **Web Service** from the GitHub repo with:

| Setting | Value |
| :--- | :--- |
| Runtime | Docker |
| Branch | `main` |
| Docker Build Context Directory | `src/api` |
| Dockerfile Path | `./src/api/Dockerfile` |
| Region | Virginia (US East) |
| Instance Type | Free |
| Health Check Path | `/status` |

The container listens on port `8080`; Render terminates TLS at the edge.

### Environment variables (production)

| Variable | Value |
| :--- | :--- |
| `DatabaseSettings__ConnectionString` | the Npgsql key=value string above |
| `JwtSettings__Secret` | a fresh secret, `openssl rand -base64 48` (distinct from dev) |
| `ApplyMigrationsOnStartup` | `true` — runs EF migrations on boot |
| `CORS_ALLOWED_ORIGINS` | the admin origin(s), set once the admin is deployed |
| `Email__ApiKey` | Resend API key for invitation e-mails; when unset the API logs the accept link instead of sending (`LoggingEmailSender`) |
| `Email__FromAddress` / `Email__FromName` | sender identity (defaults: `onboarding@resend.dev` / `Agendify`) |

On boot the API applies migrations, creating the schema, `btree_gist`, and the `no_overlap`
constraint. Verify with `GET /status` (200) and `GET /api/spaces` (401 without a token).

## Admin (Vercel) — planned

Vercel auto-detects Next.js. In the project (dashboard or `vercel` CLI):

1. **Root Directory:** `src/admin`.
2. **Environment variable:** `NEXT_PUBLIC_API_URL = https://agendify-api-j6da.onrender.com`.
3. Deploy (push to `main`, or `vercel --prod`).

Once the admin URL is known, add it to the API's `CORS_ALLOWED_ORIGINS` (see the Render env vars).

## Mobile (Expo EAS) — planned

Prerequisite: `eas-cli` installed and `eas login`.

```bash
cd src/mobile
eas build  --profile production --platform android   # or ios
eas submit --profile production --platform android
```

The profiles in `eas.json` inject `EXPO_PUBLIC_API_URL` — point `preview`/`production` at the API
URL; the `development` profile uses `http://localhost:5089`.

## Pre-launch security & LGPD checklist

Before opening to the public:

- [ ] `JwtSettings__Secret` is strong and unique (≥ 32 chars), distinct from development.
- [ ] The database user has no `SUPERUSER` privilege.
- [ ] `CORS_ALLOWED_ORIGINS` lists the real origins only (no `*`).
- [ ] The LGPD subject-rights endpoints (data export and erasure via `/api/me`) are reachable.
- [ ] Any previously leaked credentials have been rotated.

## Operational notes

- **Cold start:** the free Render instance sleeps after ~15 min idle; the first request then
  takes ~30–50 s. A paid/always-on tier removes this.
- **Uploaded images are ephemeral.** `FileUploadService` writes space images to the container's
  own filesystem (served at `/uploads`), and Render's disk does not survive a deploy or restart —
  so those images are lost while the database keeps pointing at them. Fine for the current
  walking skeleton; before real use, move to external storage (S3/R2) or a paid persistent disk.
  Tracked in the [Roadmap](../ROADMAP.md).
- **Secrets hygiene:** never commit secrets; if a credential appears in a log, rotate it
  (e.g. reset the Neon password and update the Render variable). See [SECURITY.md](../SECURITY.md).
- **CORS:** stays empty until a browser client is deployed; then list the exact origins.

## Related

- [CI/CD](CICD.md) · [Architecture](ARCHITECTURE.md) · [ADR-0004](adr/0004-deploy-first-render-neon.md)
