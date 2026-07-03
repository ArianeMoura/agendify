# Testes de Sistema no Backend

No contexto do Back-end do **Agendify**, os Testes de Sistema são validações automatizadas de ponta a ponta (End-to-End) que interagem diretamente com a API exposta. Diferente dos Testes Unitários (que testam métodos isolados) e dos Testes de Integração (que testam a camada de Serviços com o Banco de Dados), os Testes de Sistema validam a pilha completa da aplicação via requisições HTTP.

Eles garantem que:
1. Os Controllers recebem as requisições corretamente.
2. A Injeção de Dependência está configurada.
3. As regras de negócio (validadas nos testes unitários) retornam os códigos HTTP corretos (200, 400, 404, 500).
4. A persistência no banco de dados ocorre conforme esperado.

O objetivo destes testes é simular o comportamento real dos aplicativos Front-end (Web e Mobile) consumindo a API, garantindo que fluxos complexos de negócio — como a tentativa de reserva em horário conflitante — resultem nas respostas adequadas para o usuário final.

## Configuração do Ambiente de Testes 

Para a execução dos testes de sistema em .NET, utilizamos a biblioteca `Microsoft.AspNetCore.Mvc.Testing.` Ela permite criar um servidor de teste em memória (TestServer) que sobe a aplicação Agendify inteira, permitindo chamadas HTTP reais sem a necessidade de hospedar a API externamente.

**Tecnologias Utilizadas:**

**Framework:** .NET 9.0 </br>
**Test Runner:** xUnit </br>
**Client Simulator:** `WebApplicationFactory<Program>` </br>
**Banco de Dados:** MongoDB Atlas </br>

**Estrutura do Projeto de Testes:**

    
    tests/
    └── Agendify.SystemTests/
    ├── Setup/
    │   └── CustomWebApplicationFactory.cs  # Configura o servidor de teste
    ├── Scenarios/
    │   ├── Bookings.cs            # Fluxos de Reservas
    │   └── Spaces.cs              # Fluxos de Espaços
    └── Utils/
        └── HttpHelper.cs                   # Auxiliares para JSON  
    

## Cenários de Teste de Sistema

Baseado nos testes unitários (lógica de `IsSpaceAvailable`) e de integração (CRUD) já existentes, definimos os seguintes cenários críticos que cobrem os fluxos principais do sistema.

**Cenário 1: Fluxo Completo de Realização de Reserva**

**Objetivo:** Validar se um usuário consegue criar um espaço e, em seguida, realizar uma reserva com sucesso através dos endpoints da API.

**Passos do Teste:**
1. Requisição POST /api/spaces: Cadastra um novo espaço "Auditório Principal".
2. Verificação: Confirma se retornou HTTP 201 (Created) e captura o ID do espaço.
3. Requisição POST /api/bookings: Envia um payload de reserva para o espaço criado.
4. Verificação: Confirma se retornou HTTP 201 (Created).
5. Requisição GET /api/bookings/{id}: Busca a reserva criada.
6. Verificação Final: Garante que os dados retornados via API correspondem aos enviados.

