# Política e Diretrizes de Segurança

A segurança é um requisito de primeira classe do **Agendify**: a plataforma lida com dados
pessoais e com o controle de acesso a espaços físicos. Este documento define a política de
divulgação de vulnerabilidades e as diretrizes técnicas de segurança e privacidade.

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
  e **MFA para administradores** estão previstos no [ROADMAP.md](ROADMAP.md).
- **Autorização baseada em papéis** (`Administrator`, `Common`) aplicada nos *controllers*.
  Endpoints seguem o princípio do **menor privilégio**; apenas o cadastro inicial de usuário é
  anônimo.
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
- **Em repouso:** *encryption at rest* no armazenamento do banco (ex.: MongoDB Atlas) e, para
  PII especialmente sensível, considerar **criptografia em nível de campo**.
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
- **Prevenção de *double-booking*** com garantia atômica no banco (índice único + transação) —
  ver [Arquitetura → Concorrência e Consistência](docs/03-Arquitetura%20da%20Solução.md#concorrência-e-consistência-prevenção-de-double-booking).
- **Armazenamento seguro de tokens no cliente:** no mobile, usar `expo-secure-store`
  (Keychain/Keystore) em vez de `AsyncStorage` não criptografado.
- **Dependências:** varredura contínua (Dependabot / `npm audit` / auditoria NuGet) e **SAST**
  (CodeQL) na CI — ver [CI/CD](docs/07-CI-CD.md).
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

## Escopo suportado

Correções de segurança são aplicadas à branch `main` (versão estável). Recomenda-se manter
dependências atualizadas e acompanhar os alertas do Dependabot.
