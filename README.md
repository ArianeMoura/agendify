<div align="center">

<img width="200" height="166" alt="agendify-lockup-vertical-light" src="https://github.com/user-attachments/assets/afaeb3f2-9af8-4806-b9b5-22dccec2131a" />

</div>

## Overview

Agendify lets organizations publish a catalog of bookable spaces and lets users reserve them in real time from **web** (admin) and **mobile**. Its core guarantee — no two confirmed reservations may overlap in the same space — is enforced **atomically in PostgreSQL**, which makes double-booking impossible even under high concurrency (a naive check-then-insert cannot promise this).

One backend is the single source of truth; every client talks to it over HTTPS/JSON. Deep documentation lives in [`docs/`](docs/).

## Tech stack

| Area | Technology |
| :--- | :--- |
| API | ASP.NET Core (.NET 9), C# |
| Data | PostgreSQL 16, EF Core + Npgsql |
| Auth | JWT Bearer, BCrypt, refresh tokens |
| Admin (web) | Next.js, React, TypeScript |
| Mobile | Expo, React Native, TypeScript |
| Infra | Docker; Render (API) + Neon (PostgreSQL) |

## Quick start (backend)

Prerequisites: **.NET 9 SDK** and **Docker** (running).

```bash
# 1) Local PostgreSQL 16 in a container
echo "POSTGRES_PASSWORD=change-me-locally" > docker/.env
docker compose -f docker/docker-compose.yml up -d

# 2) Secrets (never committed) via .NET User Secrets
cd src/api
dotnet user-secrets set "DatabaseSettings:ConnectionString" \
  "Host=localhost;Port=5432;Database=agendify;Username=agendify;Password=change-me-locally"
dotnet user-secrets set "JwtSettings:Secret" "$(openssl rand -base64 48)"

# 3) Run — migrations apply automatically in Development
dotnet run    # http://localhost:5089  (health: /status, docs: /swagger)
```

Full setup, environment variables, and per-app guides: [`src/README.md`](src/README.md).

## Documentation

| Engineering | Product (PT) |
| :--- | :--- |
| [Architecture](docs/ARCHITECTURE.md) | [Visão de Produto](docs/01-Visão%20de%20Produto.md) |
| [Architecture Decision Records](docs/adr/) | [Especificação do Projeto](docs/02-Especificação%20do%20Projeto.md) |
| [Testing strategy](docs/TESTING.md) | [Projeto de Interface](docs/04-Projeto%20de%20Interface.md) |
| [CI/CD](docs/CICD.md) | [Referências](docs/06-Referências.md) |
| [Deployment](docs/DEPLOYMENT.md) | |
| [Design system](docs/DESIGN-SYSTEM.md) | |
| [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Roadmap](ROADMAP.md) | |

## Repository layout

```
src/       api (.NET 9) · api.Tests · admin (Next.js) · mobile (Expo)
docker/    docker-compose.yml (local PostgreSQL 16)
docs/      architecture, ADRs, testing, CI/CD, deployment, design system, product docs
```

## License

Distributed under the terms in [LICENSE](LICENSE).
