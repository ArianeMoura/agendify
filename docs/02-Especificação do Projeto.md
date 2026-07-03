# Especificações do Projeto

Esta seção detalha as especificações do projeto **Agendify**, apresentando uma visão estruturada da solução proposta a partir da perspectiva do usuário.

## Personas

As personas a seguir representam os principais arquétipos de usuário do Agendify, cobrindo tanto o uso residencial (condomínios) quanto o uso comercial (operadores de espaços compartilhados).

| Sofia Almeida | <div align="center"><img width="200" alt="Foto de Sofia Almeida" src="https://github.com/user-attachments/assets/92cc7311-eba7-4a05-acd8-db85f54a6384" /></div> |
| :--- | :--- |
| **Idade:** | 38 |
| **Ocupação:** | Arquiteta (moradora) |
| **Perfil:** | Mãe de dois filhos, mora em um condomínio-clube e coordena a rotina de lazer da família. |
| **Objetivos:** | Reservar piscina, brinquedoteca e salão de festas de forma centralizada, aproveitando a estrutura do condomínio sem conflitos de horário. |
| **Frustrações:** | O sistema atual de agendamento é ineficiente e já causou conflitos de horário com outros moradores. A comunicação sobre interdição de áreas é falha. |

| Bruno Guedes | <div align="center"><img width="200" alt="Foto de Bruno Guedes" src="https://github.com/user-attachments/assets/9f241350-4b40-4d99-b9e5-43f7a4e2fbeb" /></div> |
| :--- | :--- |
| **Idade:** | 26 |
| **Ocupação:** | Desenvolvedor de Software (morador, home office) |
| **Perfil:** | Trabalha remotamente e usa a infraestrutura do condomínio para trabalhar e treinar ao longo da semana. |
| **Objetivos:** | Encontrar e reservar com antecedência horários no coworking, na quadra e na academia, inclusive nos horários de pico. |
| **Frustrações:** | O coworking fica lotado sem previsibilidade e ele perde tempo de trabalho. Achar um horário livre para a quadra depois das 18h é quase impossível sem um sistema claro de agendamento. |

| Carlos Vasconcelos | <div align="center"><img width="200" alt="Foto de Carlos Vasconcelos" src="https://github.com/user-attachments/assets/29bf1ef4-17e7-461e-b000-a9086dd5819c" /></div> |
| :--- | :--- |
| **Idade:** | 52 |
| **Ocupação:** | Síndico Profissional (administrador) |
| **Perfil:** | Gerencia múltiplos condomínios e busca profissionalizar a operação das áreas comuns. |
| **Objetivos:** | Centralizar regras, limites de capacidade e comunicação, além de obter dados concretos de utilização para planejar melhorias e reduzir conflitos. |
| **Frustrações:** | Gasta muito tempo resolvendo disputas por agendamentos. A comunicação é pulverizada (grupos de WhatsApp, e-mails, murais) e ele não tem controle sobre quem recebeu os comunicados. |

| Helena Martins | <div align="center"><img width="200" alt="Foto de Helena Martins" src="https://github.com/user-attachments/assets/12db0c3b-6d42-4d88-a327-e4eea1d60bb2" /></div> |
| :--- | :--- |
| **Idade:** | 31 |
| **Ocupação:** | Prestadora de Serviço (Personal Trainer) |
| **Perfil:** | Oferece aulas particulares e em grupo aos moradores e precisa conciliar sua agenda profissional com a disponibilidade dos espaços. |
| **Objetivos:** | Reservar horários recorrentes na academia e no salão multiuso, com confirmação e alerta de conflitos, divulgando seus serviços de forma oficial. |
| **Frustrações:** | A dificuldade em divulgar o trabalho e a confusão para conciliar a agenda com a disponibilidade dos espaços, muitas vezes resultando em cancelamentos. |

| Rafael Nunes | <div align="center"><img width="200" alt="Foto de Rafael Nunes" src="https://github.com/user-attachments/assets/e38c3ff5-7e5e-45aa-b5c8-0be12aebdb42" /></div> |
| :--- | :--- |
| **Idade:** | 40 |
| **Ocupação:** | Gerente de Operações de Coworking (operador comercial) |
| **Perfil:** | Administra um espaço de coworking com salas de reunião e estações compartilhadas alugadas a empresas e profissionais autônomos. |
| **Objetivos:** | Controlar a ocupação em tempo real, aplicar regras por tipo de plano e extrair relatórios de uso e receita para apoiar decisões de operação. |
| **Frustrações:** | Ferramentas isoladas que não previnem reservas duplicadas (double booking) nem consolidam métricas de ocupação e faturamento. |

