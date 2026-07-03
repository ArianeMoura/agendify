# Considerações Finais 

O **Agendify** é uma aplicação distribuída que integra Web, Mobile e API para simplificar o processo de reservas de espaços. A solução oferece um gerenciamento de ambientes compartilhados prático, escalável e seguro, garantindo eficiência no uso de recursos. Ao longo deste semestre, o projeto evoluiu de uma concepção abstrata para um produto de software funcional, atravessando etapas rigorosas de levantamento de requisitos, modelagem, desenvolvimento e testes.

Este documento apresenta uma análise crítica do caminho percorrido, avaliando as escolhas tecnológicas, a arquitetura adotada e a metodologia de trabalho da equipe.

**1. Avaliação dos Frameworks, Tecnologias e Ferramentas**

A escolha da stack tecnológica e das ferramentas de apoio foi estratégica para criar uma solução distribuída robusta e garantir a fluidez do trabalho em equipe. A seguir, apresentamos uma avaliação de como cada recurso impactou o desenvolvimento do Agendify.

**1.1. Desenvolvimento Back-end e Banco de Dados**

**C# .NET (ASP.NET Core):** A utilização do framework para a construção da API RESTful provou-se acertada. A robustez da linguagem C#, somada à sua tipagem forte e suporte a operações assíncronas, garantiu segurança e alta performance na implementação das regras de negócio.

**MongoDB:** A escolha por este banco NoSQL alinhou-se perfeitamente à natureza dinâmica dos dados. A estrutura de documentos JSON ofereceu flexibilidade na modelagem, evitando a rigidez de migrações complexas durante a fase de prototipagem.

**1.2. Desenvolvimento Front-end (Web e Mobile)**

**ASP.NET Core:** Para a interface Web, o uso de Razor Pages facilitou a integração direta com o ecossistema .NET. A sintaxe Razor (HTML + C#) permitiu construir uma aplicação orientada a páginas de forma rápida e eficiente para o painel administrativo.

**React Native e Expo:** Para o mobile, a escolha do React Native foi decisiva para otimizar recursos, permitindo criar um app nativo para Android e iOS com uma única base de código. O uso do Expo e **Expo Go** acelerou significativamente os testes, permitindo a visualização imediata das alterações diretamente nos dispositivos físicos dos desenvolvedores, sem configurações complexas de ambiente.

**1.3. Ambiente de Desenvolvimento e Versionamento**

**Visual Studio Code (VS Code):** Adotado pela equipe por sua leveza e vasto ecossistema de extensões, proporcionou uma experiência de codificação fluida tanto para o JavaScript (Mobile) quanto para o C# (quando não utilizado o VS Community).

**GitHub:** Foi a espinha dorsal da colaboração técnica. Além de armazenar os repositórios privados, o fluxo de commits e branches garantiu a integridade do código. A integração com o **GitHub Projects** permitiu substituir ferramentas externas de gestão, centralizando o Quadro Kanban (Backlog, To Do, In Progress, Done) no mesmo local onde o código reside.

**1.4. Design, Prototipagem e Modelagem**

**Figma e Lucid:** O uso do Figma para wireframes e protótipos de alta fidelidade foi essencial para validar a UX/UI antes da escrita do código, economizando tempo de retrabalho. Já o Lucid foi fundamental para diagramar a arquitetura e os fluxos de processos, facilitando o entendimento da lógica do sistema por todos os membros.

**Canva:** Ferramenta chave para a padronização visual da documentação e da apresentação final, conferindo profissionalismo às entregas.

**1.5. Comunicação e Colaboração**

**Microsoft Teams e WhatsApp:** A combinação dessas ferramentas garantiu que a equipe superasse a falta de reuniões presenciais constantes. O Teams serviu como repositório de arquivos e histórico formal, enquanto o WhatsApp agilizou a resolução de dúvidas pontuais e alinhamentos urgentes.

**2. Análise Crítica e Proposta de Melhorias**

**2.1. Em relação ao Projeto Arquitetural**

A arquitetura distribuída atendeu plenamente aos objetivos acadêmicos e funcionais do projeto. Contudo, uma análise crítica revela pontos de evolução para um cenário de mercado real:

Garantir integridade de dados em reservas simultâneas (concorrência) e manter a escalabilidade da arquitetura distribuída para suportar picos de acesso.

**Próximos Passos**

- **Ampliação da Cobertura de Testes:** Implementar uma rotina de testes automatizados (unitários e de integração) mais abrangente. O objetivo é garantir a estabilidade do sistema e prevenir regressões (erros em funcionalidades já prontas) durante futuras manutenções.
- **Otimização de Desempenho:** Refatorar consultas ao banco de dados e avaliar a implementação de estratégias de cache na API. Isso visa reduzir o tempo de resposta e preparar a aplicação para suportar um volume maior de acessos simultâneos.
- **Evolução Funcional do Produto:** Expandir o escopo da solução com novos recursos de valor agregado, como um sistema de notificações push em tempo real, relatórios gerenciais de uso dos espaços e integração com calendários externos (como Google Calendar e Outlook).

**2.2. Em relação ao Processo de Desenvolvimento**

A adoção do SCRUM adaptado, com o uso do Kanban no GitHub Projects, foi vital para a organização do time.

- **Análise do Processo:** O ritmo das Sprints permitiu entregas incrementais (MVP), o que foi essencial para identificar erros de integração entre o Mobile e a API cedo no processo. As dailys, mesmo que assíncronas em alguns momentos, mantiveram a equipe alinhada.
- **Ponto de Atenção:** Em algumas etapas, houve um acúmulo de tarefas na coluna de testes ("Code Review" ou "Testing") próximo à data de entrega, gerando gargalos.

**3. Gestão de Configuração e Repositório (GitHub)**

Para a organização dos artefatos produzidos e controle de versão do código-fonte, a equipe utilizou a plataforma GitHub. O repositório atuou como o ponto central de integração do projeto, armazenando tanto a documentação técnica quanto as implementações de software (API, Web e Mobile).

Diferente de uma gestão visual granular, o foco da utilização da ferramenta nesta etapa final foi garantir a integridade do código e a consolidação das entregas. O repositório encontra-se atualizado com a versão final da solução, contendo:

- Código-fonte do Back-end (.NET);
- Código-fonte dos Front-ends (Web e Mobile);
- Documentação completa da aplicação.

**4. Considerações sobre as Atribuições do Time**

O desenvolvimento do projeto Agendify foi conduzido de maneira colaborativa pela equipe. As responsabilidades não foram rigidamente segmentadas por função individual, mas sim distribuídas conforme a demanda de cada etapa e a necessidade técnica do momento.

O grupo atuou de forma conjunta na codificação dos requisitos, na realização dos testes e na elaboração da documentação técnica. Dessa forma, todos os integrantes contribuíram para a integração das partes da solução e para o cumprimento dos objetivos propostos para a entrega final.

**5. Conclusão**

O desenvolvimento do Agendify foi marcado pela superação de desafios técnicos e pela gestão de um cronograma apertado. Apesar do tempo escasso para a execução de uma arquitetura distribuída complexa, a equipe conseguiu priorizar as funcionalidades essenciais e articular seus esforços para entregar uma solução funcional e de qualidade. O resultado final demonstra o comprometimento do grupo em cumprir os objetivos propostos, transformando as dificuldades do percurso em aprendizado prático e sucesso na entrega.
