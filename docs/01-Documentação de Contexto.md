# Introdução

O uso compartilhado de espaços — como salas de reunião, quadras esportivas, salões de festas, coworkings, auditórios, laboratórios e serviços agregados — tem crescido de forma significativa, impulsionado pela urbanização, pela busca por maior flexibilidade no consumo de serviços e pelas transformações no mundo do trabalho.

O fenômeno dos chamados condomínios-clube, empreendimentos residenciais que oferecem ampla infraestrutura de lazer e serviços, ilustra essa tendência de valorização de ambientes coletivos (Firpo, 2023). Nesse cenário, cresce a demanda por soluções digitais capazes de simplificar a reserva, o monitoramento e a gestão desses espaços de maneira integrada e eficiente.

É nesse contexto que surge o Agendify, uma plataforma distribuída (Web, Mobile e API) projetada para modernizar o gerenciamento de ambientes compartilhados. Com arquitetura escalável e camadas robustas de segurança, o sistema oferece reservas em tempo real, aplicação automática de regras de uso, alertas personalizados e painéis analíticos que transformam dados de ocupação em insights estratégicos. Voltado a condomínios, empresas, universidades, centros esportivos, bibliotecas, coworkings, centros culturais e órgãos públicos, o Agendify busca fluidez operacional, prevenção de conflitos e otimização no aproveitamento de cada espaço.

## Problema

A gestão manual ou fragmentada de reservas compromete a eficiência operacional e gera conflitos recorrentes, como double bookings, sobrecarga ou subutilização de ambientes. De acordo com a Gartner (2023), 73% das organizações ainda dependem de planilhas e e-mails para realizar agendamentos — prática que, segundo o Global Occupier Survey da CBRE (2022), resulta em até 30% de subutilização dos espaços disponíveis.

Nos condomínios, mesmo diante da diversidade de ambientes e serviços, persistem dificuldades na organização do uso coletivo. Conflitos de agendamento em quadras e salões, excesso de demanda em academias e coworkings e a ausência de um controle digital centralizado comprometem tanto a experiência dos usuários quanto a eficiência administrativa (VEJA, 2023; SINDICONET, 2023).

A adoção de modelos híbridos de trabalho e regimes flexíveis também transformou os padrões de ocupação de escritórios e áreas comuns. Em 2023, o IBGE estimou que 7,4 milhões de trabalhadores brasileiros atuavam predominantemente em regime remoto, enquanto o IPEA destacou os desafios de infraestrutura e governança associados a esse novo modelo. A falta de ferramentas integradas impede ajustes adequados de escala e layout, ocasionando desperdício de oportunidades de receita e reduzindo a qualidade da experiência dos usuários.

Evidências internacionais reforçam que a integração entre plataformas de reserva aumenta a eficiência do uso de ambientes acadêmicos e corporativos (AZIZI et al., 2020). No Brasil, pesquisas confirmam essa tendência, indicando que sistemas integrados contribuem para maior aproveitamento dos espaços em instituições corporativas e educacionais (BOAVENTURA, 2022).

## Objetivos

### Objetivo Geral

Desenvolver o **Agendify**, uma plataforma para gerenciamento e reserva de espaços compartilhados, que garanta disponibilidade em tempo real, regras configuráveis de uso, monitoramento de ocupação, integração com notificações e relatórios analíticos para administradores e gestores.

### Objetivos Específicos

- Cadastrar espaços (nome, capacidade, recursos, regras e horários);
- Criar fluxo de reservas com verificação em tempo real e prevenção de conflitos;
- Estabelecer sistema de perfis e permissões (administrador, gestor, usuário, prestador de serviços);
- Desenvolver CRUDs essenciais (espaços, reservas, usuários/prestadores);
- Integrar notificações para confirmações, lembretes e alterações de reserva;
- Disponibilizar relatórios e dashboards com métricas (taxa de ocupação, horários de pico, volume de reservas);
- Garantir segurança (autenticação, autorização, logs de auditoria);
- Adotar arquitetura distribuída e escalável (API em C#/.NET, banco de dados MongoDB, web em ASP.NET Razor Pages e mobile em React Native).

## Justificativa

O desenvolvimento do Agendify é impulsionado por uma clara demanda de mercado, ganhos de eficiência e impactos sociais positivos. O crescimento de espaços compartilhados e a evolução do trabalho exigem soluções robustas de agendamento, capazes de integrar processos e gerar valor estratégico.

De acordo com McKinsey & Company (2025), o trabalho híbrido continuará influenciando os padrões de ocupação, reforçando a importância de ferramentas digitais que otimizem a utilização de espaços e aumentem a produtividade. Já a Accruent (2025) e a Yarooms (2024) apontam que soluções isoladas são insuficientes diante das necessidades atuais, pois carecem de escalabilidade, segurança e mecanismos de auditoria.

Além disso, a eficiência operacional proporcionada por plataformas digitais reduz conflitos, libera recursos humanos para atividades estratégicas e diminui custos administrativos (SINDICONET, 2023; SECOVI-SP, 2024). A integração das reservas digitais também melhora a visibilidade sobre a ocupação real, permitindo ajustes em políticas de uso, como limites de ocupação e alocação de horários.

No âmbito social e econômico, o Agendify tem potencial para gerar impactos positivos em diversos ambientes. Em condomínios, instituições educacionais, centros culturais e espaços públicos, um sistema de reservas digital diminui conflitos, aumenta a transparência e possibilita a monetização de serviços extras. Isso contribui tanto para a satisfação dos usuários quanto para o planejamento financeiro dos gestores (VEJA, 2023; GRAND VIEW RESEARCH, 2024).

## Público-Alvo

O Agendify destina-se aos seguintes públicos:

- **Gestores e administradores de espaços:** síndicos, facilities managers, gerentes de campus, responsáveis por operação e manutenção.
- **Usuários finais:** moradores, funcionários, estudantes, visitantes e profissionais que reservam e utilizam espaços.
- **Prestadores de serviço e terceiros:** professores, instrutores, prestadores de eventos e fornecedores que ofertam serviços agregados.
- **Operadores comerciais de espaços compartilhados:** gestores de coworkings, centros esportivos e culturais.
- **Órgãos públicos e instituições de ensino:** para reserva de salas, auditórios e laboratórios.
