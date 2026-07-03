# Arquitetura da Solução

<br>

<div align="center">
<img width="800" alt="agendify-arch" src="https://github.com/user-attachments/assets/bab45620-af3e-41f2-b982-700e34355752" />
</div>

<h4 align="center">FIGURA 18 - Fluxo de Interação do Usuário com o Sistema</h4>

## Diagrama de Classes

O diagrama de classes ilustra graficamente como é a estrutura do software e
como cada uma das classes da sua estrutura se interliga. Essas classes
servem de modelo para materializar os objetos que executam na memória.

<div align="center">
<img width="800" alt="agendify-architecture" src="https://github.com/user-attachments/assets/8a4f1fc2-fedd-4d8a-b8a5-31a2bde55a31" />
</div>

<h4 align="center">FIGURA 19</h4>

## Documentação do Banco de Dados MongoDB

Este documento descreve a estrutura e o esquema do banco de dados não relacional
utilizado por nosso projeto, baseado em MongoDB. O MongoDB é um banco de dados
NoSQL que armazena dados em documentos JSON (ou BSON, internamente), permitindo
uma estrutura flexível e escalável para armazenar e consultar dados.

## Esquema do Banco de Dados

### Coleção: users

Armazena as informações dos usuários do sistema.

#### Estrutura do Documento

```json
{
    "_id": "ObjectId('5f7e1bbf9b2a4f1a9c38b9a1')",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "passwordHash": "hash_da_senha",
    "roles": ["admin", "user"],
    "createdAt": "2024-08-29T10:00:00Z",
    "updatedAt": "2024-08-29T12:00:00Z"
}
```

#### Descrição dos Campos

> - <strong>_id:</strong> Identificador único do usuário gerado automaticamente
>   pelo MongoDB.
> - <strong>name:</strong> Nome completo do usuário.
> - <strong>email:</strong> Endereço de email do usuário.
> - <strong>passwordHash:</strong> Hash da senha do usuário.
> - <strong>roles:</strong> Lista de papéis atribuídos ao usuário (por exemplo,
>   admin, user).
> - <strong>createdAt:</strong> Data e hora de criação do usuário.
> - <strong>updatedAt:</strong> Data e hora da última atualização dos dados do
>   usuário.

### Coleção: spaces

Armazena as informações dos espaços disponíveis no condomínio que podem ser
reservados pelos usuários.

#### Estrutura do Documento

```json
{
    "_id": "ObjectId('60b8d6d2f1c2a2a9e4d1b2a3')",
    "name": "Salão de Festas",
    "description": "Espaço amplo para eventos e comemorações.",
    "capacity": 50,
    "resources": [
        {
            "_id": "ObjectId('60b8d7e3f1c2a2a9e4d1b2a4')",
            "name": "Cadeiras",
            "description": "Cadeiras dobráveis confortáveis.",
            "quantity": 20
        }
    ],
    "availableHours": ["08:00-12:00", "14:00-22:00"],
    "availability": true,
    "createdAt": "2024-09-01T12:00:00Z",
    "updatedAt": "2024-09-05T14:30:00Z"
}
```

#### Descrição dos Campos

> - **_id:** Identificador único do espaço gerado automaticamente pelo MongoDB.  
> - **name:** Nome do espaço (ex.: Salão de Festas, Churrasqueira, Piscina).  
> - **description:** Breve descrição do espaço e sua finalidade.  
> - **capacity:** Capacidade máxima de pessoas permitida no espaço.  
> - **resources:** Lista de recursos disponíveis no espaço (ex.: cadeiras, mesas, projetor).  
> - **availableHours:** Lista de faixas de horário disponíveis para reserva do espaço.  
> - **availability:** Indica se o espaço está disponível para reservas (`true` ou `false`).  
> - **createdAt:** Data e hora de criação do registro do espaço.  
> - **updatedAt:** Data e hora da última atualização dos dados do espaço.

### Coleção: bookings  
Registra todas as reservas realizadas pelos usuários nos espaços do condomínio.

#### Estrutura do Documento

