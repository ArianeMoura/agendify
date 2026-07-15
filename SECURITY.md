# Política e Diretrizes de Segurança

A segurança é um requisito de primeira classe do **Agendify**: a plataforma lida com dados
pessoais e com o controle de acesso a espaços físicos. A seguir, a política de divulgação de
vulnerabilidades e as diretrizes técnicas de segurança e privacidade.

## Reporte de vulnerabilidades

Encontrou uma vulnerabilidade? **Não abra uma Issue pública.** Reporte de forma responsável:

- Use o canal privado **[GitHub Security Advisories](https://docs.github.com/pt/code-security/security-advisories)** do repositório (*Report a vulnerability*), ou
- Entre em contato diretamente com os mantenedores.

Inclua descrição, passos de reprodução, impacto e, se possível, uma sugestão de correção.
Comprometemo-nos a acusar o recebimento e a tratar o report com prioridade. Pedimos que não
divulgue publicamente até que uma correção esteja disponível (*coordinated disclosure*).

## Autenticação e autorização

- **Tokens JWT assinados (HS256)**, com validação obrigatória de **assinatura, emissor,
  audiência e tempo de vida** em toda verificação — inclusive em clientes que apenas leem
  *claims*. Nunca reconstrua um `ClaimsPrincipal` a partir de um token sem validar a assinatura.
- **Tokens de curta duração** (expiração configurável — RNF-001). *Refresh tokens* com rotação
  já implementados; **MFA para administradores** previsto no [ROADMAP.md](ROADMAP.md).
- **Autorização baseada em papéis** (`PlatformOwner`, `OrgAdmin`, `Member`) com políticas
  hierárquicas aplicadas nos *controllers*. Endpoints seguem o princípio do **menor
  privilégio**; os únicos pontos anônimos são o login, o *self-signup* de organização e o
  aceite de convite.
- **Isolamento por *tenant*** em duas camadas: filtros globais do EF Core restringem toda
  leitura/escrita à organização do usuário autenticado, e **Row-Level Security** no PostgreSQL
  repete a regra no próprio banco — mesmo um *bypass* da camada de aplicação não expõe dados
  de outra organização (coberto por testes de integração dedicados).
- Considerar **RS256** (chaves assimétricas) quando múltiplos serviços precisarem validar
  tokens de forma independente.

## Senhas e hashing

- Senhas são armazenadas **exclusivamente como hash** — nunca em texto plano, nunca reversível.
- Algoritmo atual: **BCrypt** com *salt* por usuário e *work factor* ≥ 12.
- Para novas implementações, recomenda-se **Argon2id** (resistente a ataques de GPU/ASIC),
  com parâmetros de memória/tempo calibrados.
- Aplicar **política de senha forte** no cadastro e verificação contra senhas vazadas
  conhecidas quando viável.
- A recuperação de senha (RF-003) deve usar *tokens* de uso único, com expiração curta e
  invalidação após o uso.

## Criptografia

- **Em trânsito:** **HTTPS/TLS obrigatório** em todas as comunicações (API, Web, Mobile), com
  *HSTS*/redirecionamento e **CORS** restrito às origens conhecidas.
- **Em repouso:** *encryption at rest* no armazenamento do banco (PostgreSQL gerenciado — ex.:
  Neon) e, para PII especialmente sensível, considerar **criptografia em nível de campo**.
- **Chaves e segredos** de criptografia são gerenciados fora do código (ver abaixo).

## Gestão de segredos

- **Nenhum segredo é versionado.** `appsettings.json` mantém valores vazios; segredos vêm de:
  - **Desenvolvimento:** *.NET User Secrets* (`dotnet user-secrets`).
  - **Produção:** **variáveis de ambiente** (`DatabaseSettings__ConnectionString`,
    `JwtSettings__Secret` — o `:` das chaves vira `__`).
- A API faz **validação *fail-fast* no boot**: aborta se a *connection string* estiver ausente
  ou se o segredo JWT estiver ausente/curto (< 32 caracteres).
- **Gitleaks** roda no *pre-commit* (`.githooks/pre-commit`) e na CI a cada push/PR. Recomenda-se
  habilitar **Secret Scanning + Push Protection** nas configurações do repositório.
- Consulte o [`.env.example`](.env.example) para a lista de variáveis.

## Segurança da aplicação (AppSec)

- **Validação de entrada** em todos os endpoints; nunca confiar em dados do cliente.
- **Padrão de erros** sem vazamento de detalhes internos (usar `ProblemDetails`/RFC 7807).
- **Prevenção de *double-booking*** com garantia atômica no banco (*exclusion constraint*
  `no_overlap` via `btree_gist`) — ver [Arquitetura](docs/ARCHITECTURE.md) e [ADR-0002](docs/adr/0002-db-enforced-invariant.md).
- **Armazenamento seguro de tokens no cliente:** no mobile, usar `expo-secure-store`
  (Keychain/Keystore) em vez de `AsyncStorage` não criptografado.
- **Dependências:** varredura contínua (Dependabot / `npm audit` / auditoria NuGet) e **SAST**
  (CodeQL) na CI — ver [CI/CD](docs/CICD.md).
- **Logs de auditoria** para autenticação e para o ciclo de vida de reservas, sem registrar
  dados sensíveis em texto plano.

## Conformidade com a LGPD

O Agendify trata dados pessoais (nome, e-mail, histórico de reservas) e adere à
**Lei Geral de Proteção de Dados (Lei nº 13.709/2018)**:

- **Base legal e finalidade:** o tratamento se limita à finalidade de gestão de reservas, com
  base legal adequada (execução de contrato/serviço e/ou consentimento).
- **Minimização de dados:** coletar apenas o necessário para operar o serviço.
- **Direitos do titular:** suportar acesso, correção, portabilidade e **eliminação**
  ("direito ao esquecimento") dos dados pessoais mediante solicitação.
- **Consentimento:** obter e registrar consentimento quando aplicável; permitir sua revogação.
- **Retenção:** definir prazos de retenção e rotinas de expurgo/anonimização de dados que não
  sejam mais necessários.
- **Segurança e incidentes:** medidas técnicas e administrativas de proteção; em caso de
  incidente com risco aos titulares, seguir plano de **resposta a incidentes** e notificação
  à ANPD e aos titulares nos prazos legais.
- **Encarregado (DPO):** designar um responsável pelo tratamento de dados como ponto de contato.
- **Rastreabilidade:** logs de auditoria apoiam a demonstração de conformidade
  (*accountability*).

### Anonimização, pseudonimização e menor privilégio

- **Apagamento por *tombstone* — o que o `PrivacyService` faz:** o direito ao esquecimento é
  atendido mantendo a linha do usuário como *tombstone* e **sobrescrevendo a PII textual** (nome →
  `[usuário removido]`, e-mail → placeholder derivado do id, senha esvaziada), limpando os
  comentários de avaliações, revogando os *refresh tokens* e carimbando `anonymized_at`. As
  **reservas são preservadas** (o `user_id` continua apontando para o *tombstone*), o que mantém os
  relatórios de ocupação agregados. A operação é **idempotente**.
- **Anonimização × pseudonimização:** distinguir **anonimização** (irreversível, fora do escopo da
  LGPD) de **pseudonimização** (reversível — ainda é dado pessoal). A abordagem atual sobrescreve a
  PII *in-place* preservando o vínculo agregado; descartar o vínculo `user_id` (ou usar um token sem
  o id embutido) é um passo de *hardening* futuro para uma anonimização mais forte.
- **Direitos do titular (RNF-019):** exportação (portabilidade) e apagamento/anonimização são
  atendidos pelos endpoints de `/api/me`, ambos **auditados** (tabela `audit_logs`).
- **Menor privilégio no banco:** a API usa um usuário de aplicação **sem `SUPERUSER`**, distinto
  do administrativo.
- **Criptografia de campo:** para PII especialmente sensível, considerar criptografia em nível de
  campo (ex.: `pgcrypto`) com chaves geridas fora do banco — o *encryption-at-rest* do provedor
  protege o disco, mas não o dado contra *dumps* lógicos.

## Escopo suportado

Correções de segurança são aplicadas à branch `main` (versão estável). Recomenda-se manter
dependências atualizadas e acompanhar os alertas do Dependabot.
