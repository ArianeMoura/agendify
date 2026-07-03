# Metodologia

O método ágil adotado neste projeto é o **SCRUM**, um framework que proporciona maior organização, eficiência e adaptabilidade ao desenvolvimento de software. Sua abordagem é baseada na entrega incremental do produto, por meio de ciclos curtos e contínuos denominados sprints, garantindo uma evolução constante e alinhada às necessidades do projeto.

O **SCRUM** estrutura papéis bem definidos, promovendo um fluxo de trabalho disciplinado e colaborativo. Essa estruturação permite a divisão eficiente das tarefas, fortalecendo a equipe para enfrentar desafios e aprimorando a
comunicação entre os membros.

A metodologia incentiva a troca de conhecimento e o debate construtivo de ideias, resultando em soluções mais inovadoras e adaptáveis. Dessa forma, esse método ágil não apenas otimiza o processo de desenvolvimento, mas também melhora a qualidade do produto final e a satisfação dos envolvidos.

## Relação de Ambientes de Trabalho

Os artefatos do projeto serão desenvolvidos utilizando **ASP NET (Razor Pages)** para a construção da aplicação web e mobile será utilizado o **React Native**. Os testes e validações serão realizados em desktops (browsers), dispositivos móveis físicos e emuladores. A tabela abaixo apresenta os ambientes de trabalho e suas respectivas plataformas:

| Ambiente | Plataforma | Link de Acesso |
|---------------|----------------------------------------------|----------------|
| Design e Prototipação | Figma | https://www.figma.com/design/dcBmCPWXIaXNYU4aihH6JV/Agendify?node-id=0-1&t=8IibpANYSN4dxQAU-1 |
| Documentação do Projeto | Github | https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-2-e4-infra-t1-agendify |
| Repositório do Código Fonte | Github | https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-2-e4-infra-t1-agendify/tree/main/src |
| Gerenciamento de Tarefas do Projeto | GitHub Projects | https://github.com/orgs/ICEI-PUC-Minas-PMV-ADS/projects/2246 |
| Hospedagem | a definir | https://agendify-web-efcneeeya4hkfse2.canadacentral-01.azurewebsites.net/Login |

Durante o desenvolvimento, utilizaremos **Expo** para facilitar a criação e teste da aplicação móvel, permitindo a execução em dispositivos físicos por meio do aplicativo **Expo Go**. Além disso, os emuladores serão utilizados para validação do funcionamento da aplicação em diferentes cenários.

## Controle de Versão

A ferramenta de controle de versão adotada no projeto foi o **Git**, com o repositório hospedado no **GitHub**, devido à sua facilidade de uso e à experiência técnica dos membros da equipe. O GitHub oferece uma interface prática e uma excelente integração com outras ferramentas de desenvolvimento, tornando o gerenciamento do código mais eficiente. O projeto segue uma versão simplificada do modelo **Gitflow** para organização do versionamento. 

As principais **branches** adotadas são:

- `main`: Esta branch contém a versão estável do software, já testada e pronta para produção. 
- `dev`: A branch de desenvolvimento e homologação, onde todas as novas features e correções de bugs são mescladas. Funciona como o ambiente de testes e preparação para a versão de produção.
- `testing`: Esta branch pode ser utilizada para versões que estão sendo testadas antes de serem validadas para a **dev** ou **main**.

O fluxo de trabalho permite que a **dev** seja continuamente atualizada com novas funcionalidades e correções de bugs, sendo, então, mesclada à **main** quando uma versão estável e testada estiver pronta para lançamento. O gerenciamento de **issues** no GitHub é utilizado para organizar e priorizar o trabalho do projeto. O sistema de **labels** (etiquetas) foi adotado para categorizar e facilitar o acompanhamento das atividades. 

As etiquetas são as seguintes:

- `documentation`: Utilizada para melhorar ou adicionar informações à documentação do projeto.
- `bug`: Usada quando uma funcionalidade ou parte do sistema apresenta erros ou problemas que precisam ser corrigidos.
- `enhancement`: Utilizada quando há necessidade de melhorias ou ajustes em funcionalidades já existentes no software.
- `feature`: Usada quando uma nova funcionalidade está sendo adicionada ao sistema.

Cada issue é atribuída a um membro da equipe, e o progresso das tarefas é monitorado por meio do GitHub. As issues também são vinculadas a **pull requests** para garantir que o código esteja alinhado com as tarefas estabelecidas.