## Histórias de Usuários

| EU COMO... `PERSONA` | QUERO/PRECISO ... `FUNCIONALIDADE` | PARA ... `MOTIVO/VALOR` |
| :--- | :--- | :--- |
| **Sofia Almeida** | Ter conhecimento dos horários disponíveis da piscina, brinquedoteca e salão de festas e poder inseri-los na minha agenda | Organizar de forma concreta e precisa os dias e horários dos eventos da família, evitando conflitos e tempo perdido. |
| **Bruno Guedes** | Consultar horários livres no coworking, quadra de tênis e academia e reservar com antecedência | Garantir que meus compromissos de trabalho e treinos não se sobreponham e otimizar meu tempo diário. |
| **Carlos Vasconcelos** | Visualizar e gerenciar todos os horários de uso das áreas comuns, definindo regras, limites de capacidade e notificando os moradores | Evitar conflitos de agendamento, melhorar a eficiência do condomínio e assegurar que todos os moradores recebam informações de forma centralizada. |
| **Helena Martins** | Ter acesso a horários disponíveis para minhas aulas e poder reservar horários recorrentes | Planejar minhas turmas de forma organizada, evitando sobreposição de aulas e otimizar minha agenda profissional. |
| **Rafael Nunes** | Gerenciar a ocupação das salas e estações em tempo real, aplicando regras por plano e emitindo relatórios | Maximizar a ocupação do espaço, evitar reservas duplicadas e acompanhar métricas de uso e receita. |

## Modelagem do Processo de Negócio - Agendify

### Análise da Situação Atual

O gerenciamento de reservas de espaços (condomínios, coworkings, salões de festa, salas de reunião, áreas comuns) costuma ser fragmentado e manual em muitas organizações. Usuários recorrem a planilhas, grupos de WhatsApp, ou sistemas isolados que não conversam entre si. Isso provoca vários problemas operacionais:

* Falta de centralização das informações sobre disponibilidade e histórico de reservas.
* Conflitos por reserva e dificuldade de reconciliação de horários.
* Processos manuais para aprovação e pagamento (quando aplicável).
* Ausência de notificações/alertas confiáveis (confirmação, lembretes, check-in, cancelamento).
* Dificuldade para gerar relatórios e auditar uso e receitas associadas.

**Impacto:** insatisfação dos moradores/usuários, perda de receita (por cancelamentos não tratados), e aumento de trabalho administrativo.

### Descrição Geral da Proposta

O sistema de gestão de reservas **Agendify** é uma solução mobile e web para gerenciar reservas, uso e faturamento de espaços compartilhados. 

**Objetivos principais:**

* Centralizar o catálogo de espaços e calendários.
* Automação de validações de regras (políticas do condomínio, limites por usuário, horários de bloqueio).
* Processamento de pagamentos integrados (quando aplicável) e política de reembolso.
* Notificações e lembretes (confirmação, 24h antes, check-in, avisos de uso indevido).
* Relatórios de uso, receita e conflitos.

### Processo 1 – Registro de Reserva

**Objetivo:** permitir que um usuário solicite a reserva de um espaço de forma rápida, com validações quase em tempo real e retorno claro (confirmado, pendente ou rejeitado).

#### Oportunidades de melhoria

* Formulário de reserva simplificado (preenchimento mínimo + campos opcionais).
* Classificação automática do tipo de reserva (social, comercial, reunião) para aplicar regras específicas.
* Sugestão automática de horários alternativos em caso de conflito.
* Processamento de pagamentos quando aplicável.
* Confirmação automática com comprovante (e-mail) e link para adicionar ao calendário.

#### Fluxograma 1 — Registro de Reserva

<div align="center">
<img width="900" alt="Fluxograma do processo de registro de reserva" src="https://github.com/user-attachments/assets/f47a1bc3-7561-4320-a7b1-e970fb1652df" />
</div>

<h4 align="center">FIGURA 01</h4>

### Processo 2 – Gerenciamento de Reservas (aprovação, uso e cancelamento)

**Objetivo:** controlar o ciclo de vida da reserva após a solicitação, validação, bloqueio, uso (check-in) e encerramento.

#### Oportunidades de melhoria

* Automação das aprovações quando as regras são cumpridas.
* Integração com meios de pagamento e políticas claras de cancelamento e reembolso.
* Monitoramento do uso (ex.: check-in por QR code) para evitar abusos.
* Painel administrativo para gerenciar exceções e relatórios.

#### Fluxograma 2 — Gerenciamento de Reservas

