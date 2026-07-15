# Guia de Contribuição

Obrigado por contribuir com o **Agendify**. Abaixo, o fluxo de trabalho, as convenções e os
critérios de qualidade do projeto.

## Metodologia

O desenvolvimento segue um processo ágil baseado em **Scrum + Kanban**, com entregas
incrementais. Todo o planejamento — backlog, priorização e acompanhamento — vive no
**GitHub Projects**; não há cronogramas estáticos em documentos.

- **Backlog do Produto:** todas as tarefas, funcionalidades e melhorias, priorizadas.
- **Quadro Kanban:** colunas `Backlog` → `To Do` → `In Progress` → `In Review` → `Done`.
- Cada item de trabalho é uma **Issue**, vinculada a um Pull Request e a um item do Projeto.

## Ambiente de desenvolvimento

Requisitos e passos de execução por camada (API, Admin, Mobile) estão no
[Código Fonte](src/README.md). Antes do primeiro commit, ative o hook de proteção de segredos:

```bash
git config core.hooksPath .githooks   # habilita o gitleaks no pre-commit
```

## Fluxo de branches

O projeto é *trunk-based*: a `main` é a única branch de longa duração e a fonte de verdade —
é dela que o Render publica a API.

| Branch | Papel |
|--------|-------|
| `main` | Versão estável e publicável. É onde a CI roda e de onde sai o deploy. |
| `feature/*`, `fix/*`, `docs/*` | Trabalho isolado, criado a partir da `main`, quando a mudança merece revisão ou vida própria. |

Fluxo típico: crie `feature/<descrição>` a partir da `main` → abra PR para a `main` → com a CI
verde, faça *merge*. Mudanças pequenas e de baixo risco podem ir direto na `main` — a CI roda
igual no push e o gate de concorrência (RN-01) barra o que quebrar a regra de negócio.

Como a CI só dispara em `main` (push e PR), abrir PR contra qualquer outra branch **não roda
verificação nenhuma**.

## Convenção de commits

Use **[Conventional Commits](https://www.conventionalcommits.org/)** para um histórico legível
e para automação futura de *changelog*:

```
<tipo>(<escopo opcional>): <descrição no imperativo>

feat(bookings): impede reservas sobrepostas via índice único
fix(auth): valida assinatura do JWT no cliente web
docs(security): adiciona seção de conformidade LGPD
```

Tipos comuns: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`, `perf`.

## Issues e labels

Cada Issue é atribuída a uma pessoa e categorizada por *labels*:

| Label | Uso |
|-------|-----|
| `documentation` | Melhorias ou adições à documentação. |
| `bug` | Erro ou comportamento incorreto a ser corrigido. |
| `enhancement` | Melhoria em funcionalidade existente. |
| `feature` | Nova funcionalidade. |
| `security` | Vulnerabilidade ou hardening de segurança. |
| `ci` | Pipelines e automação. |

Vincule a Issue ao PR usando palavras-chave de fechamento (ex.: `Closes #123`).

## Pull Requests

Um PR deve ser pequeno, focado e conter contexto suficiente para revisão. **Checklist:**

- [ ] O PR está vinculado a uma Issue (`Closes #NN`).
- [ ] O código segue o estilo do projeto e passou no *lint*/`format`.
- [ ] Há testes cobrindo a mudança (ver [Estratégia de Testes](docs/TESTING.md)).
- [ ] Toda a suíte de CI está verde (build, testes, *secret scan*, SAST).
- [ ] Nenhum segredo, credencial ou URL sensível foi adicionado.
- [ ] A documentação relevante foi atualizada.
- [ ] Mudanças de comportamento estão descritas no corpo do PR.

Todo PR precisa da **CI verde** antes do *merge*. O projeto é mantido por uma pessoa só, então
a revisão por pares é oportunidade, não obrigação — quando houver mais gente, ela passa a ser.

## Definition of Done

Uma tarefa está concluída quando:

1. Atende aos critérios de aceite da Issue;
2. Está coberta por testes automatizados adequados e a suíte passa;
3. A CI (build, testes, lint, *secret scan*, SAST) está verde na `main`;
4. A documentação afetada foi atualizada;
5. Foi integrada sem regressões.

## Comunicação

O histórico técnico e as decisões vivem no GitHub (Issues, PRs, Discussions). Use os canais da
equipe para alinhamentos rápidos, mas **registre decisões relevantes nas Issues/PRs** para
manter a rastreabilidade.

## Segurança

Nunca versione segredos. Para reportar vulnerabilidades, siga a política em
[SECURITY.md](SECURITY.md).
