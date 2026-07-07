# Especificação do Projeto

Esta seção detalha as especificações do **Agendify**, apresentando uma visão estruturada da solução a partir da perspectiva do usuário.

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
| **Frustrações:** | Gasta muito tempo resolvendo disputas por agendamentos. A comunicação é pulverizada (grupos de mensagens, e-mails, murais) e ele não tem controle sobre quem recebeu os comunicados. |

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
| **Frustrações:** | Ferramentas isoladas que não previnem reservas duplicadas (*double booking*) nem consolidam métricas de ocupação e faturamento. |

## Histórias de usuário

| EU COMO... `PERSONA` | QUERO/PRECISO ... `FUNCIONALIDADE` | PARA ... `MOTIVO/VALOR` |
| :--- | :--- | :--- |
| **Sofia Almeida** | Ter conhecimento dos horários disponíveis da piscina, brinquedoteca e salão de festas e poder inseri-los na minha agenda | Organizar de forma concreta e precisa os dias e horários dos eventos da família, evitando conflitos e tempo perdido. |
| **Bruno Guedes** | Consultar horários livres no coworking, quadra de tênis e academia e reservar com antecedência | Garantir que meus compromissos de trabalho e treinos não se sobreponham e otimizar meu tempo diário. |
| **Carlos Vasconcelos** | Visualizar e gerenciar todos os horários de uso das áreas comuns, definindo regras, limites de capacidade e notificando os moradores | Evitar conflitos de agendamento, melhorar a eficiência do condomínio e assegurar que todos os moradores recebam informações de forma centralizada. |
| **Helena Martins** | Ter acesso a horários disponíveis para minhas aulas e poder reservar horários recorrentes | Planejar minhas turmas de forma organizada, evitando sobreposição de aulas e otimizar minha agenda profissional. |
| **Rafael Nunes** | Gerenciar a ocupação das salas e estações em tempo real, aplicando regras por plano e emitindo relatórios | Maximizar a ocupação do espaço, evitar reservas duplicadas e acompanhar métricas de uso e receita. |

## Modelagem do processo de negócio

### Análise da situação atual

O gerenciamento de reservas de espaços (condomínios, coworkings, salões de festa, salas de reunião, áreas comuns) costuma ser fragmentado e manual em muitas organizações. Usuários recorrem a planilhas, grupos de mensagens ou sistemas isolados que não conversam entre si. Isso provoca vários problemas operacionais:

* Falta de centralização das informações sobre disponibilidade e histórico de reservas.
* Conflitos por reserva e dificuldade de reconciliação de horários.
* Processos manuais para aprovação e pagamento (quando aplicável).
* Ausência de notificações/alertas confiáveis (confirmação, lembretes, check-in, cancelamento).
* Dificuldade para gerar relatórios e auditar uso e receitas associadas.

**Impacto:** insatisfação dos usuários, perda de receita (por cancelamentos não tratados) e aumento de trabalho administrativo.

### Descrição geral da proposta

O Agendify é uma solução mobile e web para gerenciar reservas, uso e faturamento de espaços compartilhados.

**Objetivos principais:**

* Centralizar o catálogo de espaços e calendários.
* Automatizar validações de regras (políticas do local, limites por usuário, horários de bloqueio).
* Processar pagamentos integrados (quando aplicável) e política de reembolso.
* Emitir notificações e lembretes (confirmação, 24h antes, check-in, avisos de uso indevido).
* Gerar relatórios de uso, receita e conflitos.

### Processo 1 — Registro de reserva

**Objetivo:** permitir que um usuário solicite a reserva de um espaço de forma rápida, com validações quase em tempo real e retorno claro (confirmado, pendente ou rejeitado).

#### Oportunidades de melhoria

* Formulário de reserva simplificado (preenchimento mínimo + campos opcionais).
* Classificação automática do tipo de reserva (social, comercial, reunião) para aplicar regras específicas.
* Sugestão automática de horários alternativos em caso de conflito.
* Processamento de pagamentos quando aplicável.
* Confirmação automática com comprovante (e-mail) e link para adicionar ao calendário.

