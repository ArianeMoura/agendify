# Roadmap

Direções de evolução do **Agendify**. Este documento é intencionalmente **sem datas** — a
priorização e o sequenciamento vivem no **GitHub Projects** (milestones e Issues). Cada item
aqui deve se desdobrar em uma ou mais Issues rastreáveis.

## Prioridades imediatas (correção e robustez)

- **Prevenção de *double-booking* sob concorrência.** Substituir o *check-then-insert* em
  memória por garantia atômica no banco (índice único por slot e/ou transação MongoDB com
  retry), retornando `409 Conflict`. Ver
  [Arquitetura → Concorrência e Consistência](docs/03-Arquitetura%20da%20Solução.md#concorrência-e-consistência-prevenção-de-double-booking).
- **Hardening de tokens no cliente.** Migrar o armazenamento do JWT no mobile de `AsyncStorage`
  para `expo-secure-store`; validar assinatura do JWT no cliente web.
- **Cobertura de CI por camada.** Estender a automação para Web e Mobile (lint, build, testes),
  além de SAST (CodeQL) e varredura de dependências. Ver [CI/CD](docs/07-CI-CD.md).
- **Testes de concorrência** para reservas simultâneas no mesmo slot.

## Evolução funcional do produto

- **Notificações push em tempo real** (confirmações, lembretes 24h, alterações).
- **Integração com calendários externos** (Google Calendar, Outlook) via *export*/sincronização.
- **Reservas recorrentes** (ex.: aulas semanais de prestadores de serviço).
- **Pagamentos e faturamento** integrados, com políticas de cancelamento e reembolso.
- **Check-in por QR code** e tratamento de *no-shows*.
- **Relatórios gerenciais avançados** de ocupação, receita e horários de pico.

## Segurança e conformidade

- **Refresh tokens** com rotação e **MFA** para administradores.
- Avaliar **Argon2id** para hashing de novas senhas.
- Criptografia em nível de campo para PII sensível.
- Fluxos de LGPD self-service (exportação e eliminação de dados pelo titular).

## Arquitetura e desempenho

- **Cache** de leituras frequentes (catálogo de espaços) e otimização de consultas.
- **Observabilidade**: health checks, logs estruturados e métricas.
- Versionamento explícito do contrato REST (`/api/v1`).
- Avaliar **GraphQL** caso os clientes passem a exigir *queries* heterogêneas.
- Preparação para escala horizontal (replica set, e *sharding* por `spaceId` se necessário).