**Implementação (C#):**

```csharp
public async Task Flow_CreateSpaceAndBooking_ShouldReturnSuccess()
{
    var client = _factory.CreateClient();

    var spacePayload = new Space { 
        Name = "Auditório System Test", 
        Capacity = 50, 
        Availability = true 
    };
    var spaceResponse = await client.PostAsJsonAsync("/api/spaces", spacePayload);
    spaceResponse.EnsureSuccessStatusCode();
    var createdSpace = await spaceResponse.Content.ReadFromJsonAsync<Space>();

    var bookingPayload = new Booking {
        UserId = "user_sys_test_01",
        SpaceId = createdSpace.Id, 
        StartDateTime = DateTime.UtcNow.AddDays(2),
        EndDateTime = DateTime.UtcNow.AddDays(2).AddHours(4)
    };
    var bookingResponse = await client.PostAsJsonAsync("/api/bookings", bookingPayload);

    Assert.Equal(HttpStatusCode.Created, bookingResponse.StatusCode);
    
    var createdBooking = await bookingResponse.Content.ReadFromJsonAsync<Booking>();
    Assert.NotNull(createdBooking.Id);
    Assert.Equal(createdSpace.Id, createdBooking.SpaceId);
}
```

**Cenário 2: Validação de Regras de Negócio via API (Conflito de Horário)**

**Objetivo:** Garantir que a lógica testada unitariamente no método IsSpaceAvailable está protegendo corretamente a API. O sistema não pode permitir duas reservas no mesmo horário via endpoint, retornando um erro amigável (HTTP 400 ou 409).

**Passos do Teste:**
1. Criar um Espaço via API.
2. Realizar uma reserva ("Reserva A") das 14:00 às 16:00.
3. Tentar realizar uma segunda reserva ("Reserva B") das 15:00 às 17:00 (Conflito).
4. Resultado Esperado: A API deve retornar HTTP 400 Bad Request ou HTTP 409 Conflict com a mensagem de erro apropriada.

**Implementação (C#):**

```csharp
public async Task Flow_BookingConflict_ShouldReturnBadRequest()
{
    var client = _factory.CreateClient();
    
    var space = await CreateSpaceAsync(client); 

    var bookingA = new Booking {
        SpaceId = space.Id,
        StartDateTime = DateTime.UtcNow.AddDays(5).AddHours(14),
        EndDateTime = DateTime.UtcNow.AddDays(5).AddHours(16)
    };

    var bookingB = new Booking {
        SpaceId = space.Id,
        StartDateTime = DateTime.UtcNow.AddDays(5).AddHours(15), 
        EndDateTime = DateTime.UtcNow.AddDays(5).AddHours(17)
    };

    var responseA = await client.PostAsJsonAsync("/api/bookings", bookingA);
    var responseB = await client.PostAsJsonAsync("/api/bookings", bookingB);

    Assert.Equal(HttpStatusCode.Created, responseA.StatusCode); 
    
    Assert.Equal(HttpStatusCode.BadRequest, responseB.StatusCode); 
    
    var errorContent = await responseB.Content.ReadAsStringAsync();
    Assert.Contains("conflito", errorContent.ToLower());
}
```

**Cenário 3: Ciclo de Vida do Espaço (Gestão de Espaços)**

**Objetivo:** Verificar se a alteração de status de um espaço reflete imediatamente na capacidade de realizar reservas.

**Passos do Teste:**
1. Criar um Espaço disponível (Availability = true).
2. Atualizar o Espaço via PUT para indisponível (Availability = false).
3. Tentar criar uma reserva para este espaço.
4. **Resultado Esperado:** A API deve rejeitar a reserva, pois o espaço foi "desativado" administrativamente.

**Implementação (C#):**

```csharp
public async Task Flow_DisabledSpace_ShouldBlockNewBookings()
{

    var client = _factory.CreateClient();
    var space = await CreateSpaceAsync(client); 

    space.Availability = false;
    var updateResponse = await client.PutAsJsonAsync($"/api/spaces/{space.Id}", space);
    updateResponse.EnsureSuccessStatusCode();

    var booking = new Booking {
        SpaceId = space.Id,
        StartDateTime = DateTime.UtcNow.AddDays(1),
        EndDateTime = DateTime.UtcNow.AddDays(1).AddHours(1)
    };
    var bookingResponse = await client.PostAsJsonAsync("/api/bookings", booking);

    Assert.Equal(HttpStatusCode.BadRequest, bookingResponse.StatusCode);
    
    var errorMsg = await bookingResponse.Content.ReadAsStringAsync();
    Assert.Contains("não está disponível", errorMsg);
}
```

## Matriz de Cobertura dos Testes de Sistema

Abaixo, relacionamos os testes de sistema propostos com os componentes que eles validam integralmente.

| ID | Cenário de Teste | Componentes Envolvidos | Status HTTP Esperado |
| :--- | :--- | :--- | :--- |
| **TS-01** | Criação de Espaço e Reserva (Caminho Feliz) | `SpacesController` -> `BookingsController` -> `DB` | 201 (Created) |
| **TS-02** | Tentativa de Reserva com Conflito de Horário | `BookingsController` -> `Services (Lógica)` -> `DB` | 400 (Bad Request) |
| **TS-03** | Tentativa de Reserva em Espaço Desativado | `SpacesController (Update)` -> `BookingsController` | 400 (Bad Request) |
| **TS-04** | Consulta de Histórico de Reservas | `BookingsController (Get)` -> `DB` | 200 (OK) |
| **TS-05** | Exclusão de Reserva e Liberação de Horário | `BookingsController (Delete)` -> `Create (Novo)` | 204 -> 201 |

## Conclusão

A implementação dos Testes de Sistema complementa a estratégia de qualidade do Agendify.

1. Os **Testes Unitários** já garantiram que a lógica matemática de sobreposição de datas está correta.
2. Os **Testes de Integração** garantiram que o objeto é salvo no MongoDB corretamente.
3. Os **Testes de Sistema** (documentados aqui) garantem que a API responde corretamente às requisições HTTP, tratando erros e conectando todos os pontos.

Com a execução desta suíte (dotnet test), garantimos que o back-end está pronto para ser consumido pelos aplicativos Web e Mobile com segurança e estabilidade.