<div align="center">
<img width="900" alt="Fluxograma do processo de registro de reserva" src="https://github.com/user-attachments/assets/f47a1bc3-7561-4320-a7b1-e970fb1652df" />
</div>

<h4 align="center">Fluxograma — Registro de Reserva</h4>

### Processo 2 — Gerenciamento de reservas (aprovação, uso e cancelamento)

**Objetivo:** controlar o ciclo de vida da reserva após a solicitação, validação, bloqueio, uso (check-in) e encerramento.

#### Oportunidades de melhoria

* Automação das aprovações quando as regras são cumpridas.
* Integração com meios de pagamento e políticas claras de cancelamento e reembolso.
* Monitoramento do uso (ex.: check-in por QR code) para evitar abusos.
* Painel administrativo para gerenciar exceções e relatórios.

<div align="center">
<img width="900" alt="Fluxograma do processo de gerenciamento de reservas" src="https://github.com/user-attachments/assets/03252803-ab6c-4b07-ac84-55e97d82ee88" />
</div>

<h4 align="center">Fluxograma — Gerenciamento de Reservas</h4>

## Indicadores de desempenho

| Indicador | Descrição | Objetivo | Cálculo | Fonte de dados | Perspectiva |
|---|---|---|---|---|---|
| **Utilização por espaço (dia/semana/mês)** | Horas ou número de reservas efetivamente utilizadas por cada espaço em um período. | Medir o aproveitamento dos espaços para gestão e alocação. | `(Horas reservadas no período) / (Horas disponíveis no período) * 100` ou `#reservas por espaço` por período. | Logs de reservas (start/end), calendário de disponibilidade. | Operações |
| **Taxa de ocupação (por espaço / global)** | Percentual do tempo disponível que ficou reservado. | Avaliar aproveitamento total e identificar espaços subutilizados. | `(Total horas ocupadas / Total horas disponíveis) * 100` | Banco de dados de reservas + calendário de disponibilidade. | Operações / Estratégia |
| **Horários de pico** | Faixas horárias com maior concentração de reservas (por dia da semana). | Planejar recursos, restrições e estratégias (limpeza, staff, precificação). | `Contar reservas por slot horário → ordenar → Top N` | Reservas com timestamps. | Operações |
| **Taxa de no-shows** | Percentual de reservas confirmadas onde o usuário não compareceu. | Reduzir desperdício e ajustar políticas de garantia/multa. | `(No-shows / Reservas confirmadas) * 100` | Registros de presença / check-in / confirmação. | Operações / Clientes |
| **Tempo médio de aprovação** | Tempo médio entre solicitação e decisão (aprovada/rejeitada) para reservas que exigem aprovação manual. | Otimizar SLA de aprovação e experiência do usuário. | `avg(tempo_aprovacao = tempo_aprovado - tempo_solicitado)` | Logs de workflow / eventos de aprovação. | Processos Internos |
| **Receita gerada por reservas (por espaço / total)** | Valor financeiro oriundo das reservas (taxas, aluguel, multas). | Monitorar receita, rentabilidade e apoiar decisões de precificação. | `sum(valor_pago)` por período; `Receita média por reserva = total / #reservas` | Sistema de pagamentos / faturas. | Financeiro |
| **Taxa de cancelamento** | Percentual de reservas que foram canceladas antes do uso. | Identificar fricções, ajustar políticas e reduzir impactos operacionais. | `(Reservas canceladas / Reservas totais) * 100` | Histórico de reservas. | Operações / Clientes |

## Requisitos

### Requisitos funcionais

