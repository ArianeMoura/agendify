# Instruções de utilização

## Como rodar o app mobile no simulador com Expo

Siga os passos abaixo para executar o Agendify em um emulador ou dispositivo físico via Expo:

### 1. Pré-requisitos:

- **Node.js** instalado (versão recomendada: 18+)

- **Expo CLI** instalado globalmente:

`npm install -g expo-cli`

**Emulador Android** (AVD) ou **Simulador iOS** (Xcode) configurado ou o app **Expo Go** no seu smartphone.

### 2. Passos:

**Clone** o repositório:

`git clone https://github.com/ArianeMoura/agendify.git`

**Navegue** até a pasta do projeto mobile:

`cd agendify`

**Instale** as dependências:

`npm install`

**Inicie** o servidor Expo:

`npx expo start`

**Abra** o app:

- No navegador de dev que abrirá após `expo start`, escaneie o **QR Code** com o **Expo Go** no celular.
- No **emulador Android**, pressione `a` no terminal.
- No **simulador iOS** (macOS + Xcode), pressione `i`.

## Como rodar a API (.NET 9)

### 1. Pré-requisitos:

- **.NET SDK 9** instalado
- Acesso a uma instância do **MongoDB** (Atlas ou local via `docker/docker-compose.yml`)

### 2. Configuração dos segredos (obrigatório)

Nenhum segredo é versionado. A string de conexão do MongoDB e o segredo JWT vêm de
**User Secrets** (desenvolvimento) ou de **variáveis de ambiente** (produção). Sem isso, a API
aborta no boot com uma mensagem indicando o que falta.

Configure os segredos da API (uma vez):

```bash
cd src/api
dotnet user-secrets set "DatabaseSettings:ConnectionString" "mongodb+srv://USUARIO:SENHA@host/?retryWrites=true&w=majority"
dotnet user-secrets set "JwtSettings:Secret" "$(openssl rand -base64 48)"
```

Os valores ficam fora do repositório (macOS/Linux: `~/.microsoft/usersecrets/`; Windows:
`%APPDATA%\Microsoft\UserSecrets\`). Em produção, defina `DatabaseSettings__ConnectionString`
e `JwtSettings__Secret` como variáveis de ambiente (o `:` vira `__`). Veja o `.env.example`
na raiz para a lista completa.

### 3. Rodar a API

```bash
cd src/api
dotnet run
```

### 4. Testes de integração

Conectam a um Mongo real — pulam automaticamente se a variável não estiver definida:

```bash
AGENDIFY_TEST_MONGO="mongodb+srv://USUARIO:SENHA@host/?..." dotnet test src/api.Tests/api.Tests.csproj
```

### 5. Proteção contra vazamento de segredos

Ative o hook de pre-commit (usa [gitleaks](https://github.com/gitleaks/gitleaks),
`brew install gitleaks`):

```bash
git config core.hooksPath .githooks
```

O CI (`.github/workflows/security.yml`) também roda o gitleaks em cada push/PR. Recomenda-se
habilitar **Secret scanning + Push protection** nas configurações do repositório no GitHub.

## Hospedagem e acesso

O ambiente de demonstração em nuvem (Azure App Service) foi **descontinuado**. A API (com a
documentação Swagger em `/swagger`), a Web e o Mobile são executados **localmente** seguindo as
instruções acima; o MongoDB de desenvolvimento é provido pelo `docker/docker-compose.yml`.

As **credenciais de demonstração** (perfis de administrador e usuário) são criadas via *seed*
local sob solicitação e **não são versionadas** no repositório, por segurança. Consulte as
diretrizes em [SECURITY.md](../SECURITY.md).
