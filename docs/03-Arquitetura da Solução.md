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

A comunicação combina **REST para o CRUD** (o que já existe e é adequado ao domínio orientado a
recursos) com um **canal de tempo real para disponibilidade** (a lacuna atual do RF-008/RF-020).
A escolha de cada padrão é justificada abaixo.

### REST/HTTPS + JSON — contrato principal

- **Protocolo:** REST sobre HTTPS, payloads em JSON. *Por quê:* o domínio de reservas é orientado a recursos (`bookings`, `spaces`, `users`), a semântica *request/response* é natural, o *tooling* é maduro e as respostas são cacheáveis. É o que já está implantado.
- **Autenticação:** *Bearer token* JWT (HS256) enviado no header `Authorization`.
- **Versionamento:** versionar o contrato sob prefixo (`/api/v1/...`) para evoluir sem quebrar clientes existentes; publicar o **OpenAPI como artefato** (RNF-018).
- **Erros:** `ProblemDetails` (RFC 7807), retornando `400` (validação), `401/403` (auth), `404` (não encontrado) e **`409` (conflito de reserva)**.
- **Concorrência otimista em edições:** usar **ETag / `If-Match`** em `PUT` de reserva/espaço para detectar edições concorrentes (evita *lost update* em um mesmo documento).
- **Idempotência:** aceitar `Idempotency-Key` nas escritas (RNF-014) para tornar *retries* seguros.

### WebSocket via SignalR — tempo real (RF-008 / RF-020)

- **Decisão:** usar **SignalR** para propagar mudanças de disponibilidade e notificações aos clientes conectados. O servidor publica eventos `SlotReserved` / `SlotReleased` em **grupos por espaço**; o cliente atualiza o cache do React Query, refletindo a mudança sem recarregar a tela.
- **Por quê:** disponibilidade é intrinsecamente **multiusuário** e precisa propagar ao vivo; *polling* desperdiça banda e desatualiza. SignalR é o transporte bidirecional **nativo do .NET**, com *fallback* automático (WebSocket → SSE → *long-polling*) e cliente para React Native via `@microsoft/signalr`.
- **Degradação graciosa (RNF-020):** quando o socket cai, o cliente recai para *polling* leve via React Query — a disponibilidade continua correta, apenas menos "instantânea".

### gRPC — comunicação interna (evolução)

- Recomendado **apenas para comunicação serviço-a-serviço interna** (ex.: um futuro microsserviço de notificações), pela eficiência do *protobuf*/HTTP-2. **Não** para a borda mobile: o suporte a gRPC-web/React Native é mais frágil e os *payloads* de reserva são pequenos, sem ganho que justifique. Fica como evolução caso o monólito seja decomposto — ver [ROADMAP.md](../ROADMAP.md).

### GraphQL — fora de escopo

- As *queries* dos clientes **não são heterogêneas** o suficiente para justificar a complexidade adicional; REST + alguns endpoints de agregação (ex.: disponibilidade por espaço) atendem. Reavaliar apenas se surgirem clientes com necessidades de *query* muito variáveis.

### Eventos assíncronos (padrão Outbox) — evolução

- Para notificações (RF-009) e lista de espera (RF-017), gravar os eventos de domínio numa **coleção *outbox* dentro da mesma transação** da reserva; um *worker* em *background* os publica (broker ou SignalR) com entrega **at-least-once**. *Por quê:* elimina a inconsistência de *dual-write* entre "gravar a reserva" e "notificar/liberar slot". No MVP de mantenedor solo, o envio direto com *retry* é suficiente; o *outbox* entra quando houver pagamento ou integração externa que exija entrega garantida.

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

### Por que não outras abordagens

- **Campo de versão / concorrência otimista sozinho** protege *um único documento* contra *lost
  update*, mas o *double-booking* é um invariante **entre dois documentos distintos** (duas
  reservas diferentes) — um `version` em uma delas não impede a outra. Por isso a defesa correta é
  a **guarda de unicidade** (índice único), e não apenas versionamento. O ETag/`If-Match` continua
  válido, porém para o caso separado de **edição concorrente da mesma reserva**.
- **Lock distribuído (ex.: Redis Redlock)** adiciona infraestrutura e novos modos de falha
  (expiração de *lease*, *clock skew*) para resolver algo que o **próprio banco já arbitra** via
  índice único. Mais simples, barato e correto deixar o MongoDB ser a fonte da verdade.

