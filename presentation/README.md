# Apresentação da Solução

O **Agendify** é uma aplicação distribuída desenvolvida para otimizar e modernizar o processo de **reservas** e **gerenciamento de espaços compartilhados**, integrando de forma eficiente um **front-end web**, um **aplicativo mobile** e uma **API robusta**. O sistema foi projetado com foco em **usabilidade**, **escalabilidade** e **segurança**, oferecendo uma solução prática para instituições, empresas e organizações que precisam controlar o uso de ambientes como salas de reunião, laboratórios, auditórios e demais recursos compartilhados.

A plataforma possibilita que usuários realizem **reservas rápidas**, consultem disponibilidade em tempo real, gerenciem seus agendamentos e acessem funcionalidades de forma intuitiva tanto no navegador quanto em dispositivos móveis. A arquitetura distribuída, construída seguindo boas práticas de desenvolvimento, garante **integração fluida**, desempenho estável e facilidade de manutenção.

Com uma API estruturada em padrões REST, o Agendify promove uma comunicação consistente entre os diferentes módulos do sistema, permitindo a evolução contínua do projeto. Além disso, foram aplicadas metodologias ágeis para assegurar organização, colaboração e entregas incrementais ao longo de todo o desenvolvimento.

O resultado é uma solução completa e flexível, capaz de atender diferentes contextos e proporcionando uma experiência confiável, moderna e eficiente para a gestão de reservas e espaços compartilhados.

## Hospedagem

`🔗 Link de Acesso:`

**Documentação da API:** https://agendify-api-hcakacdneufubggc.canadacentral-01.azurewebsites.net/swagger/index.html

**API URL:** https://agendify-web-efcneeeya4hkfse2.canadacentral-01.azurewebsites.net/Login

`🔐 Credenciais de Acesso:` 

- Administrador Demo:

**E-mail:** admin@agendify.com

**Senha:** 12345678

- Usúario Demo:

**E-mail:** usuario@agendify.com

**Senha:** 12345678

## ▶️ Como Rodar o App Mobile no Simulador com Expo

Siga os passos abaixo para executar o Agendify em um emulador ou dispositivo físico via Expo:

### 1. Pré-requisitos:

- **Node.js** instalado (versão recomendada: 18+)

- **Expo CLI** instalado globalmente:

`npm install -g expo-cli`

**Emulador Android** (AVD) ou **Simulador iOS** (Xcode) configurado ou o app **Expo Go** no seu smartphone.

### 2. Passos:

**Clone** o repositório oficial:

`git clone https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-2-e4-infra-t1-agendify/tree/main`

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