## Gerenciamento de Projeto

Com base na organização de papéis do método ágil SCRUM, a equipe foi estruturada para garantir uma colaboração eficaz e o alcance dos objetivos do projeto de maneira eficiente e coordenada. A abordagem é baseada na distribuição de responsabilidades claras e bem definidas, o que facilita o processo de desenvolvimento e promove a entrega de valor contínuo ao cliente.

### Processo

Para a implementação do SCRUM, adotamos uma série de práticas ágeis que garantem a organização, eficiência e transparência ao longo do desenvolvimento do projeto. Essas práticas não só promovem a colaboração da equipe, mas também asseguram que as entregas sejam feitas de forma incremental e alinhada com os objetivos do cliente.

*Cerimônias do SCRUM:*

- **Sprint Planning:** Ao início de cada Sprint, a equipe realiza uma reunião de planejamento, onde os itens do **Backlog do Produto** são selecionados e detalhados. A principal tarefa dessa cerimônia é definir as metas para a Sprint, atribuindo tarefas específicas aos membros da equipe e garantindo que todos compreendam claramente as atividades a serem realizadas.
 
- **Daily Standup:** São reuniões diárias rápidas, com duração de aproximadamente 15 minutos, nas quais cada membro da equipe compartilha seu progresso, os desafios encontrados e as tarefas que serão executadas até o próximo encontro. Essas reuniões são essenciais para manter todos os membros alinhados e identificar rapidamente quaisquer impedimentos que possam surgir.
  
- **Sprint Review:** Ao final de cada Sprint, a equipe realiza uma reunião de revisão, onde o trabalho realizado é apresentado ao Product Owner e outros stakeholders. Essa cerimônia tem como objetivo obter feedback sobre as entregas da Sprint, verificar se as expectativas foram atendidas e ajustar o trabalho para a próxima iteração, se necessário.
  
- **Sprint Retrospective:** Após a Sprint Review, a equipe realiza uma reunião de retrospectiva. Neste encontro, a equipe reflete sobre o processo de trabalho da Sprint anterior, identificando pontos positivos, oportunidades de melhoria e ações concretas para otimizar a produtividade e a qualidade no próximo ciclo.

*Gestão do Projeto no GitHub:*

Para facilitar a organização e o acompanhamento das atividades, a equipe utiliza o **GitHub Project**. Através do **Quadro Kanban**, as tarefas são distribuídas de forma visual e clara, garantindo que todos os membros da equipe saibam o status de cada atividade. O quadro está organizado da seguinte forma:

- **Product Backlog:** Esta lista contém todas as tarefas, funcionalidades e melhorias a serem implementadas ao longo do projeto. Representa o Backlog do Produto, onde todas as atividades são inicialmente registradas e priorizadas conforme as necessidades do cliente.
  
- **To Do:** Aqui estão as tarefas que foram selecionadas para a Sprint atual, também conhecidas como *Sprint Backlog*. Essas atividades estão prontas para serem iniciadas e são a base para o trabalho da equipe durante o ciclo da Sprint.
  
- **In Progress:** Esta lista contém as tarefas que já foram iniciadas. À medida que os membros da equipe começam a trabalhar nas atividades, elas são movidas para essa coluna, garantindo visibilidade do progresso do trabalho em andamento.
  
- **Done:** As tarefas que foram concluídas, testadas e validadas entram nesta lista. Elas estão prontas para serem entregues ao cliente ou stakeholders e são consideradas entregas finalizadas. A movimentação para essa lista indica que as atividades passaram pelos controles de qualidade e estão de acordo com os requisitos definidos.

<h4 align="center">Etapa 1:</h4>

