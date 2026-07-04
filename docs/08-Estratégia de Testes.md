# Estratégia de Testes

A qualidade do Agendify é sustentada por uma **pirâmide de testes** automatizados na API,
complementada por validações de interface em Web e Mobile. A meta de cobertura é **≥ 60%**
(RNF-008), medida na CI.

## Pirâmide de testes

| Nível | O que valida | Tecnologia | Escopo atual |
|-------|--------------|-----------|--------------|
| **Unitário** | Lógica de negócio isolada (ex.: sobreposição de horários em `IsSpaceAvailable`). | .NET 9 · NUnit 4.2.2 | `BookingsServiceTests`, `SpacesServiceTests`. |
| **Integração** | Interação Serviço ↔ MongoDB (CRUD real). | .NET 9 · NUnit · MongoDB (Docker) | ~32 testes de CRUD de `bookings` e `spaces`. |
| **Sistema (E2E)** | Pilha completa via HTTP (Controllers → Services → DB) com `WebApplicationFactory<Program>`. | .NET 9 · NUnit · `Microsoft.AspNetCore.Mvc.Testing` | Cenários de fluxo de reserva, conflito e espaço desativado. |
| **Interface** | Fluxos de UI (Web/Mobile). | `expo lint`/`tsc`; testes de página (planejado) | Em evolução — ver [CI/CD](07-CI-CD.md). |

## Como executar

```bash
# Todos os testes da API
cd src/api.Tests
dotnet test

# Filtrando por classe
dotnet test --filter "BookingsServiceTests"

# Com relatório de cobertura (HTML)
./generate-coverage-report.sh
```

### Testes de integração e o gate `AGENDIFY_TEST_MONGO`

Os testes de integração conectam a um MongoDB real. Eles são **ignorados automaticamente**
quando a variável `AGENDIFY_TEST_MONGO` não está definida, de modo que a suíte roda na CI sem
depender de um cluster:

```bash
AGENDIFY_TEST_MONGO="mongodb+srv://USUARIO:SENHA@host/?..." dotnet test src/api.Tests/api.Tests.csproj
```

Para desenvolvimento local, use o MongoDB do [`docker/docker-compose.yml`](../docker/docker-compose.yml).

## Regra crítica sob teste: prevenção de conflito (RN-01 / RF-006)

A detecção de sobreposição usa intervalos `[início, fim)`:

```
conflito ⟺ (novaInício < existenteFim) E (novaFim > existenteInício)
```

Casos cobertos hoje pelos testes unitários e de sistema:

- Espaço disponível, sem conflito → permitido.
- Sobreposição parcial, englobamento (nos dois sentidos) → rejeitado.
- Reservas **adjacentes** (fim = início) → permitido (otimiza o uso do espaço).
- Espaço inexistente ou indisponível (`Availability = false`) → rejeitado.
- Datas inválidas (início ≥ fim) → rejeitado.
- Reserva conflitante via API → responde erro de conflito.

### Lacuna conhecida: concorrência

Os testes atuais validam a **lógica** de sobreposição e o **caminho sequencial**, mas **não**
exercitam **duas criações simultâneas** para o mesmo slot. Como a implementação faz
*check-then-insert* (ver [Arquitetura → Concorrência](03-Arquitetura%20da%20Solução.md#concorrência-e-consistência-prevenção-de-double-booking)),
é necessário um **teste de concorrência** que dispare N criações paralelas e afirme que
**exatamente uma** persiste. Rastreado como Issue no GitHub Projects.

## Padrões de teste

- **Setup/Teardown** limpam as coleções e reinserem *seed* determinístico a cada teste,
  garantindo isolamento.
- Testes nomeados no padrão `Metodo_ShouldResultado_WhenCondicao`.
- Cenários de sistema mapeados por ID (`TS-01`, `TS-02`, …) ligando teste ↔ componentes.

## Integração com a CI

A suíte roda a cada push/PR pelo workflow de build & test (ver [CI/CD](07-CI-CD.md)). Falhas de
teste bloqueiam o merge. A cobertura é reportada e deve permanecer **≥ 60%**.
