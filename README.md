# Agendify - Gestão Inteligente de Reservas ✔️

O **Agendify** é uma aplicação distribuída que integrará Web, Mobile e API para facilitar o processo de **reservas de espaços** de forma simples e eficiente. Seu objetivo será oferecer uma solução prática, escalável e segura para o gerenciamento de ambientes compartilhados.

Este projeto teve sua primeira versão desenvolvida como parte de um projeto acadêmico. A versão atual representa uma evolução independente, com reestruturação da arquitetura, implementação de novas funcionalidades e adoção de tecnologias e boas práticas utilizadas no desenvolvimento de software moderno.

<br>

<div align="center">

<img width="126" height="126" alt="2" src="https://github.com/user-attachments/assets/066a252c-ff3e-45e5-9217-d5939be69894" hspace="36" />

</div>

# Documentação

<ol>
<li><a href="docs/01-Documentação de Contexto.md"> Documentação de Contexto</a></li>
<li><a href="docs/02-Especificação do Projeto.md"> Especificação do Projeto</a></li>
<li><a href="docs/03-Metodologia.md"> Metodologia</a></li>
<li><a href="docs/04-Projeto de Interface.md"> Projeto de Interface</a></li>
<li><a href="docs/05-Arquitetura da Solução.md"> Arquitetura da Solução</a></li>
<li><a href="docs/06-Template Padrão da Aplicação.md"> Template Padrão da Aplicação</a></li>
<li><a href="docs/07-Programação de Funcionalidades.md"> Programação de Funcionalidades</a></li>
<li><a href="docs/08-Registro de Testes Unitários.md"> Registro de Testes Unitários</a></li>
<li><a href="docs/09-Registro de Testes de Integração.md"> Registro de Testes de Integração</a></li>
<li><a href="docs/10-Registro de Testes de Sistema.md"> Registro de Testes de Sistema</a></li>
<li><a href="docs/11-Registro de Contribuição.md"> Registro de Contribuição</a></li>
<li><a href="docs/12-Apresentação do Projeto.md"> Apresentação do Projeto</a></li>
<li><a href="docs/13-Referências.md"> Referências</a></li>
<li><a href="docs/14-Considerações Finais.md"> Considerações Finais</a></li>
</ol>

# Configuração local (segredos)

Nenhum segredo é versionado. A string de conexão do MongoDB e o segredo JWT vêm de
**User Secrets** (desenvolvimento) ou de **variáveis de ambiente** (produção).

**1. Configure os segredos da API (uma vez):**

```bash
cd src/api
dotnet user-secrets set "DatabaseSettings:ConnectionString" "mongodb+srv://USUARIO:SENHA@host/?retryWrites=true&w=majority"
dotnet user-secrets set "JwtSettings:Secret" "$(openssl rand -base64 48)"
```

Os valores ficam em `~/.microsoft/usersecrets/`, fora do repositório. Em produção, defina
`DatabaseSettings__ConnectionString` e `JwtSettings__Secret` como variáveis de ambiente
(o `:` vira `__`). Veja `.env.example` para a lista completa.

**2. Testes de integração** (conectam a um Mongo real) — pulam automaticamente se a variável
não estiver definida:

```bash
AGENDIFY_TEST_MONGO="mongodb+srv://USUARIO:SENHA@host/?..." dotnet test src/api.Tests/api.Tests.csproj
```

**3. Proteção contra vazamento de segredos** — ative o hook de pre-commit (usa
[gitleaks](https://github.com/gitleaks/gitleaks), `brew install gitleaks`):

```bash
git config core.hooksPath .githooks
```

O CI (`.github/workflows/security.yml`) também roda o gitleaks em cada push/PR. Recomenda-se
habilitar **Secret scanning + Push protection** nas configurações do repositório no GitHub.

# Código

<li><a href="src/README.md"> Código Fonte</a></li>

# Apresentação

<li><a href="presentation/README.md"> Apresentação da solução</a></li>