<div align="center">
<img width="900" alt="Fluxograma do processo de gerenciamento de reservas" src="https://github.com/user-attachments/assets/03252803-ab6c-4b07-ac84-55e97d82ee88" />
</div>

<h4 align="center">FIGURA 02</h4>

## Indicadores de Desempenho

| Indicador | Descrição | Objetivo | Cálculo | Fonte de Dados | Perspectiva |
|---|---|---|---|---|---|
| **Utilização por espaço (dia/semana/mês)** | Horas ou número de reservas efetivamente utilizadas por cada espaço em um período. | Medir o aproveitamento dos espaços para gestão e alocação. | `(Horas reservadas no período) / (Horas disponíveis no período) * 100` ou `#reservas por espaço` por período. | Logs de reservas (start/end), calendário de disponibilidade. | Operações |
| **Taxa de ocupação (por espaço / global)** | Percentual do tempo disponível que ficou reservado. | Avaliar aproveitamento total e identificar espaços subutilizados. | `(Total horas ocupadas / Total horas disponíveis) * 100` | Banco de dados de reservas + calendário de disponibilidade. | Operações / Estratégia |
| **Horários de pico** | Faixas horárias com maior concentração de reservas (por dia da semana). | Planejar recursos, restrições e estratégias (limpeza, staff, precificação). | `Contar reservas por slot horário → ordenar → Top N` | Reservas com timestamps. | Operações |
| **Taxa de no‑shows** | Percentual de reservas confirmadas onde o usuário não compareceu. | Reduzir desperdício e ajustar políticas de garantia/multa. | `(No-shows / Reservas confirmadas) * 100` | Registros de presença / check-in / confirmação. | Operações / Clientes |
| **Tempo médio de aprovação** | Tempo médio entre solicitação e decisão (aprovada/rejeitada) para reservas que exigem aprovação manual. | Otimizar SLA de aprovação e experiência do usuário. | `avg(tempo_aprovacao = tempo_aprovado - tempo_solicitado)` | Logs de workflow / eventos de aprovação. | Processos Internos |
| **Receita gerada por reservas (por espaço / total)** | Valor financeiro oriundo das reservas (taxas, aluguel, multas). | Monitorar receita, rentabilidade e apoiar decisões de precificação. | `sum(valor_pago)` por período; `Receita média por reserva = total / #reservas` | Sistema de pagamentos / faturas. | Financeiro |
| **Taxa de cancelamento** | Percentual de reservas que foram canceladas antes do uso. | Identificar fricções, ajustar políticas e reduzir impactos operacionais. | `(Reservas canceladas / Reservas totais) * 100` | Histórico de reservas. | Operações / Clientes |

## Requisitos

As tabelas a seguir apresentam uma descrição detalhada dos **requisitos funcionais** e **não funcionais** que definem o escopo do projeto:

### Requisitos Funcionais

|ID    | Descrição do Requisito  | Prioridade |
|------|-----------------------------------------|----|
|RF-001| O sistema deve permitir a criação de perfis com diferentes permissões (administrador, gestor, usuário, prestador de serviços). | ALTA |
|RF-002| O sistema deve permitir que os usuários realizem login com e-mail e senha. | ALTA |
|RF-003| O sistema deve possibilitar a recuperação de senha. | ALTA |
|RF-004| O sistema deve permitir que administradores cadastrem novos espaços com nome, capacidade, recursos, horários e regras de uso. | ALTA |
|RF-005| O sistema deve permitir que usuários criem, visualizem, editem e cancelem reservas de espaços. | ALTA |
|RF-006| O sistema deve impedir conflitos de agendamento, evitando reservas duplicadas (double booking). | ALTA |
|RF-007| O sistema deve exibir um calendário ou agenda com todas as reservas por espaço. | ALTA |
|RF-008| O sistema deve permitir a visualização da disponibilidade dos espaços em tempo real. | ALTA |
|RF-009| O sistema deve permitir que os usuários recebam notificações de confirmações, lembretes ou alterações de reservas. | ALTA |
|RF-010| O sistema deve gerar relatórios e dashboards com métricas de ocupação, horários de pico e taxa de utilização. | ALTA |
|RF-011| O sistema deve permitir que os administradores gerenciem os usuários, espaços e reservas. | ALTA |
|RF-012| O sistema deve permitir a pesquisa de espaços por data, horário, tipo e recursos disponíveis.| MÉDIA |
|RF-013| O sistema deve permitir que usuários avaliem espaços e serviços, fornecendo feedback aos gestores.| MÉDIA |
|RF-014| O sistema deve permitir que os usuários editem seu perfil.| ALTA |
|RF-015| O sistema deve exibir uma dashboard inicial personalizada, com conteúdos e funcionalidades diferentes para usuários e administradores. | ALTA |

