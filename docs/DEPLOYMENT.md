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
| `App__BaseUrl` | public URL of the admin panel — it is the base of the password-reset link sent by e-mail, so it must be openable in a browser. **Required outside Development**: the app fails to boot without it |
| `Email__ApiKey` | Resend API key for invitation and password-reset e-mails; when unset the API logs the link instead of sending it (`LoggingEmailSender`) |
| `Email__FromAddress` / `Email__FromName` | sender identity (defaults: `onboarding@resend.dev` / `Agendify`) |
| `Storage__ServiceUrl` | `https://<account_id>.r2.cloudflarestorage.com` |
| `Storage__Bucket` | the R2 bucket name — **this is the switch**: set it and images go to R2, leave it empty and they go to the container's ephemeral disk |
| `Storage__AccessKeyId` / `Storage__SecretAccessKey` | R2 API token credentials |
| `Storage__PublicBaseUrl` | the bucket's public `r2.dev` domain or a custom one; it is what gets stored in `Space.ImageUrl`, so it must be reachable by the clients |

On boot the API applies migrations, creating the schema, `btree_gist`, and the `no_overlap`
constraint. Verify with `GET /status` (200) and `GET /api/spaces` (401 without a token).

### Setting up the R2 bucket

One-time, in the Cloudflare dashboard:

1. **R2 → Create bucket** (e.g. `agendify-uploads`).
2. In the bucket, **Settings → Public Development URL → Enable** → this is `Storage__PublicBaseUrl`.
   Note that `r2.dev` is **rate limited and meant for development**, with no cache or WAF in
   front of it; a custom domain is the production answer once there is a domain to use.
3. **R2 → Account details → API Tokens → Manage → Create Account API token**, permission
   **Object Read and Write**, scoped to that bucket. It returns the **Access Key ID** and the
   **Secret Access Key** — the secret is shown **once only**, so copy it right away.
4. The **Account ID** is on the same R2 page and forms the endpoint:
   `Storage__ServiceUrl = https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.

`Storage__Bucket` is the switch: with it set, images go to R2; empty, they go to the
container's ephemeral disk.

## Admin (Vercel) — planned

Vercel auto-detects Next.js. In the project (dashboard or `vercel` CLI):

1. **Root Directory:** `src/admin`.
2. **Environment variable:** `NEXT_PUBLIC_API_URL = https://agendify-api-j6da.onrender.com`.
3. Deploy (push to `main`, or `vercel --prod`).

Once the admin URL is known, set **both** of the API's variables to it: `CORS_ALLOWED_ORIGINS`
and `App__BaseUrl`. Order matters for `App__BaseUrl` — it is the base of the password-reset
link, so pointing it anywhere else means sending people a dead link. Until the panel is
published, password reset still works through the app, which accepts a pasted token.

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
- **Uploaded images need `Storage__*` set.** With `Storage__Bucket` configured, images go to
  Cloudflare R2 and survive deploys. Leave it empty and `LocalImageStorage` writes to the
  container's own filesystem (served at `/uploads`) — which on Render does **not** survive a
  deploy or restart, so the images vanish while the database keeps pointing at them. That is
  fine locally and broken in production, so set the variables before uploading anything real.
  Images uploaded before this was configured are already gone; re-upload them via the admin.
- **Secrets hygiene:** never commit secrets; if a credential appears in a log, rotate it
  (e.g. reset the Neon password and update the Render variable). See [SECURITY.md](../SECURITY.md).
- **CORS:** stays empty until a browser client is deployed; then list the exact origins.

## Related

- [CI/CD](CICD.md) · [Architecture](ARCHITECTURE.md) · [ADR-0004](adr/0004-deploy-first-render-neon.md)