![FIGURA 01 - Quadro de Kanban](https://github.com/user-attachments/assets/990c1794-870d-4f74-942b-2c33ec280330)

<h4 align="center">FIGURA 07 - Quadro Kanban</h4>

**Planejamento:**

A primeira etapa do projeto Agendify envolveu a concepção, definição da proposta de solução e a estruturação inicial do projeto. O foco foi estabelecer a base documental e arquitetural, garantindo um direcionamento claro para o desenvolvimento da aplicação. Foram definidas as seguintes atividades:
- Levantamento do problema e definição do escopo do projeto;
- Identificação dos objetivos gerais e específicos;
- Definição do público-alvo e justificativa do projeto;
- Elaboração das especificações do projeto, incluindo personas e histórias de usuário;
- Definição dos requisitos funcionais e não funcionais;
- Documentação da Arquitetura Distribuída;
- Estabelecimento de restrições e regras de negócio;
- Criação do diagrama de casos de uso e matriz de rastreabilidade de requisitos;
- Planejamento do gerenciamento do projeto (cronograma, equipe e orçamento).

**Execução:**

Durante essa fase, a equipe estruturou toda a documentação de contexto e especificação do projeto. Foram realizadas reuniões para alinhamento das definições, validação das necessidades do usuário e organização das tarefas no quadro Kanban.
- Produção da documentação inicial;
- Estruturação dos requisitos e restrições do projeto;
- Desenvolvimento dos primeiros diagramas UML para representar casos de uso;
- Definição da estratégia de rastreabilidade de requisitos para acompanhar o progresso do projeto.

**Evidências:**

- Documento de contexto consolidado, com definição clara do problema edos objetivos do projeto;
- Primeiras versões dos diagramas UML e matriz de rastreabilidade concluídas;
- Planejamento detalhado do gerenciamento do projeto, incluindo cronograma e divisão de papéis.
  
<h4 align="center">Etapa 2:</h4>

![FIGURA 02 - Quadro de Kanban](https://github.com/user-attachments/assets/94336e48-b975-4825-870e-5740c2684145)

<h4 align="center">FIGURA 08 - Quadro Kanban</h4>

**Planejamento:**

Na segunda etapa, o foco esteve na continuidade da elaboração do projeto e no início do desenvolvimento do back-end da solução, garantindo uma base sólida para a implementação das funcionalidades essenciais na etapa seguinte. As atividades planejadas incluíram:
- Definição da metodologia de desenvolvimento (SCRUM) e configuração do ambiente de trabalho;
- Implementação do gerenciamento ágil do projeto, priorizando organização e eficiência;
- Criação da API a ser consumida pelo frontend web e mobile do projeto;
- Modelagem da arquitetura da solução, abrangendo diagrama de classes, estrutura das collections e referências entre collections;
  
**Execução:**

Com a estrutura do projeto bem definida, a equipe iniciou as implementações essenciais, focando na organização e consistência da aplicação. As principais ações realizadas foram:
- Definição e construção das collections necessárias no modelo NoSQL.
- Desenvolvimento do backend (API), garantindo a estrutura para gerenciar espaços e seus recursos, reservas, usuários, autenticação alinhada as necessidades do projeto;

**Evidências:**

- Código fonte da implementação referente a API em C#;
- Arquitetura da Solução;
- Diagrama de Classes;
- Documentação do Banco de Dados MongoDB;

<h4 align="center">Etapa 3:</h4>

![FIGURA 03 - Quadro de Kanban](https://github.com/user-attachments/assets/a1e1f442-1601-41ef-a7f7-aa647ccc921a)

<h4 align="center">FIGURA 09 - Quadro Kanban</h4>

**Planejamento:**

Na terceira etapa, o foco esteve na continuidade da elaboração do projeto e no desenvolvimento do front-end web da solução. As atividades planejadas incluíram:
- Implementação do gerenciamento ágil do projeto, priorizando organização e eficiência;
- Modelagem do processo de negócio utilizando BPMN para análise da situação atual e proposta de solução;
- Criação do projeto de interface, incluindo wireframes e diagrama de fluxo para representar a experiência do usuário;
- Desenvolvimento do template padrão da aplicação, definindo identidade visual (logo, cores, tipografia e iconografia);
- Desenvolvimento do front-end web;
  
**Execução:**

Com a estrutura do projeto bem definida, a equipe iniciou as implementações essenciais, focando na organização e consistência da aplicação. As principais ações realizadas foram:
- Produção da documentação inicial e modelagem de processos de negócio (BPMN);
- Desenvolvimento do projeto de interface, garantindo uma navegação intuitiva e alinhada às necessidades dos usuários;
- Definição e construção do template padrão da aplicação, consolidando a identidade visual;
- Implementação do front-end web seguindo o projeto de interface;

**Evidências:**

- Modelagem de processos de negócio finalizada (BPMN);
- Wireframes e diagramas de fluxo concluídos, representando a jornada do usuário na aplicação;
- Atualizado a arquitetura da aplicação documentada e validada, garantindo alinhamento com os requisitos do projeto;
- Código fonte da implementação referente ao Front-end Web;

<h4 align="center">Etapa 4:</h4>

![WhatsApp Image 2025-11-16 at 23 46 29](https://github.com/user-attachments/assets/fdc68bfa-8201-42cf-b454-e22a3e2c2736)

<h4 align="center">FIGURA 10 - Quadro Kanban</h4>

**Planejamento:**

Na quarta e última etapa de desenvolvimento, o foco esteve na elaboração do segundo front-end da solução: a aplicação mobile. O objetivo foi adaptar a experiência do usuário para dispositivos móveis (Android e iOS), garantindo acesso às funcionalidades centrais do Agendify de forma prática e em qualquer lugar. As atividades planejadas incluíram:

- Continuidade do gerenciamento ágil do projeto, ajustando o backlog para as tarefas de desenvolvimento mobile;
- Projeto de interface e experiência do usuário (UI/UX) adaptado para dispositivos móveis, incluindo wireframes e fluxogramas de navegação;
- Desenvolvimento do front-end mobile, com o desafio de consumir a mesma Web API utilizada pelo front-end web, garantindo consistência de dados;
- Elaboração e planejamento dos testes de integração (entre o mobile e a API) e testes de sistema (funcionalidade completa no dispositivo);
- Execução de testes de compatibilidade e desempenho em diferentes dispositivos e sistemas operacionais.

**Execução:**

Com o back-end consolidado e a API estável, a equipe iniciou o desenvolvimento da aplicação mobile. O foco foi criar uma interface intuitiva e responsiva, aproveitando os recursos nativos dos dispositivos quando pertinente. As principais ações realizadas foram:
- Criação da documentação de interface (wireframes e fluxogramas) específica para o contexto mobile, focando na usabilidade em telas menores e navegação por toque;
- Implementação do front-end mobile (utilizando tecnologia híbrida ou nativa) para Android e iOS;
- Integração total com a Web API, implementando as funcionalidades.
- Execução de testes de integração para validar a comunicação e o fluxo de dados entre o app mobile e o servidor;
- Realização de testes de sistema para assegurar a funcionalidade, usabilidade e conformidade com os requisitos em dispositivos físicos.

**Evidências:**

- Wireframes e diagramas de fluxo concluídos, representando a jornada do usuário na aplicação mobile;
- Documentação dos casos de testes de integração e sistema executados, com respectivos resultados;
- Código fonte da implementação referente ao Front-end Mobile;
- "Retrato" atual do quadro visual da gestão do trabalho do time no Github Projects, focado nas entregas da Etapa 4;
- "Retrato" atual do status das contribuições dos membros do time no Github.

<h4 align="center">Etapa 5:</h4>

**Planejamento:**

Nesta última etapa, o foco do projeto Agendify voltou-se para a consolidação, correção de artefatos prévios e preparação para a entrega final. O objetivo principal foi realizar um diagnóstico crítico do desenvolvimento e preparar a apresentação da solução. As atividades planejadas incluíram:

- Revisão geral dos artefatos produzidos nas etapas 1 a 4 para aplicação de correções apontadas pelos feedbacks anteriores;
- Elaboração do documento de Considerações Finais, abrangendo a avaliação de tecnologias e análise crítica do processo;
- Produção do material visual para a apresentação (slides);
- Gravação e edição do vídeo de apresentação da solução funcionando (requisito obrigatório);
- Organização final do repositório no GitHub para o "retrato" final da gestão.

**Execução:**

A equipe concentrou esforços na finalização da documentação e na garantia de que o software (Web, Mobile e API) estivesse integrado e funcional para a demonstração. As principais ações realizadas foram:

- Realização da apresentação síncrona do projeto;
- Gravação do vídeo demonstrativo, evidenciando o fluxo completo do usuário no sistema Agendify.

**Evidências:**

- Documento "Considerações Finais" completo;
- Arquivo PDF da apresentação utilizada;
- Vídeo de apresentação do projeto (link ou arquivo);
- Repositório no GitHub atualizado com todo o código fonte e documentação;
- Projeto finalizado e funcional.

### Ferramentas

Para garantir um desenvolvimento eficiente e colaborativo, adotamos diversas ferramentas que auxiliam na comunicação, organização, versionamento de código, design e implementação do projeto. Cada ferramenta foi selecionada com base em suas funcionalidades e na sua capacidade de atender às necessidades da equipe.

*1. Ferramentas de Desenvolvimento*

> **GitHub**: Plataforma essencial para o versionamento do código e colaboração entre os membros da equipe. No GitHub, utilizamos     repositórios privados para armazenar o código-fonte, garantindo organização e controle das versões. Além disso, realizamos commits frequentes e trabalhamos com branches para desenvolver novas funcionalidades ou corrigir bugs de forma isolada antes da integração ao código principal. O GitHub também é usado para gerenciamento ágil por meio do Quadro Kanban, facilitando a distribuição e acompanhamento das tarefas.
 
> **C# / .NET (ASP.NET Core)**: Framework de desenvolvimento backend baseado na linguagem C#. Utilizado para construir APIs e serviços no lado do servidor, oferecendo desempenho, escalabilidade e suporte a operações assíncronas.

> **ASP NET (Razor Pages)**: Razor Pages é um recurso do ASP.NET Core para construir aplicações web orientadas a páginas usando a sintaxe Razor (HTML + C#).

> **React Native**: Biblioteca baseada no React, utilizada para o desenvolvimento do aplicativo móvel. Foi escolhida por permitir a criação de aplicativos nativos para iOS e Android com uma única base de código, otimizando tempo e recursos da equipe.

> **Expo & Expo Go**: Ferramentas que simplificam o desenvolvimento com React Native, permitindo testes rápidos no dispositivo sem necessidade de configuração complexa. O Expo fornece um ambiente de desenvolvimento integrado, enquanto o Expo Go permite visualizar e testar a aplicação diretamente no smartphone, facilitando o fluxo de desenvolvimento e testes.

> **Visual Studio Code (VS Code)**: Editor de código adotado pela equipe devido à sua interface intuitiva, suporte a múltiplas linguagens e integração com GitHub. Além disso, conta com extensões úteis para o desenvolvimento com JavaScript, Node.js e React Native, proporcionando uma experiência de codificação eficiente.

*2. Ferramentas de Comunicação e Gestão de Projetos*
    
> **Microsoft Teams**: Escolhido como a principal ferramenta de comunicação, pois oferece chamadas de vídeo, chats em grupo e compartilhamento de arquivos. Sua integração com outras ferramentas da Microsoft facilita a colaboração e mantém um histórico organizado das discussões do projeto.
  
> **WhatsApp**: Utilizado como canal complementar para comunicação rápida e informal. É útil para mensagens instantâneas, atualizações urgentes e alinhamentos rápidos, garantindo que a equipe permaneça conectada fora dos horários formais de reunião.
  
> **GitHub Project (Quadro Kanban)**: Usado para o gerenciamento ágil do projeto, organizando as tarefas em colunas como Backlog, To Do, In Progress e Done. Essa estrutura permite um acompanhamento visual claro do progresso do desenvolvimento.

*3. Ferramentas de Design e Prototipagem*
     
> **Figma**: Ferramenta essencial para design de interfaces e prototipagem. Com ela, a equipe pode criar wireframes, mockups e fluxogramas, garantindo uma visão clara do layout e funcionalidades do aplicativo antes do desenvolvimento. Sua capacidade de colaboração em tempo real permite que os designers compartilhem e revisem interfaces facilmente.
  
> **Canva**: Utilizado para a criação de slides de apresentação, logotipo e identidade visual do projeto. O Canva simplifica o design de materiais gráficos, proporcionando um visual profissional sem necessidade de ferramentas avançadas.
  
> **Lucid**: Ferramenta escolhida para criação de diagramas e visualização de fluxos de trabalho. Ele auxilia no planejamento da arquitetura do sistema, facilitando a comunicação dos processos e estrutura da aplicação para toda a equipe.

*4. Ambiente de Desenvolvimento*
   
Cada membro da equipe utiliza seu próprio computador ou notebook como ambiente de desenvolvimento configurado para suportar as tecnologias adotadas. O sistema operacional varia de acordo com a preferência individual, desde que compatível com as ferramentas utilizadas.

## Estratégia de Organização de Codificação
Todos os artefatos relacionados à implementação e visualização dos conteúdos do projeto da aplicação serão inseridos no [Código Fonte](https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-2-e4-infra-t1-agendify/blob/main/README.md).
