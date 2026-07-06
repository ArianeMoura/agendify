<div align="center">

<img width="200" height="166" alt="agendify-lockup-vertical-light" src="https://github.com/user-attachments/assets/afaeb3f2-9af8-4806-b9b5-22dccec2131a" />

</div>

## Sobre

O Agendify é uma plataforma distribuída — **Web, Mobile e API** — para reservar e administrar ambientes compartilhados como salas de reunião, coworkings, auditórios, quadras, laboratórios e áreas comuns. A solução centraliza o catálogo de espaços, o calendário de disponibilidade e o ciclo de vida das reservas, atendendo tanto gestores (administração, regras e relatórios) quanto usuários finais (reserva rápida no navegador ou no celular).

Os pilares do produto são **disponibilidade em tempo real**, **regras configuráveis de uso**, **prevenção de conflitos** e **segurança de dados** em conformidade com a LGPD.

## Arquitetura

Três aplicações independentes se comunicam por uma API RESTful, compartilhando a mesma fonte de verdade.

| Camada | Stack | Responsabilidade |
| :--- | :--- | :--- |
| **API** | ASP.NET Core (.NET 9) · MongoDB | Regras de negócio, autenticação JWT e persistência |
| **Web** | ASP.NET Core Razor Pages (.NET 9) | Painel administrativo responsivo |
| **Mobile** | React Native · Expo · TypeScript | Aplicativo de reservas para Android e iOS |

Detalhes de arquitetura, modelo de dados e decisões técnicas em [Arquitetura da Solução](docs/03-Arquitetura%20da%20Solução.md).

## Começando

Requisitos e guias completos por camada estão no [Código Fonte](src/README.md).

```bash
# API — requer .NET SDK 9 e uma instância MongoDB
cd src/api && dotnet run

# Web — requer .NET SDK 9
cd src/web && dotnet run

# Mobile — requer Node.js 18+
cd src/mobile && npm install && npx expo start
```

Para desenvolvimento local, o [`docker/docker-compose.yml`](docker/docker-compose.yml) sobe o MongoDB e os serviços de apoio.

> **Segredos nunca são versionados.** A string de conexão do MongoDB e o segredo JWT vêm de User Secrets (desenvolvimento) ou variáveis de ambiente (produção). Consulte o [`.env.example`](.env.example) e a seção de configuração no [Código Fonte](src/README.md).

## Documentação

| Produto e arquitetura | Engenharia |
| :--- | :--- |
| [Visão de Produto](docs/01-Visão%20de%20Produto.md) | [Contribuição e fluxo de trabalho](CONTRIBUTING.md) |
| [Especificação do Projeto](docs/02-Especificação%20do%20Projeto.md) | [Segurança e privacidade](SECURITY.md) |
| [Arquitetura da Solução](docs/03-Arquitetura%20da%20Solução.md) | [Estratégia de testes](docs/08-Estratégia%20de%20Testes.md) |
| [Projeto de Interface](docs/04-Projeto%20de%20Interface.md) | [CI/CD e automação](docs/07-CI-CD.md) |
| [Design System](docs/05-Design%20System.md) | [Roadmap](ROADMAP.md) |
| [Referências](docs/06-Referências.md) | |

## Planejamento

O backlog, a priorização e o acompanhamento de entregas são gerenciados no **GitHub Projects**, com cada tarefa rastreada por **Issues** vinculadas a Pull Requests. O fluxo completo está descrito em [CONTRIBUTING.md](CONTRIBUTING.md).

## Licença

Distribuído sob os termos descritos em [LICENSE](LICENSE).