|ID    | Descrição do requisito  | Prioridade |
|------|-----------------------------------------|----|
|RF-001| O sistema deve permitir a criação de perfis com diferentes permissões (administrador, gestor, usuário, prestador de serviços). | ALTA |
|RF-002| O sistema deve permitir que os usuários realizem login com e-mail e senha. | ALTA |
|RF-003| O sistema deve possibilitar a recuperação de senha. | ALTA |
|RF-004| O sistema deve permitir que administradores cadastrem novos espaços com nome, capacidade, recursos, horários e regras de uso. | ALTA |
|RF-005| O sistema deve permitir que usuários criem, visualizem, editem e cancelem reservas de espaços. | ALTA |
|RF-006| O sistema deve impedir conflitos de agendamento, evitando reservas duplicadas (*double booking*), inclusive sob concorrência. | ALTA |
|RF-007| O sistema deve exibir um calendário ou agenda com todas as reservas por espaço. | ALTA |
|RF-008| O sistema deve permitir a visualização da disponibilidade dos espaços em tempo real. | ALTA |
|RF-009| O sistema deve permitir que os usuários recebam notificações de confirmações, lembretes ou alterações de reservas. | ALTA |
|RF-010| O sistema deve gerar relatórios e dashboards com métricas de ocupação, horários de pico e taxa de utilização. | ALTA |
|RF-011| O sistema deve permitir que os administradores gerenciem os usuários, espaços e reservas. | ALTA |
|RF-012| O sistema deve permitir a pesquisa de espaços por data, horário, tipo e recursos disponíveis.| MÉDIA |
|RF-013| O sistema deve permitir que usuários avaliem espaços e serviços, fornecendo feedback aos gestores.| MÉDIA |
|RF-014| O sistema deve permitir que os usuários editem seu perfil.| ALTA |
|RF-015| O sistema deve exibir uma dashboard inicial personalizada, com conteúdos e funcionalidades diferentes para usuários e administradores. | ALTA |

#### Requisitos funcionais avançados

Funcionalidades de plataforma moderna de reservas, priorizadas para a evolução do produto. O
detalhamento arquitetural (incluindo a base de concorrência que sustenta *hold* e lista de
espera) está em [Arquitetura](ARCHITECTURE.md).

|ID    | Descrição do requisito  | Prioridade |
|------|-----------------------------------------|----|
|RF-016| O sistema deve permitir **reservas recorrentes** (diária, semanal ou mensal) por meio de uma regra de recorrência padrão **iCalendar RRULE (RFC 5545)**, criando as ocorrências livres e reportando as que estejam em conflito. | ALTA |
|RF-017| O sistema deve oferecer **lista de espera** para horários indisponíveis: ao cancelar uma reserva, o slot liberado é ofertado ao próximo da fila com um bloqueio temporário; expirado o prazo, passa ao seguinte. | MÉDIA |
|RF-018| O sistema deve permitir **check-in por QR code** e aplicar **política de no-show**: a ausência após o período de tolerância marca a reserva como não comparecida e libera o slot automaticamente. | MÉDIA |
|RF-019| O sistema deve manter uma **reserva temporária (*hold*)** durante o fluxo de confirmação/pagamento, bloqueando o slot por um tempo limitado e liberando-o automaticamente (via expiração e limpeza de *holds* pendentes) caso não seja confirmado. | ALTA |
|RF-020| O sistema deve **propagar a disponibilidade em tempo real** (reservas e cancelamentos) aos clientes conectados, sem necessidade de recarregar a tela, complementando o RF-008. | ALTA |

### Requisitos não funcionais

| ID      | Descrição do requisito                                                              | Prioridade |
|---------|-------------------------------------------------------------------------------------|------------|
| RNF-001 | O sistema deve usar tokens de sessão com expiração configurável.                    | ALTA       |
| RNF-002 | A interface deve ser responsiva para desktop, tablet e mobile.                      | ALTA       |
| RNF-003 | O sistema deve suportar os três navegadores mais utilizados.                        | ALTA       |
| RNF-004 | O sistema deve ter alta disponibilidade.                                            | ALTA       |
| RNF-005 | O sistema deve ter tempo de resposta médio da API ≤ 1000 ms para 95% das requisições. | MÉDIA    |
| RNF-006 | O frontend deve carregar completamente em até 3 segundos.                           | MÉDIA      |
| RNF-007 | O aplicativo mobile deve abrir em até 2 segundos.                                   | MÉDIA      |
| RNF-008 | O código deve ter cobertura mínima de testes de 60%.                                | MÉDIA      |
| RNF-009 | A API deve suportar pelo menos 100 requisições simultâneas.                         | BAIXA      |
| RNF-010 | O banco de dados deve processar no mínimo 50 transações por segundo.                | BAIXA      |
| RNF-011 | Senhas devem ser armazenadas com hashing forte (BCrypt/Argon2), nunca em texto plano. | ALTA     |
| RNF-012 | Toda a comunicação deve trafegar sobre TLS (HTTPS); dados sensíveis criptografados em repouso. | ALTA |
| RNF-013 | O tratamento de dados pessoais deve estar em conformidade com a LGPD.               | ALTA       |

