# Arquitetura da Solução

O Agendify é um sistema **distribuído** organizado em três aplicações independentes que se comunicam por uma **API RESTful**: um backend em .NET 9, um painel web administrativo em ASP.NET Razor Pages e um aplicativo mobile em React Native/Expo. Esta seção descreve a arquitetura, o modelo de dados, as decisões de projeto e — com destaque — as estratégias de **concorrência** e **segurança**.

## Visão de contexto

```
        ┌──────────────┐        ┌──────────────┐
        │   Web (SPA/  │        │   Mobile     │
        │  Razor Pages)│        │ (React Native│
        │   .NET 9     │        │   / Expo)    │
        └──────┬───────┘        └──────┬───────┘
               │  HTTPS / REST (JSON)  │
               └───────────┬───────────┘
                           ▼
                 ┌───────────────────┐
                 │    API .NET 9     │  Controllers → Services → Repositório
                 │  (ASP.NET Core)   │  Auth JWT · CORS · Swagger
                 └─────────┬─────────┘
                           │  MongoDB.Driver
                           ▼
                 ┌───────────────────┐
                 │     MongoDB       │  users · spaces · bookings · resources
                 └───────────────────┘
```

<div align="center">
<img width="800" alt="Fluxo de interação do usuário com o sistema" src="https://github.com/user-attachments/assets/bab45620-af3e-41f2-b982-700e34355752" />
</div>

<h4 align="center">Fluxo de interação do usuário com o sistema</h4>

## Camadas e responsabilidades

| Camada | Stack | Responsabilidade |
|--------|-------|------------------|
| **API** | ASP.NET Core (.NET 9), C#, `MongoDB.Driver` | Autenticação/autorização, regras de negócio, validação e persistência. Expõe endpoints REST versionáveis e documentação OpenAPI (Swagger). |
| **Web** | ASP.NET Core Razor Pages (.NET 9) | Painel administrativo responsivo. Cliente *thin* que consome a API via `ApiClient`; não acessa o banco diretamente. |
| **Mobile** | React Native, Expo, TypeScript, expo-router, React Query | App de reservas para Android/iOS. Consome a mesma API, com cache e sincronização de estado. |
| **Dados** | MongoDB | Persistência documental das coleções de domínio. |

A separação garante que **web e mobile compartilhem a mesma fonte de verdade** (a API), evitando divergência de regras de negócio entre plataformas.

### Organização interna da API

A API segue uma separação em camadas inspirada na **Clean Architecture**, com dependências apontando para o domínio:

- **Controllers** (`Controllers/`) — fronteira HTTP: recebem requisições, aplicam `[Authorize]`, validam entrada e traduzem resultados/erros em códigos HTTP.
- **Services** (`Services/`) — regras de negócio (ex.: `BookingsService`, `AuthService`, `SpacesService`). Concentram a lógica de domínio, isolada dos detalhes de transporte.
- **Models** (`Models/`) — entidades de domínio e *settings* (`DatabaseSettings`, `JwtSettings`).
- **Acesso a dados** — via `IMongoDatabase`/`IMongoClient` injetados como *singletons* (o driver do MongoDB é *thread-safe* e gerencia o *connection pool*).

**Princípios SOLID aplicados:** injeção de dependência para desacoplar serviços e infraestrutura (DIP); serviços coesos por agregado de domínio (SRP); contratos por interface para autenticação e acesso a dados, favorecendo testabilidade (ISP/LSP).

## Comunicação entre aplicações

- **Protocolo:** REST sobre HTTPS, payloads em JSON.
- **Autenticação:** *Bearer token* JWT (HS256) enviado no header `Authorization`.
- **Versionamento:** recomenda-se versionar o contrato sob prefixo (`/api/v1/...`) para permitir evolução sem quebrar clientes existentes.
- **Erros:** padronização recomendada via `ProblemDetails` (RFC 7807), retornando `400` (validação), `401/403` (auth), `404` (não encontrado) e `409` (conflito de reserva).
- **GraphQL:** não faz parte do escopo atual (o contrato é REST). É uma consideração futura caso os clientes passem a exigir *queries* muito heterogêneas — ver [ROADMAP.md](../ROADMAP.md).