```json
{
  "_id": "ObjectId('60b8d8f4f1c2a2a9e4d1b2a5')",
  "userId": "ObjectId('5f7e1bbf9b2a4f1a9c38b9a1')",
  "spaceId": "ObjectId('60b8d6d2f1c2a2a9e4d1b2a3')",
  "startDateTime": "2024-09-10T14:00:00Z",
  "endDateTime": "2024-09-10T18:00:00Z",
  "createdAt": "2024-09-01T13:00:00Z",
  "updatedAt": "2024-09-02T15:30:00Z"
}
```

#### Descrição dos Campos
> - **_id:** Identificador único da reserva gerado automaticamente pelo MongoDB.  
> - **userId:** Referência ao usuário que realizou a reserva.  
> - **spaceId:** Referência ao espaço reservado.  
> - **startDateTime:** Data e hora de início da reserva.  
> - **endDateTime:** Data e hora de término da reserva.  
> - **createdAt:** Data e hora em que a reserva foi criada.  
> - **updatedAt:** Data e hora da última atualização dos dados da reserva.

### Coleção: resources  
Armazena os recursos disponíveis nos espaços do condomínio.

#### Estrutura do Documento

```json
{
  "_id": "ObjectId('60b8d7e3f1c2a2a9e4d1b2a4')",
  "name": "Cadeiras",
  "description": "Cadeiras dobráveis confortáveis para eventos.",
  "quantity": 20,
  "createdAt": "2024-09-01T11:30:00Z",
  "updatedAt": "2024-09-03T10:00:00Z"
}
```

#### Descrição dos Campos
> - **_id:** Identificador único do recurso gerado automaticamente pelo MongoDB.  
> - **name:** Nome do recurso disponível (ex.: cadeiras, mesas, projetores).  
> - **description:** Descrição detalhada do recurso.  
> - **quantity:** Quantidade total disponível desse recurso.  
> - **createdAt:** Data e hora de criação do registro do recurso.  
> - **updatedAt:** Data e hora da última atualização dos dados do recurso.

## Relações entre as Coleções

Embora o MongoDB seja um banco de dados não relacional, as coleções deste sistema se relacionam por meio de **referências entre IDs**, garantindo integridade e coerência dos dados.

### users ↔ bookings  
Cada reserva (`booking`) é sempre associada a um usuário (`user`).

```json
{
  "_id": "ObjectId('60b8d8f4f1c2a2a9e4d1b2a5')",
  "userId": "ObjectId('5f7e1bbf9b2a4f1a9c38b9a1')",
  "spaceId": "ObjectId('60b8d6d2f1c2a2a9e4d1b2a3')",
  "startDateTime": "2024-09-10T14:00:00Z",
  "endDateTime": "2024-09-10T18:00:00Z"
}
```

### spaces ↔ bookings  
Cada reserva também referencia um espaço (`space`) que foi reservado.

```json
{
  "_id": "ObjectId('60b8d8f4f1c2a2a9e4d1b2a5')",
  "userId": "ObjectId('5f7e1bbf9b2a4f1a9c38b9a1')",
  "spaceId": "ObjectId('60b8d6d2f1c2a2a9e4d1b2a3')",
  "startDateTime": "2024-09-10T14:00:00Z",
  "endDateTime": "2024-09-10T18:00:00Z"
}
```

### spaces ↔ resources  
Cada espaço (`space`) pode conter uma lista de recursos (`resources`) disponíveis.

```json
{
  "_id": "ObjectId('60b8d6d2f1c2a2a9e4d1b2a3')",
  "name": "Salão de Festas",
  "resources": [
    {
      "_id": "ObjectId('60b8d7e3f1c2a2a9e4d1b2a4')",
      "name": "Cadeiras",
      "quantity": 20
    },
    {
      "_id": "ObjectId('60b8d7e3f1c2a2a9e4d1b2a5')",
      "name": "Mesas",
      "quantity": 5
    }
  ]
}
```

## Resumo

