# Roadmap

Direções de evolução do **Agendify**. Intencionalmente **sem datas** — a priorização vive no
**GitHub Projects** (milestones e Issues). Marcadores: **Concluído** / **Planejado**.

## Concluído recentemente

- **Migração MongoDB → PostgreSQL** (EF Core + Npgsql). Ver [ADR-0001](docs/adr/0001-postgresql-over-mongodb.md).
- **Prevenção de *double-booking* sob concorrência** — garantia atômica no banco via
  *exclusion constraint* (`btree_gist`), retornando `409 Conflict`. Ver
  [ADR-0002](docs/adr/0002-db-enforced-invariant.md).
- **Teste de concorrência** (100 criações simultâneas no mesmo slot) como *gate*
  bloqueante de release na CI. Ver [Testing](docs/TESTING.md).
- **CI por camada** — GitHub Actions para API (build+test+secret scan), admin
  (lint/typecheck/test/build), mobile (lint) e CodeQL (SAST). Ver [CI/CD](docs/CICD.md).
- **Deploy em produção** — API no Render + PostgreSQL no Neon. Ver [Deployment](docs/DEPLOYMENT.md).
- **Refresh tokens com rotação** e armazenamento seguro no mobile (`expo-secure-store`).
- **Redesign do painel admin** — nova identidade da marca, design system tokenizado (tema claro +
  escuro), biblioteca de componentes acessível (Radix, WCAG 2.2 AA), shell responsivo, telas
  refeitas, tela de gestão de usuários, CSP/headers de segurança e testes (Vitest + vitest-axe).
  Ver [Design System](docs/DESIGN-SYSTEM.md) e [`src/admin/README.md`](src/admin/README.md).

## Prioridades imediatas (robustez)

- **Observabilidade e erros:** tratamento global de exceções com **`ProblemDetails`
  (RFC 7807)**; **health checks** reais com *probe* do PostgreSQL; **logs estruturados**
  (Serilog) com *correlation IDs*; **OpenTelemetry** (traces/métricas).
- **Corrigir vazamento de detalhes internos** em respostas `500` (mensagens de exceção).
- **Gate de cobertura na CI** (hoje a cobertura é um script local).

## Qualidade e testes

- **Tier de testes unitários** distinto da integração.
- **Testes de frontend do mobile** e **E2E** (Playwright/Detox). _(Admin já tem testes de
  componente/acessibilidade: Vitest + Testing Library + vitest-axe.)_
- **Padronização:** `.editorconfig`, analisadores .NET; **hooks** enforced (Husky/lint-staged).
  _(Admin já usa Prettier — `format`/`format:check`.)_

## Segurança e conformidade

- **MFA** para administradores; avaliar **Argon2id** para novas senhas.
- Criptografia em nível de campo para PII sensível.
- Fluxos de **LGPD self-service** (exportação e eliminação pelo titular).

## Evolução funcional do produto

- Notificações push (confirmações, lembretes 24h, alterações).
- Integração com calendários externos (Google Calendar, Outlook).
- Reservas recorrentes; pagamentos e faturamento; check-in por QR code; relatórios gerenciais.

## Arquitetura e desempenho

- **Redesign do frontend mobile** consumindo o [Design System](docs/DESIGN-SYSTEM.md). _(O admin
  já foi redesenhado — ver "Concluído recentemente".)_
- **Cache** de leituras frequentes (catálogo de espaços).
- Versionamento explícito do contrato REST (`/api/v1`).
- Escala do PostgreSQL: *read replicas* e *connection pooling* conforme a carga crescer.