### Correções acopladas (dívida técnica atual)

A implementação vigente ([`BookingsService.IsSpaceAvailable`](../src/api/Services/BookingsService.cs) +
`InsertOneAsync`) precisa evoluir junto com a guarda:

1. **Consulta limitada por data:** a verificação hoje carrega *todas* as reservas do espaço em
   memória (`Find(...).ToListAsync()` + `Any()`); deve **filtrar por faixa de data** na *query*,
   apoiada no índice `{ spaceId, startDateTime, endDateTime }`.
2. **`Update` também valida:** a edição de reserva (`ReplaceOneAsync`) hoje **não** checa
   sobreposição — deve passar pela mesma guarda/checagem que a criação.
3. **Índices no *startup*:** criar os índices (único de guarda e o composto de disponibilidade)
   automaticamente via `IHostedService` (`EnsureIndexes`), já que hoje **nenhum índice é criado**
   por código.
4. **Idempotência:** aceitar `Idempotency-Key` na criação (RNF-014) para colapsar *retries*.

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

### LGPD e privacidade de dados no MongoDB

Como o Agendify passa a tratar **dados de usuários reais**, a conformidade com a LGPD é
**pré-requisito de lançamento** — não um item de *roadmap* distante. Padrões adotados:

- **Classificação e minimização de PII:** identificar e marcar campos pessoais (nome, e-mail, e — quando existirem — telefone/documento) e coletar apenas o necessário para a finalidade (base legal).
- **Criptografia em nível de campo (CSFLE / Queryable Encryption):** para PII sensível, com chaves em um **KMS** (ex.: Azure Key Vault). *Por quê:* o *encryption-at-rest* do Atlas protege o disco, mas a **CSFLE protege o dado até de administradores do banco e de *dumps*** vazados. *(Para o MVP solo, iniciar com o encryption-at-rest gerenciado do Atlas + hashing; adotar CSFLE quando houver PII que o justifique.)*
- **Anonimização × pseudonimização:** no apagamento ou no expurgo por retenção, substituir a PII por um **token irreversível** (hash com *salt* descartado), **preservando a reserva agregada** para os indicadores — a reserva anonimizada mantém `spaceId`/horário mas **perde o vínculo com `userId`**. Distinguir **anonimização** (irreversível, fora do escopo da LGPD) de **pseudonimização** (reversível, ainda é dado pessoal).
- **Direitos do titular programáticos (RNF-019):** endpoint de **exportação** (portabilidade — todos os dados do usuário em JSON) e de **apagamento** ("direito ao esquecimento"), que anonimiza `bookings` e remove o documento em `users`; ambos **auditados**.
- **Retenção e expurgo:** política por tipo de dado; **`TTL index`** para dados efêmeros (*holds* do RF-019, sessões, notificações expiradas). Os *logs* de auditoria têm retenção maior.
- **Consentimento e base legal:** coleção de consentimentos **versionados** (com *timestamp* e revogação).
- **Menor privilégio no banco:** usuário de aplicação distinto do administrativo; sem `dbOwner` amplo.
- **Transferência a terceiros — gap a corrigir:** o fluxo de avaliação atual envia dados a um **Google Form de terceiros** (transferência sem base legal/contrato de operador). A avaliação (RF-013) deve ser **trazida para dentro da API** antes do lançamento.

## Escalabilidade e disponibilidade

- **API sem estado (*stateless*):** a autenticação por JWT permite escalar horizontalmente
  atrás de um *load balancer* sem *sticky sessions*.
- **Banco:** MongoDB em *replica set* para alta disponibilidade e leitura escalável; *sharding*
  por `spaceId` como evolução para grandes volumes.
- **Performance:** índices adequados (acima), paginação nas listagens e *cache* de leituras
  frequentes (ex.: catálogo de espaços) na API — ver [ROADMAP.md](../ROADMAP.md).
- **Observabilidade:** *health checks*, *logs* estruturados e métricas para suportar os alvos
  de desempenho (RNF-005 a RNF-010).

## Casos extremos (edge cases)

Três cenários de risco extremo na gestão de reservas e como a arquitetura proposta os trata.

### 1. Corrida de *double-booking* (TOCTOU real)