#### Requisitos não funcionais de sistema distribuído

Requisitos de qualidade específicos de uma plataforma distribuída de reservas de alta
disponibilidade. As decisões e o "porquê" de cada um estão em
[Arquitetura](ARCHITECTURE.md).

| ID      | Descrição do requisito                                                              | Prioridade |
|---------|-------------------------------------------------------------------------------------|------------|
| RNF-014 | Os endpoints de escrita de reserva devem aceitar uma **`Idempotency-Key`** e ser idempotentes sob *retry* de rede (uma mesma chave nunca gera duas reservas). | ALTA |
| RNF-015 | A prevenção de *double-booking* deve ser **garantida no nível do banco** (índice único e/ou transação), não apenas em memória, resistindo a ≥ 100 requisições concorrentes. | ALTA |
| RNF-016 | Mudanças de disponibilidade devem ser **propagadas em tempo real** aos clientes conectados com latência p95 ≤ 1 s. | MÉDIA |
| RNF-017 | O sistema deve ser **observável**: *tracing* distribuído (OpenTelemetry), *logs* estruturados correlacionados por `correlationId` e endpoints de `health`/`readiness`. | MÉDIA |
| RNF-018 | O contrato da API deve ser **versionado e retrocompatível** (`/api/v1`), com **OpenAPI publicado** como artefato e testes de contrato. | MÉDIA |
| RNF-019 | Os **direitos do titular (LGPD)** — exportação (portabilidade) e apagamento/anonimização — devem ser atendidos por *self-service* em prazo ≤ 15 dias, com trilha de auditoria. | ALTA |
| RNF-020 | O sistema deve ser **resiliente**: *timeouts*, *retry* com *backoff* e *circuit breaker* nos clientes, com **degradação graciosa** (fallback para *polling*) quando o canal de tempo real estiver indisponível. | MÉDIA |

> Os requisitos de segurança (RNF-011 a RNF-013) são detalhados em [SECURITY.md](../SECURITY.md).

### Regras de negócio

Regras críticas que orientam a implementação e os testes. A prevenção de conflitos (RN-01) é
o coração do produto e o requisito de maior risco técnico — sua solução de concorrência está
detalhada em [Arquitetura → Concorrência](ARCHITECTURE.md).

| ID | Regra |
|----|-------|
| **RN-01** | Duas reservas do **mesmo espaço** não podem ter faixas de horário que se sobreponham. Considerando os intervalos `[início, fim)`, há conflito quando `novaInício < existenteFim` **e** `novaFim > existenteInício`. Reservas **adjacentes** (o fim de uma coincide exatamente com o início da outra) são permitidas. A regra deve valer **mesmo sob requisições concorrentes**. |
| **RN-02** | Uma reserva só pode ser criada para um espaço com `Availability = true`. Espaços desativados administrativamente bloqueiam novas reservas. |
| **RN-03** | A data/hora de início deve ser **estritamente anterior** à de término; reservas de duração zero ou negativa são inválidas. |
| **RN-04** | Não é permitido criar reservas com início no passado. |
| **RN-05** | Apenas o autor da reserva ou um administrador pode editá-la ou cancelá-la. |

## Restrições