### Requisitos Não-Funcionais

| ID      | Descrição do Requisito                                                              | Prioridade |
|---------|-------------------------------------------------------------------------------------|------------|
| RNF-001 | O sistema deve usar tokens de sessão com expiração configurável                     | ALTA       |
| RNF-002 | A interface deve ser responsiva para desktop, tablet e mobile                       | ALTA       |
| RNF-003 | O sistema deve suportar os 3 navegadores mais utilizados                            | ALTA       |
| RNF-004 | O sistema deve ter alta disponibilidade                                             | ALTA       |
| RNF-005 | O sistema deve ter tempo de resposta médio da API ≤ 1000ms para 95% das requisições | MÉDIA      |
| RNF-006 | O frontend deve carregar completamente em até 3 segundos                            | MÉDIA      |
| RNF-007 | O aplicativo mobile deve abrir em até 2 segundos                                    | MÉDIA      |
| RNF-008 | O código deve ter cobertura mínima de testes de 60%                                 | MÉDIA      |
| RNF-009 | A API deve suportar pelo menos 100 requisições simultâneas                          | BAIXA      |
| RNF-010 | O banco de dados deve processar no mínimo 50 transações por segundo                 | BAIXA      |

## Restrições

O projeto está **restrito** pelos itens apresentados na tabela a seguir:

<div align="center">

|ID| Restrição                                             |
|--|-------------------------------------------------------|
|01| A aplicação deve ter um controle de acesso de usuários|
|02| A aplicação deve integrar Web e Mobile                |
|03| A aplicação deve funcionar online                     |
|04| A aplicação deve funcionar nos sistemas Android e iOS |

</div>

## Diagrama de Casos de Uso

<div align="center">
<img width="1000" alt="Diagrama de casos de uso" src="https://github.com/user-attachments/assets/a4f3da60-fac0-4117-a320-9f431f20b918" />
</div>

<h4 align="center">FIGURA 03</h4>

# Matriz de Rastreabilidade

A matriz de rastreabilidade tem como objetivo estabelecer a relação entre os requisitos definidos e os objetivos de negócio do projeto, garantindo que cada requisito atenda a uma necessidade real e mensurável. Essa ferramenta permite acompanhar a consistência do desenvolvimento, facilitando a verificação, validação e o controle de mudanças ao longo do ciclo de vida do sistema. Além disso, contribui para assegurar que não haja requisitos esquecidos ou desalinhados com os propósitos do **Agendify**.

| ID | Descrição Resumida | Gestão de Usuários | Autenticação | Recuperação de Senha | Gestão de Espaços | Gestão de Reservas | Prevenção de Conflitos | Calendário/Agenda | Disponibilidade em Tempo Real | Notificações | Relatórios/Dashboards | Pesquisa de Espaços | Avaliação/Feedback |
|--------|--------------------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| RF-001 | Perfis com permissões | X | | | | | | | | | | | |
| RF-002 | Login com e-mail e senha | | X | | | | | | | | | | |
| RF-003 | Recuperação de senha | | | X | | | | | | | | | |
| RF-004 | Cadastro de espaços | | | | X | | | | | | | | |
| RF-005 | Criar, visualizar, editar e cancelar reservas | | | | | X | | | | | | | |
| RF-006 | Impedir conflitos de agendamento | | | | | | X | | | | | | |
| RF-007 | Exibir calendário/agenda | | | | | | | X | | | | | |
| RF-008 | Visualizar disponibilidade em tempo real | | | | | | | | X | | | | |
| RF-009 | Notificações de confirmações, lembretes e alterações | | | | | | | | | X | | | |
| RF-010 | Relatórios e dashboards | | | | | | | | | | X | | |
| RF-011 | Gestão de usuários, espaços e reservas pelo administrador | X | | | X | X | | | | | | | |
| RF-012 | Pesquisa de espaços | | | | | | | | | | | X | |
| RF-013 | Avaliação de espaços e serviços | | | | | | | | | | | | X |
| RF-014 | Edição de perfil do usuário | X | | | | | | | | | | | |
| RF-015 | Dashboard inicial personalizada | | | | | | | | | | X | | |

# Gerenciamento de Projeto

