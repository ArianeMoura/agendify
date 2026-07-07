# Projeto de Interface

A **interface** do Agendify foi projetada para oferecer uma experiência intuitiva e eficiente na gestão de reservas em condomínios, coworkings e demais ambientes compartilhados. Cada tela foi desenvolvida para garantir usabilidade, clareza e acessibilidade, atendendo às necessidades dos usuários de forma prática e organizada. O projeto se apoia na norma técnica de qualidade de software **ISO/IEC 25010:2023**, buscando altos padrões de usabilidade, eficiência e confiabilidade.

O **painel administrativo (web)** já está **implementado** em **Next.js 16 / React 19**, seguindo o [Design System](DESIGN-SYSTEM.md), com **acessibilidade WCAG 2.2 AA**, **responsivo** (desktop, tablet e mobile) e **tema claro/escuro**.

> A **interatividade** do fluxo do usuário, incluindo a **transição entre telas**, pode ser explorada no protótipo interativo: [Protótipo Interativo — Agendify (Figma)]().

As diretrizes de identidade visual (logo, paleta, tipografia) estão em [Design System](DESIGN-SYSTEM.md).

## Diagramas de fluxo

<div align="center">
<img width="700" alt="Fluxograma do administrador" src="https://github.com/user-attachments/assets/24e64495-d9d0-46e3-b695-4b8ec6aaeabc" />
</div>

<h4 align="center">Fluxo do Administrador</h4>

<br>

<div align="center">
<img width="700" alt="Fluxograma do usuário" src="https://github.com/user-attachments/assets/963c1dc6-c029-488b-98f1-62a145661509" />
</div>

<h4 align="center">Fluxo do Usuário</h4>

## Telas do Painel Administrativo (implementadas)

Telas reais do painel de gestão (perfil **Administrador**), na identidade final da marca. Todos os componentes seguem o mesmo design system tokenizado — os mesmos tokens trocam de valor entre os temas **claro** e **escuro**.

### Login
Acesso do gestor com e-mail e senha, com o lockup da marca e formulário acessível.

<div align="center">
<img width="820" alt="Tela de login do painel Agendify" src="img/admin/login.png" />
</div>

<br>

### Visão geral (Dashboard)
Resumo com KPIs (espaços, disponíveis, reservas totais e futuras) e a lista de reservas recentes.

<div align="center">
<img width="820" alt="Dashboard do painel — tema claro" src="img/admin/dashboard-light.png" />
</div>

<div align="center">
<img width="820" alt="Dashboard do painel — tema escuro" src="img/admin/dashboard-dark.png" />
</div>

<h4 align="center">Tema claro e escuro</h4>

<br>

### Espaços
Listagem dos espaços reserváveis com status, e criação/edição em modal (nome, capacidade, horários, imagem e disponibilidade).

<div align="center">
<img width="820" alt="Tela de gestão de espaços" src="img/admin/spaces.png" />
</div>

<br>

### Reservas
Acompanhamento e criação de reservas; conflitos de horário (RN-01) são destacados em coral no formulário.

<div align="center">
<img width="820" alt="Tela de gestão de reservas" src="img/admin/bookings.png" />
</div>

<br>

### Relatórios de ocupação
Horários de pico por espaço, com filtro por ano/mês.

<div align="center">
<img width="820" alt="Tela de relatórios de ocupação" src="img/admin/reports.png" />
</div>

<br>

### Usuários
Gestão de acessos ao sistema (criar, editar e excluir), com salvaguardas de perfil (o gestor não exclui a si mesmo nem altera o próprio perfil).

<div align="center">
<img width="820" alt="Tela de gestão de usuários" src="img/admin/users.png" />
</div>

<br>

### Navegação mobile
Abaixo de `lg`, a barra lateral vira um **drawer** acessível, aberto por um botão hambúrguer.

<div align="center">
<img width="300" alt="Navegação mobile do painel — drawer" src="img/admin/mobile-drawer.png" />
</div>