|ID| Restrição                                             |
|--|-------------------------------------------------------|
|01| A aplicação deve ter controle de acesso de usuários.  |
|02| A aplicação deve integrar Web e Mobile.               |
|03| A aplicação deve funcionar online.                    |
|04| A aplicação deve funcionar nos sistemas Android e iOS.|
|05| O **PostgreSQL** deve garantir a integridade das reservas via *exclusion constraint* (`btree_gist`), com paridade dev/prod pelo mesmo engine em container (`docker-compose`) e banco gerenciado em produção. |
|06| A API deve permanecer **stateless** (autenticação por JWT), sem *sticky sessions*, permitindo escala horizontal atrás de *load balancer*. |
|07| Web e Mobile **não acessam o banco diretamente**: toda a lógica de negócio trafega pela API, que é a única fonte de verdade. |
|08| A configuração sensível (connection strings, segredos, URLs de ambiente) deve vir de variáveis de ambiente / *User Secrets* — **nunca *hardcoded*** no código ou versionada. |
|09| O contrato da API deve ser **versionado** (`/api/v1`), com erros padronizados em `ProblemDetails` (RFC 7807) e códigos semânticos (ex.: `409` para conflito de reserva). |
|10| A cobertura mínima de testes (RNF-008) e um **teste de concorrência de reservas** (N criações simultâneas → exatamente uma persiste) são *gates* obrigatórios de release no CI. |

## Diagrama de casos de uso

<div align="center">
<img width="1000" alt="Diagrama de casos de uso" src="https://github.com/user-attachments/assets/a4f3da60-fac0-4117-a320-9f431f20b918" />
</div>

## Matriz de rastreabilidade

A matriz de rastreabilidade estabelece a relação entre os requisitos definidos e os objetivos de negócio, garantindo que cada requisito atenda a uma necessidade real e mensurável. Ela permite acompanhar a consistência do desenvolvimento, facilitando a verificação, a validação e o controle de mudanças ao longo do ciclo de vida do sistema.

| ID | Descrição resumida | Gestão de Usuários | Autenticação | Recuperação de Senha | Gestão de Espaços | Gestão de Reservas | Prevenção de Conflitos | Calendário/Agenda | Disponibilidade em Tempo Real | Notificações | Relatórios/Dashboards | Pesquisa de Espaços | Avaliação/Feedback |
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

### Matriz de rastreabilidade — requisitos avançados

Rastreabilidade dos requisitos avançados (RF-016…020) e não funcionais de sistema distribuído
(RNF-014…020) até os *epics* de produto e as decisões arquiteturais que os sustentam.

| ID | Descrição resumida | Epic / Capacidade | Decisão arquitetural de suporte |
|----|--------------------|-------------------|---------------------------------|
| RF-016 | Reservas recorrentes (RRULE) | Agenda avançada | Expansão de RRULE + guarda de concorrência por slot |
| RF-017 | Lista de espera com liberação automática | Otimização de ocupação | Evento `SlotReleased` (outbox) + *hold* com TTL |
| RF-018 | Check-in por QR e no-show | Governança de uso | Ciclo de vida da reserva + liberação automática |
| RF-019 | Reserva temporária (*hold*) | Confirmação/pagamento | *TTL index* + índice único de guarda |
| RF-020 | Disponibilidade em tempo real | Tempo real | Canal WebSocket (SignalR) + fallback *polling* |
| RNF-014 | Idempotência | Confiabilidade de escrita | `Idempotency-Key` na criação de reserva |
| RNF-015 | Não-duplicação no nível do banco | Prevenção de conflito | Índice único + transação com *retry* |
| RNF-016 | Propagação em tempo real (p95 ≤ 1 s) | Tempo real | SignalR por grupo de espaço |
| RNF-017 | Observabilidade | Operação | OpenTelemetry + logs estruturados + health checks |
| RNF-018 | Contrato versionado + OpenAPI | Evolução de contrato | `/api/v1` + `ProblemDetails` + testes de contrato |
| RNF-019 | Direitos do titular (LGPD) | Privacidade | Export/erasure/anonimização + auditoria |
| RNF-020 | Resiliência | Tolerância a falhas | Retry/backoff + circuit breaker + degradação graciosa |

---

O acompanhamento de tarefas, prioridades e entregas é feito no **GitHub Projects**, com cada
requisito desdobrado em **Issues** rastreáveis. O fluxo de trabalho está descrito em
[CONTRIBUTING.md](../CONTRIBUTING.md).