## Modelo de dados (MongoDB)

O MongoDB é um banco NoSQL orientado a documentos (JSON/BSON), oferecendo esquema flexível e escalável. As coleções do domínio se relacionam por **referências de `_id`**.

### Coleção: `users`

```json
{
  "_id": "ObjectId('5f7e1bbf9b2a4f1a9c38b9a1')",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "passwordHash": "hash_bcrypt_da_senha",
  "roles": ["Administrator", "Common"],
  "createdAt": "2024-08-29T10:00:00Z",
  "updatedAt": "2024-08-29T12:00:00Z"
}
```

> `passwordHash` armazena **apenas** o hash BCrypt da senha — nunca a senha em texto plano (ver [SECURITY.md](../SECURITY.md)).

### Coleção: `spaces`

```json
{
  "_id": "ObjectId('60b8d6d2f1c2a2a9e4d1b2a3')",
  "name": "Salão de Festas",
  "description": "Espaço amplo para eventos e comemorações.",
  "capacity": 50,
  "resources": [
    { "_id": "ObjectId('60b8d7e3f1c2a2a9e4d1b2a4')", "name": "Cadeiras", "description": "Cadeiras dobráveis confortáveis.", "quantity": 20 }
  ],
  "availableHours": ["08:00-12:00", "14:00-22:00"],
  "availability": true,
  "createdAt": "2024-09-01T12:00:00Z",
  "updatedAt": "2024-09-05T14:30:00Z"
}
```

### Coleção: `bookings`

```json
{
  "_id": "ObjectId('60b8d8f4f1c2a2a9e4d1b2a5')",
  "userId": "ObjectId('5f7e1bbf9b2a4f1a9c38b9a1')",
  "spaceId": "ObjectId('60b8d6d2f1c2a2a9e4d1b2a3')",
  "startDateTime": "2024-09-10T14:00:00Z",
  "endDateTime": "2024-09-10T18:00:00Z",
  "createdAt": "2024-09-01T13:00:00Z",
  "updatedAt": "2024-09-02T15:30:00Z"
}
```

### Coleção: `resources`

```json
{
  "_id": "ObjectId('60b8d7e3f1c2a2a9e4d1b2a4')",
  "name": "Cadeiras",
  "description": "Cadeiras dobráveis confortáveis para eventos.",
  "quantity": 20,
  "createdAt": "2024-09-01T11:30:00Z",
  "updatedAt": "2024-09-03T10:00:00Z"
}
```

### Relações e índices

| Coleção | Finalidade | Relacionamentos |
|---------|-----------|-----------------|
| **users** | Dados dos usuários. | Referenciada por `bookings`. |
| **spaces** | Espaços disponíveis. | Referenciada por `bookings`; contém `resources`. |
| **resources** | Recursos dos espaços. | Referenciada por `spaces`. |
| **bookings** | Reservas dos usuários. | Referencia `users` e `spaces`. |

**Índices recomendados:**

- `bookings`: índice composto em `{ spaceId: 1, startDateTime: 1, endDateTime: 1 }` para consultas de disponibilidade eficientes e para suportar a guarda de concorrência (ver abaixo).
- `users`: índice **único** em `{ email: 1 }` para impedir cadastros duplicados.
- `spaces`: índice em `{ availability: 1 }` para filtros de catálogo.

<div align="center">
<img width="800" alt="Diagrama de classes" src="https://github.com/user-attachments/assets/8a4f1fc2-fedd-4d8a-b8a5-31a2bde55a31" />
</div>

<h4 align="center">Diagrama de classes</h4>

## Concorrência e consistência (prevenção de *double-booking*)

A regra de negócio **RN-01 / RF-006** — impedir reservas sobrepostas no mesmo espaço — é o
requisito de maior risco técnico do produto. A verificação de sobreposição usa a condição de
intervalos `[início, fim)`:

```
conflito ⟺ (novaInício < existenteFim) E (novaFim > existenteInício)
```

Reservas **adjacentes** (fim de uma = início da outra) são permitidas.

### Risco: condição de corrida (TOCTOU)

Verificar disponibilidade e, em seguida, inserir a reserva em **duas operações separadas**
cria uma janela de *Time-of-Check to Time-of-Use*: duas requisições concorrentes para o mesmo
espaço e horário podem **ambas** passar na verificação (o registro conflitante ainda não foi
inserido) e **ambas** inserir, produzindo um *double-booking* silencioso. Uma verificação em
memória, sem garantia atômica no banco, **não satisfaz** a RN-01 sob concorrência.

> Esta lacuna está registrada como Issue de correção (severidade alta) no GitHub Projects.

### Estratégia recomendada

A prevenção robusta combina uma **guarda atômica no banco** com **atomicidade da operação**:

1. **Guarda determinística por slot (preferencial quando os horários são discretos).**
   Modelar a disponibilidade em *slots* reserváveis e criar um **índice único** em
   `{ spaceId, slotStart }`. Duas inserções concorrentes para o mesmo slot colidem no banco
   (`E11000 duplicate key`), e a segunda falha de forma determinística — o banco arbitra o
   vencedor, não a aplicação.

2. **Transação com verificação dentro da sessão (para faixas de horário arbitrárias).**
   Envolver *verificação de sobreposição + inserção* em uma **transação MongoDB** (sessão
   multi-documento), com `readConcern: "snapshot"` e `writeConcern: "majority"`, e **retry**
   em caso de `WriteConflict`/`TransientTransactionError`. Como o MongoDB não bloqueia faixas,
   combine com um índice de guarda e trate a colisão como conflito de negócio (HTTP `409`).

3. **Idempotência.** Aceitar uma *idempotency key* na criação de reserva para que *retries* de
   rede não gerem reservas duplicadas.

4. **Semântica de erro.** Conflitos devem retornar **HTTP 409 Conflict** (não 400), permitindo
   ao cliente sugerir horários alternativos.

> Requisitos de infraestrutura: transações multi-documento exigem MongoDB em **replica set**
> (o Atlas já opera assim; para desenvolvimento local, o `docker-compose` precisa habilitar
> um *single-node replica set*). Quando isso não estiver disponível, o índice único por slot
> (opção 1) é a defesa mínima e não depende de transações.

### Cobertura de testes de concorrência

A suíte atual valida a **lógica** de sobreposição e o caminho sequencial (ver
[Estratégia de Testes](08-Estratégia%20de%20Testes.md)), mas **não** exercita duas criações simultâneas. Recomenda-se um
teste que dispare N criações concorrentes para o mesmo slot e afirme que **exatamente uma**
persiste.

## Arquitetura de segurança

A segurança é tratada em profundidade (*defense in depth*) e detalhada em
[SECURITY.md](../SECURITY.md). Resumo arquitetural:

- **Autenticação:** JWT assinado (HS256), com validação de emissor, audiência, tempo de vida e
  assinatura configurada no pipeline da API. Tokens de curta duração; *refresh tokens* e **MFA**
  para administradores estão no [roadmap](../ROADMAP.md).
- **Autorização:** baseada em papéis (`[Authorize(Roles = "Administrator" | "Common")]`).
- **Senhas:** hashing **BCrypt** (com *salt* por usuário); **Argon2id** recomendado para novas
  implementações. Nunca em texto plano.
- **Transporte:** HTTPS obrigatório (HSTS/redirect); **CORS** restrito às origens conhecidas,
  com credenciais.
- **Segredos:** nunca versionados — *User Secrets* (dev) e variáveis de ambiente (prod); a API
  aborta no *boot* se a connection string ou o segredo JWT estiverem ausentes/fracos. Varredura
  de segredos com **Gitleaks** no *pre-commit* e no CI.