Para o desenvolvimento do **Agendify**, adotamos como referência as práticas do **PMBoK v7 (Project Management Body of Knowledge),** assegurando uma abordagem estruturada, ágil e eficiente. O gerenciamento do projeto foi organizado em áreas-chave — **tempo, equipe e orçamento** — com o objetivo de garantir entregas dentro do prazo estabelecido, alinhadas aos requisitos funcionais e à qualidade esperada.

Essa abordagem proporciona uma visão integrada do ciclo de vida do projeto, favorecendo o planejamento detalhado, a definição clara de responsabilidades e o acompanhamento contínuo de cada etapa. Com isso, o **Agendify** foi conduzido de forma colaborativa, reduzindo riscos, otimizando recursos e assegurando que o produto final atendesse às necessidades do usuário e aos objetivos estratégicos da equipe.

## Gerenciamento de Tempo

O gerenciamento do tempo do **Agendify** foi otimizado pelo uso do **Diagrama de Gantt**, que oferece uma visão clara e estruturada do andamento do projeto. Essa ferramenta possibilita:

- **Planejar e distribuir atividades** de forma equilibrada, evitando sobrecarga da equipe.
- **Definir prazos e marcos importantes**, garantindo a execução dentro do cronograma.
- **Monitorar continuamente o progresso**, permitindo ajustes rápidos diante de imprevistos.

Com essa abordagem, o desenvolvimento do **Agendify** pode ser conduzido de maneira **organizada, ágil e alinhada aos objetivos do projeto**, assegurando maior eficiência na entrega dos resultados.

<div align="center">
<img width="900" alt="Diagrama de Gantt do projeto" src="https://github.com/user-attachments/assets/7ff96a08-e6eb-4b37-be4a-438c17f67de8" />
</div>

<h4 align="center">FIGURA 04 - Diagrama de Gantt</h4>

## Gerenciamento de Equipe

Este cronograma, desenvolvido em planilha, serve como um **guia visual** para o gerenciamento da equipe e das entregas do projeto. Estruturado para otimizar a coordenação do trabalho entre agosto e dezembro, ele agrupa as atividades do time e define as principais entregas. 

O principal objetivo é sincronizar todas as fases do projeto, garantindo iterações rápidas e um fluxo de feedback contínuo. O resultado é um processo de trabalho transparente, que guia a equipe de forma eficiente para o **deploy da aplicação e a entrega final**.

<br>

<img width="900" alt="Cronograma do projeto" src="https://github.com/user-attachments/assets/dfa4ecfe-b992-45be-90b5-2cae8a9d1160" />

<h4 align="center">FIGURA 05 - Cronograma do Projeto</h4>

## Gestão de Orçamento

O orçamento do projeto **Agendify** foi estruturado para contemplar os principais recursos necessários ao desenvolvimento e implantação da plataforma (Web, Mobile e API). 

O planejamento financeiro considera um ciclo de **6 meses de desenvolvimento** e uma equipe formada por **6 desenvolvedores full-stack**, divididos entre atividades de back-end, front-end, mobile, DevOps e design.

**Resumo por categoria:**

- **Recursos Humanos:** remuneração da equipe de 6 desenvolvedores durante todo o período de desenvolvimento, cobrindo implementação das funcionalidades principais, correções, integração contínua e suporte ao deploy em staging e produção.
- **Hardware:** aquisição mínima de dispositivos para testes (como smartphones), periféricos e licenças pontuais de ferramentas de teste. A estratégia prevê o aproveitamento dos equipamentos pessoais da equipe para reduzir custos.
- **Rede e Infraestrutura:** despesas de conectividade e suporte a ferramentas de colaboração e versionamento do código.
- **Software, Licenças e Ferramentas:** licenças essenciais não cobertas por versões gratuitas, ferramentas de design e produtividade em planos limitados e soluções de gestão do projeto.
- **Serviços em Nuvem:** instâncias de hospedagem da API, banco de dados gerenciado, armazenamento e backups. A configuração é otimizada para manter custos baixos sem comprometer a performance.
- **Marketing e Vendas:** ações iniciais para lançamento, incluindo landing page, materiais digitais básicos e anúncios experimentais para validação de mercado.
- **Recursos Adicionais:** reserva destinada a imprevistos operacionais ou contratação pontual de serviços específicos.

Esse planejamento financeiro visa garantir que o projeto seja executado com qualidade e em total alinhamento com as funcionalidades essenciais estabelecidas.

<br>

<p align="center">
<img width="460" alt="Quadro de gestão de custos" src="https://github.com/user-attachments/assets/e112d384-7a6b-4395-801b-89ce26c67f45" />
</p>

<h4 align="center"> FIGURA 06 - Quadro de Gestão de Custos</h4>