| Coleção      | Finalidade Principal                                | Relacionamentos                        |
|--------------|------------------------------------------------------|----------------------------------------|
| **users**     | Armazena dados dos usuários.                        | Relaciona-se com `bookings`            |
| **spaces**    | Representa os espaços disponíveis no condomínio.    | Relaciona-se com `bookings` e `resources` |
| **resources** | Armazena recursos disponíveis nos espaços.          | Relaciona-se com `spaces`              |
| **bookings**  | Registra reservas feitas por usuários.              | Relaciona-se com `users` e `spaces`    |


## Tecnologias Utilizadas

Para o desenvolvimento do Agendify, uma solução para gerenciamento de espaços, utilizamos um conjunto de tecnologias modernas que garantem eficiência, escalabilidade e uma experiência de usuário fluida. A seguir, apresentamos as **principais ferramentas** e **tecnologias** adotadas, abrangendo desde o design do aplicativo até a estrutura de banco de dados e o back-end da solução:

> **ASP.NET (Razor Pages)**: Razor Pages é um recurso do ASP.NET Core para construir aplicações web orientadas a páginas usando a sintaxe Razor (HTML + C#).

> **React Native:**  Framework utilizado para o desenvolvimento do aplicativo mobile, permitindo a criação de interfaces nativas para Android e iOS a partir de um único código, proporcionando uma experiência fluida e responsiva.

> **C# / .NET (ASP.NET Core)**: Framework de desenvolvimento backend baseado na linguagem C#. Utilizado para construir APIs e serviços no lado do servidor, oferecendo desempenho, escalabilidade e suporte a operações assíncronas.

> **MongoDB:** Banco de dados NoSQL orientado a documentos, utilizado para armazenamento e gerenciamento de informações de forma flexível e escalável, garantindo segurança, integridade e eficiência no tratamento dos dados

> **Docker:** Utilizado para containerização da aplicação, garantindo que o ambiente de desenvolvimento e produção sejam consistentes e permitindo que o aplicativo seja executado em diferentes sistemas operacionais, incluindo Windows, macOS e Linux, sem conflitos de dependências.

> **Expo:** Ferramenta que facilita o desenvolvimento e a visualização do aplicativo durante a fase de prototipação e testes.

#### Ferramentas e IDEs

> **Figma:** Utilizado para o design da interface e criação dos protótipos interativos, permitindo uma melhor experiência na fase de planejamento visual.

> **Visual Studio Code (VSCode):** IDE principal utilizada no desenvolvimento do Agendify, oferecendo suporte para JavaScript, TypeScript e ferramentas de controle de versão.

> **Git e GitHub:** Plataforma para versionamento de código e colaboração entre os desenvolvedores, garantindo um fluxo de trabalho organizado e seguro.

## Qualidade de Software

A qualidade de software pode ser definida como um conjunto de características que garantem que um produto atenda às expectativas dos usuários e stakeholders. Para assegurar um alto nível de qualidade no desenvolvimento do Agendify, um sistema de reservas de espaços em condomínios, utilizamos como base a norma internacional **ISO/IEC 25010**, que define características e subcaracterísticas essenciais para um software confiável, eficiente e intuitivo. As subcaracterísticas selecionadas e suas respectivas justificativas são apresentadas a seguir:

**1. Adequação Funcional**

- **Completude Funcional:** O Agendify deve atender plenamente às necessidades dos usuários, garantindo que todas as funcionalidades de reserva e gerenciamento de espaços sejam implementadas.

- **Correção Funcional:** O processamento de disponibilidade, conflitos de agendamento e regras de uso deve ser exato, evitando inconsistências que possam comprometer a confiabilidade das informações.

**2. Segurança**

- **Confidencialidade e Integridade:** Como o aplicativo lida com dados pessoais dos usuários e registros de reservas, é essencial garantir proteção contra acessos não autorizados e vazamento de informações.

- **Autenticidade:** O sistema deve assegurar que cada ação seja atribuída a um usuário devidamente autenticado, apoiando auditoria e responsabilização.

**3. Confiabilidade**

- **Maturidade:** O Agendify deve ser testado rigorosamente para minimizar falhas e evitar interrupções no serviço.

- **Disponibilidade:** O aplicativo precisa garantir um tempo de atividade elevado para que os usuários possam acessá-lo sempre que necessário.

- **Tolerância a Falhas:** Em caso de falhas ou erros, o sistema deve ser capaz de se recuperar rapidamente, minimizando impactos para o usuário.

**4. Usabilidade**

- **Apreensibilidade:** A interface do Agendify deve ser intuitiva, facilitando o aprendizado e a navegação para usuários com diferentes níveis de experiência.

- **Operacionalidade:** O aplicativo deve proporcionar uma experiência fluida, garantindo interações simples e eficientes.

- **Acessibilidade:** Deve-se garantir que o app seja utilizável por pessoas com diferentes necessidades, incluindo suporte para acessibilidade digital.

**5. Eficiência de Desempenho**

- **Tempo de Resposta:** O Agendify deve apresentar respostas rápidas nas interações, evitando lentidões que possam prejudicar a experiência do usuário.

- **Utilização de Recursos:** A aplicação deve ser otimizada para consumir o mínimo de recursos do dispositivo, garantindo um funcionamento eficiente sem sobrecarga de processamento ou memória.

**6. Manutenibilidade**

- **Modularidade:** A estrutura do código deve ser organizada de forma modular, permitindo a implementação e atualização de funcionalidades sem comprometer o restante do sistema.

- **Reusabilidade:** O código deve ser escrito de maneira reutilizável, facilitando a expansão futura do aplicativo.

- **Analisabilidade:** O sistema deve permitir diagnósticos rápidos para identificar falhas e otimizar o processo de correção de erros.

**7. Portabilidade**

- **Adaptabilidade:** O Agendify deve ser compatível com diferentes dispositivos móveis e sistemas operacionais, proporcionando uma experiência consistente.

- **Instalabilidade:** A instalação e atualização do aplicativo devem ser simples e diretas, minimizando dificuldades para os usuários.

**Métricas para Avaliação da Qualidade**

Para garantir que as subcaracterísticas selecionadas sejam atendidas, algumas métricas são utilizadas:

- *Índice de satisfação do usuário:* Coletada por meio de feedbacks e avaliações na loja de aplicativos.
- *Taxa de erros funcionais e falhas:* Avalia a frequência de falhas críticas e erros reportados pelos usuários.
- *Tempo médio de resposta:* Mede o tempo necessário para carregar telas e processar ações dos usuários.
- *Tempo médio entre falhas (MTBF):* Verifica a estabilidade do sistema ao longo do tempo.
- *Índice de usabilidade (SUS - System Usability Scale):* Avaliação da experiência do usuário com base em testes práticos e feedbacks.
- *Número de incidentes de segurança:* Registra tentativas de acesso não autorizado e vulnerabilidades identificadas.
- *Tempo médio de recuperação:* Mede o tempo necessário para restaurar o sistema após uma falha.
- *Consumo de Recursos:* Monitoramento da utilização e memória do dispositivo.
- *Taxa de Acessibilidade:* Percentual de conformidade com diretrizes de acessibilidade.

Ao adotar essas práticas e o monitoramento contínuo dessas métricas, o Agendify busca um alto padrão de qualidade, proporcionando aos usuários uma experiência confiável, segura e eficiente na gestão de reservas.

## Hospedagem

A aplicação foi implantada em um ambiente de demonstração no **Azure App Service** (API e Web) durante o desenvolvimento. Esse ambiente foi **descontinuado**, e a documentação da API (Swagger) e as interfaces Web/Mobile passam a ser executadas localmente.

Para execução local, o projeto disponibiliza um `docker-compose.yml` (ver diretório `docker/`) que sobe a API, o banco de dados MongoDB e os serviços de apoio. As instruções de execução estão no [Código Fonte](../src/README.md).

> As credenciais de acesso de demonstração (perfis de administrador e usuário) são fornecidas sob solicitação e devem ser configuradas via *seed* local — não são versionadas no repositório por segurança.

