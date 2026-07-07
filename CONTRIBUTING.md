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

Adotamos uma versão simplificada do **Git Flow**:

| Branch | Papel |
|--------|-------|
| `main` | Versão estável, testada e pronta para produção. Protegida. |
| `dev` | Integração e homologação. Reúne novas features e correções antes de ir para `main`. |
| `testing` | Validação de versões candidatas antes de promover para `dev`/`main`. |
| `feature/*`, `fix/*`, `docs/*` | Trabalho isolado por tarefa, criado a partir de `dev`. |

Fluxo típico: crie `feature/<descrição>` a partir de `dev` → abra PR para `dev` → após revisão
e CI verdes, faça *merge* → `dev` é promovida a `main` quando uma versão estável está pronta.

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

Todo PR requer **pelo menos uma revisão aprovada** e CI verde antes do *merge*.

## Definition of Done

Uma tarefa está concluída quando:

1. Atende aos critérios de aceite da Issue;
2. Está coberta por testes automatizados adequados e a suíte passa;
3. Passou por revisão de código e teve o PR aprovado;
4. A CI (build, testes, lint, *secret scan*, SAST) está verde;
5. A documentação afetada foi atualizada;
6. Foi integrada à branch de destino sem regressões.

## Comunicação

O histórico técnico e as decisões vivem no GitHub (Issues, PRs, Discussions). Use os canais da
equipe para alinhamentos rápidos, mas **registre decisões relevantes nas Issues/PRs** para
manter a rastreabilidade.

## Segurança

Nunca versione segredos. Para reportar vulnerabilidades, siga a política em
[SECURITY.md](SECURITY.md).