**Cenário:** dois usuários submetem reservas sobrepostas para o mesmo espaço dentro da janela
entre a verificação e a inserção, e/ou o cliente reenvia a requisição após *timeout* de rede.

**Tratamento:** o **índice único por slot** faz a segunda inserção falhar de forma determinística
(`E11000 duplicate key`) → **HTTP 409**; para faixas arbitrárias, a **transação + *retry*** em
`WriteConflict` garante a serialização; a **`Idempotency-Key`** colapsa *retries* do mesmo cliente.
Corrige diretamente a lacuna de [`BookingsService`](../src/api/Services/BookingsService.cs)
(hoje *read-then-write* sem atomicidade).

### 2. Cancelamento concorrente + liberação de lista de espera

**Cenário:** o usuário A cancela uma reserva no exato instante em que o usuário B tenta reservar
o slot liberado e a oferta automática de lista de espera (RF-017) dispara — **três escritores**
disputando o mesmo horário.

**Tratamento:** o cancelamento remove o documento-guarda **dentro de uma transação que emite o
evento `SlotReleased`** (via *outbox*); a oferta de lista de espera cria um ***hold* (TTL)**
disputando o **mesmo índice único**. Quem vencer a inserção do guarda leva o slot; os demais
recebem `409`/passam ao próximo da fila. **Nenhum slot é perdido e não há concessão dupla.**

### 3. Falha parcial / *dual-write* e fuso horário

**Cenário:** a reserva é confirmada, mas a notificação ou o pagamento falha; ou a rede cai
**após** a inserção; ou a reserva cruza uma transição de horário de verão.

**Tratamento:** o padrão ***outbox*** grava reserva + evento **atomicamente**, e um *dispatcher*
reentrega (*at-least-once*) → a notificação chega sem gerar reserva-fantasma nem duplicada; a
**idempotência** torna o *retry* do cliente seguro. Todos os *timestamps* são armazenados em
**UTC** (o código já força `DateTimeKind.Utc`), com a **chave de slot calculada no fuso do
espaço** para evitar dupla contagem em transições de DST.

## Estado atual vs. estado-alvo

Reconciliação entre o que a documentação especifica e o que o código hoje implementa. Cada
divergência abaixo é um item acionável (issue) para a evolução do produto.

| Item | Estado atual (código) | Estado-alvo | Ação |
|------|-----------------------|-------------|------|
| **Double-booking** | *Read-then-write* em memória, sem índice/transação; `Update` ignora a checagem | Guarda por índice único + transação + idempotência | Índice único, `EnsureIndexes` no *boot*, *query* com filtro de data, corrigir `Update` |
| **Tempo real (RF-008/020)** | Sem transporte (nem WebSocket nem *polling*) | SignalR + *fallback polling* | *Hub* por espaço, cliente `@microsoft/signalr` |
| **Config do mobile** | Base URL *hardcoded* para host Azure **descontinuado**; dois clientes HTTP duplicados; cliente de *analytics* sem `Authorization` | Config por *env*/`app.json`; cliente único com *interceptor* de auth | Unificar cliente, mover URL para configuração |
| **Avaliações (RF-013)** | Postam PII a um **Google Form** de terceiros | Endpoint próprio de avaliação na API | Trazer o fluxo para a API (LGPD) |
| **Infra MongoDB** | `docker-compose` *single-node* (não *replica set*) | *Single-node replica set* local | Ajustar o compose + inicializar o RS |
| **LGPD** | Documentado; apenas hashing BCrypt implementado | Export/erasure/anonimização + criptografia de PII | Implementar RNF-019 e a arquitetura de privacidade |
| **Resíduo PT no código** | Classe órfã `Reserva` e módulo de *analytics* com identificadores em português | Domínio 100% em inglês | Remover órfão e padronizar (ver nota abaixo) |
| **CI** | Apenas `security.yml`; mobile sem CI | + CodeQL, Dependabot, CI de mobile | *Workflows* por caminho |

> **Priorização (produto solo):** bloqueiam o lançamento a correção de *double-booking*, a
> conformidade LGPD (incl. sair do Google Form), a configuração sem *hardcode* e a idempotência.
> Tempo real (SignalR), *outbox*, gRPC e CSFLE são **evolução**, não MVP — evitando
> *over-engineering* para um mantenedor único.

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
