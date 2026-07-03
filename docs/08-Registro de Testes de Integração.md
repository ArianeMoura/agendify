# Testes de Integração no Backend - Agendify

## O que são Testes de Integração?

Testes de integração verificam se diferentes componentes do sistema funcionam
corretamente quando integrados, testando a interação entre classes, banco de
dados e serviços. No Agendify, testamos as operações CRUD com o MongoDB.

## Configuração Rápida

**Tecnologias:**

- .NET 9.0 + NUnit 4.2.2
- MongoDB — execução local via Docker (banco: `test-agendify`)

**Estrutura:**

```
src/
├── api/
│   ├── Services/ (BookingsService.cs, SpacesService.cs)
│   └── Models/ (Booking.cs, Space.cs)
└── api.Tests/
    └── Services/ (BookingsServiceTests.cs, SpacesServiceTests.cs)
```

## Executar os Testes

```bash
# Todos os testes
cd src/api.Tests
dotnet test

# Com cobertura de código (relatório em HTML)
./generate-coverage.sh
```

## Exemplos de Testes CRUD

### 1. Bookings - CREATE (Criar Reserva)

```csharp
[Test]
public async Task Create_ShouldAddNewBooking_WithGeneratedId()
{
    
    var newBooking = new Booking
    {
        UserId = "507f1f77bcf86cd799439011",
        SpaceId = "507f1f77bcf86cd799439021",
        StartDateTime = DateTime.UtcNow.AddDays(5),
        EndDateTime = DateTime.UtcNow.AddDays(5).AddHours(2)
    };

    
    await _bookingsService.Create(newBooking);

    
    Assert.That(newBooking.Id, Is.Not.Null);
    var addedBooking = await _bookingsCollection.Find(b => b.Id == newBooking.Id).FirstOrDefaultAsync();
    Assert.That(addedBooking!.UserId, Is.EqualTo("507f1f77bcf86cd799439011"));
}
```

### 2. Bookings - READ (Consultar Reserva)

```csharp
[Test]
public async Task GetById_ShouldReturnBookingWithUserAndSpace_WhenBookingExists()
{
    
    var bookingId = "507f1f77bcf86cd799439031";

    
    var result = await _bookingsService.GetById(bookingId);

    
    Assert.That(result, Is.Not.Null);
    Assert.That(result.User.Name, Is.EqualTo("João Silva"));
    Assert.That(result.Space.Name, Is.EqualTo("Sala de Conferência A"));
}
```

### 3. Bookings - UPDATE (Atualizar Reserva)

```csharp
[Test]
public async Task Update_ShouldModifyExistingBooking_WhenBookingExists()
{
    
    var bookingId = "507f1f77bcf86cd799439031";
    var updatedBooking = new Booking
    {
        Id = bookingId,
        UserId = "507f1f77bcf86cd799439011",
        SpaceId = "507f1f77bcf86cd799439021",
        StartDateTime = DateTime.UtcNow.AddDays(10),
        EndDateTime = DateTime.UtcNow.AddDays(10).AddHours(3)
    };

    
    await _bookingsService.Update(bookingId, updatedBooking);

    
    var booking = await _bookingsCollection.Find(b => b.Id == bookingId).FirstOrDefaultAsync();
    Assert.That(booking!.StartDateTime.Date, Is.EqualTo(updatedBooking.StartDateTime.Date));
}
```

### 4. Bookings - DELETE (Excluir Reserva)

```csharp
[Test]
public async Task Delete_ShouldRemoveBooking_WhenBookingExists()
{
    
    var bookingId = "507f1f77bcf86cd799439031";

    
    await _bookingsService.Delete(bookingId);

    
    var deletedBooking = await _bookingsCollection.Find(b => b.Id == bookingId).FirstOrDefaultAsync();
    Assert.That(deletedBooking, Is.Null);
}
```

### 5. Spaces - CREATE (Criar Espaço)

```csharp
[Test]
public async Task Create_ShouldAddNewSpace_WithGeneratedId()
{
    
    var newSpace = new Space
    {
        Name = "Nova Sala de Treinamento",
        Description = "Sala para treinamentos",
        Capacity = 15,
        Availability = true
    };

    
    await _spacesService.Create(newSpace);

    
    Assert.That(newSpace.Id, Is.Not.Null);
    var addedSpace = await _spacesCollection.Find(s => s.Id == newSpace.Id).FirstOrDefaultAsync();
    Assert.That(addedSpace!.Name, Is.EqualTo("Nova Sala de Treinamento"));
}
```

### 6. Spaces - READ (Consultar Espaço)

```csharp
[Test]
public async Task GetById_ShouldReturnSpaceWithResources_WhenSpaceExists()
{
    
    var spaceId = "607f1f77bcf86cd799439051";

    
    var result = await _spacesService.GetById(spaceId);

    
    Assert.That(result, Is.Not.Null);
    Assert.That(result.Name, Is.EqualTo("Sala de Conferência A"));
    Assert.That(result.Resources.Count, Is.EqualTo(2));
}
```

### 7. Spaces - UPDATE (Atualizar Espaço)

```csharp
[Test]
public async Task Update_ShouldModifyExistingSpace_WhenSpaceExists()
{
    
    var spaceId = "607f1f77bcf86cd799439051";
    var updatedSpace = new Space
    {
        Id = spaceId,
        Name = "Sala de Conferência A - Atualizada",
        Description = "Descrição atualizada",
        Capacity = 25,
        Availability = false
    };

    
    await _spacesService.Update(spaceId, updatedSpace);

    
    var space = await _spacesCollection.Find(s => s.Id == spaceId).FirstOrDefaultAsync();
    Assert.That(space!.Name, Is.EqualTo("Sala de Conferência A - Atualizada"));
    Assert.That(space.Capacity, Is.EqualTo(25));
}
```

### 8. Spaces - DELETE (Excluir Espaço)

```csharp
[Test]
public async Task Delete_ShouldRemoveSpace_WhenSpaceExists()
{
    
    var spaceId = "607f1f77bcf86cd799439051";

    
    await _spacesService.Delete(spaceId);

    
    var deletedSpace = await _spacesCollection.Find(s => s.Id == spaceId).FirstOrDefaultAsync();
    Assert.That(deletedSpace, Is.Null);
}
```

## Estrutura Básica de Teste

### Setup e Teardown

```csharp
[SetUp]
public void Setup()
{
    _bookingsCollection.DeleteMany(Builders<Booking>.Filter.Empty);
    _usersCollection.DeleteMany(Builders<User>.Filter.Empty);
    _spacesCollection.DeleteMany(Builders<Space>.Filter.Empty);
    
    SeedTestData();
}

[TearDown]
public void TearDown()
{
    _bookingsCollection.DeleteMany(Builders<Booking>.Filter.Empty);
}
```

## Resumo dos Testes

**Total: 32 testes de integração** (os 8 exemplos acima ilustram os principais casos CRUD; a suíte completa cobre os demais).

| Serviço  | CREATE | READ | UPDATE | DELETE | Validações | Subtotal |
| -------- | ------ | ---- | ------ | ------ | ---------- | -------- |
| Bookings | 3      | 3    | 2      | 2      | 2          | 12       |
| Spaces   | 5      | 6    | 3      | 3      | 3          | 20       |