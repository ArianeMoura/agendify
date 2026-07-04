# CI/CD e Automação

O Agendify adota uma cultura de automação baseada em **GitHub Actions**, cobrindo as três
frentes — **API**, **Web** e **Mobile** — com testes, análise estática, verificação de
segredos e varredura de dependências. Este documento descreve o estado atual e o alvo.

## Princípios

- **Shift-left:** qualidade e segurança verificadas cedo, em cada push/PR.
- **Gate de merge:** PRs só integram com a CI verde (ver [CONTRIBUTING.md](../CONTRIBUTING.md)).
- **Sem segredos no código:** varredura contínua com Gitleaks e Push Protection.
- **Automação por camada:** cada tier tem seu pipeline, adequado à sua stack.

## Estado atual

O workflow [`security.yml`](../.github/workflows/security.yml) (`security-and-build`) executa,
a cada push/PR na `main`:

- **`gitleaks`** — varredura de segredos sobre todo o histórico do repositório.
- **`build-and-test`** — *setup* do .NET 9, `dotnet restore/build` da API e `dotnet test` da
  suíte `api.Tests`. Os testes de integração são ignorados automaticamente quando a variável
  `AGENDIFY_TEST_MONGO` não está definida, permitindo rodar sem um cluster Mongo real.

## Matriz de automação alvo

Legenda: ✅ implementado · ⬜ previsto (rastreado como Issue).

| Tier | Testes | Lint / Format | Build | SAST | Secret scan | Dep scan |
|------|--------|---------------|-------|------|-------------|----------|
| **API** (.NET 9) | `dotnet test` ✅ | analyzers + `dotnet format` ⬜ | `dotnet build` ✅ | CodeQL (C#) ⬜ | Gitleaks ✅ | Dependabot / `dotnet list package --vulnerable` ⬜ |
| **Web** (Razor, .NET 9) | testes de página/serviço ⬜ | `dotnet format` ⬜ | `dotnet build` ⬜ | CodeQL ⬜ | Gitleaks ✅ | Dependabot ⬜ |
| **Mobile** (Expo/RN) | `jest` ⬜ | `expo lint` + `tsc --noEmit` ⬜ | build EAS ⬜ | CodeQL (JS/TS) ⬜ | Gitleaks ✅ | `npm audit` / Dependabot ⬜ |
| **Cross-cutting** | — | — | — | CodeQL ⬜ | Gitleaks ✅ | Dependabot ⬜ |

## Workflows sugeridos

Organização recomendada em `.github/workflows/`:

| Arquivo | Gatilho | Conteúdo |
|---------|---------|----------|
| `ci-api.yml` | push/PR em paths de `src/api/**` | restore, build, `dotnet format --verify-no-changes`, `dotnet test` com cobertura. |
| `ci-web.yml` | push/PR em `src/web/**` | restore, build, `dotnet format`, testes. |
| `ci-mobile.yml` | push/PR em `src/mobile/**` | `npm ci`, `expo lint`, `tsc --noEmit`, `jest`, (opcional) build EAS. |
| `codeql.yml` | push/PR + agendado | análise SAST para C# e JavaScript/TypeScript. |
| `security.yml` | push/PR | Gitleaks (existente) — pode absorver o CodeQL ou mantê-lo separado. |
| `dependabot.yml` (em `.github/`) | agendado | atualização automática de dependências NuGet e npm. |

> Use filtros por `paths` para rodar apenas os pipelines afetados por cada mudança, economizando
> tempo de CI em um monorepo com três stacks.

## Cobertura e qualidade

- Meta de cobertura de testes: **≥ 60%** (RNF-008), medida na CI da API. Estratégia completa em
  [Estratégia de Testes](08-Estratégia%20de%20Testes.md).
- Falha de *lint*, testes, SAST ou *secret scan* **bloqueia** o merge.

## Segurança na esteira

- **Gitleaks** (pre-commit + CI) e **Push Protection** para segredos.
- **CodeQL** para vulnerabilidades de código (SAST).
- **Dependabot** para dependências vulneráveis (SCA).
- Nenhuma credencial em *logs* ou artefatos de build. Ver [SECURITY.md](../SECURITY.md).