- **Dados em repouso:** criptografia do armazenamento (ex.: *encryption at rest* do MongoDB
  Atlas) e criptografia em nível de campo para PII sensível, quando aplicável.
- **Auditoria:** *logs* de ações relevantes (autenticação, criação/alteração/cancelamento de
  reservas) para rastreabilidade e apoio à conformidade **LGPD**.

## Escalabilidade e disponibilidade

- **API sem estado (*stateless*):** a autenticação por JWT permite escalar horizontalmente
  atrás de um *load balancer* sem *sticky sessions*.
- **Banco:** MongoDB em *replica set* para alta disponibilidade e leitura escalável; *sharding*
  por `spaceId` como evolução para grandes volumes.
- **Performance:** índices adequados (acima), paginação nas listagens e *cache* de leituras
  frequentes (ex.: catálogo de espaços) na API — ver [ROADMAP.md](../ROADMAP.md).
- **Observabilidade:** *health checks*, *logs* estruturados e métricas para suportar os alvos
  de desempenho (RNF-005 a RNF-010).

## Tecnologias utilizadas

> **C# / .NET 9 (ASP.NET Core):** framework de backend de alto desempenho, com tipagem forte e suporte assíncrono nativo, usado na API e no painel web.

> **ASP.NET Core Razor Pages:** construção da aplicação web administrativa orientada a páginas (HTML + C#).

> **React Native + Expo:** desenvolvimento do app mobile para Android e iOS a partir de uma única base de código TypeScript.

> **MongoDB:** banco NoSQL orientado a documentos, com modelagem flexível e escalável.

> **Docker:** containerização para ambientes de desenvolvimento e execução local consistentes (ver `docker/docker-compose.yml`).

> **Git e GitHub:** versionamento, revisão de código (Pull Requests), automação (GitHub Actions) e gestão de tarefas (GitHub Projects).

## Qualidade de software (ISO/IEC 25010)

Para assegurar qualidade, adotamos como referência a norma **ISO/IEC 25010**. As subcaracterísticas priorizadas:

**1. Adequação funcional** — *Completude* (todas as funcionalidades de reserva e gestão implementadas) e *Correção* (disponibilidade, conflitos e regras processados com exatidão, incluindo concorrência).

**2. Segurança** — *Confidencialidade e integridade* dos dados pessoais e das reservas; *autenticidade* (cada ação atribuída a um usuário autenticado, apoiando auditoria).

**3. Confiabilidade** — *Maturidade* (testes rigorosos), *disponibilidade* (alto *uptime*) e *tolerância a falhas* (recuperação rápida).

**4. Usabilidade** — *Apreensibilidade*, *operacionalidade* e *acessibilidade* em web e mobile.

**5. Eficiência de desempenho** — *Tempo de resposta* e *utilização de recursos* otimizados.

**6. Manutenibilidade** — *Modularidade*, *reusabilidade* e *analisabilidade* (arquitetura em camadas, SOLID).

**7. Portabilidade** — *Adaptabilidade* (múltiplos dispositivos/SO) e *instalabilidade*.

### Métricas de acompanhamento

Índice de satisfação (avaliações), taxa de erros/falhas, tempo médio de resposta, MTBF, índice de usabilidade (SUS), número de incidentes de segurança, tempo médio de recuperação, consumo de recursos e taxa de acessibilidade.

## Hospedagem

Durante o desenvolvimento, a aplicação foi implantada em um ambiente de demonstração no **Azure App Service** (API e Web). Esse ambiente foi **descontinuado**; a documentação da API (Swagger) e as interfaces Web/Mobile passam a ser executadas localmente.

Para execução local, o [`docker/docker-compose.yml`](../docker/docker-compose.yml) sobe a API, o MongoDB e os serviços de apoio. As instruções estão no [Código Fonte](../src/README.md).

> As credenciais de demonstração (perfis de administrador e usuário) são configuradas via *seed* local sob solicitação — **não são versionadas** no repositório, por segurança.
