# Testes Unitários no Backend

## Método IsSpaceAvailable

O método `IsSpaceAvailable` é responsável por verificar se um espaço está disponível para reserva em um determinado período de tempo. Este método é crucial para o sistema Agendify, pois garante que não haverá conflitos de agendamento.

### Implementação do Método

```csharp
public async Task<bool> IsSpaceAvailable(Booking booking)
{
    var space = await _spacesCollection
        .Find(x => x.Id == booking.SpaceId)
        .FirstOrDefaultAsync() 
        ?? throw new InvalidOperationException($"O espaço com ID {booking.SpaceId} não foi encontrado.");

    if (!space.Availability)
    {
        throw new InvalidOperationException($"O espaço '{space.Name}' não está disponível para reservas no momento.");
    }

    if (booking.StartDateTime >= booking.EndDateTime)
    {
        throw new InvalidOperationException("A data de início deve ser anterior à data de término.");
    }

    var existingBookings = await _bookingsCollection
        .Find(x => x.SpaceId == booking.SpaceId)
        .ToListAsync();

    var hasConflict = existingBookings.Any(existing =>
        booking.StartDateTime < existing.EndDateTime &&
        booking.EndDateTime > existing.StartDateTime
    );

    return !hasConflict;
}
```

### Casos de Teste Implementados

#### 1. IsSpaceAvailable_ShouldReturnTrue_WhenSpaceIsAvailableAndNoConflicts

**Objetivo**: Verificar se o método retorna `true` quando o espaço está disponível e não há conflitos de horário.

**Cenário**: Uma nova reserva é solicitada para um espaço que está marcado como disponível e não possui nenhuma reserva conflitante no período solicitado.

**Implementação**:

```csharp
[Test]
public async Task IsSpaceAvailable_ShouldReturnTrue_WhenSpaceIsAvailableAndNoConflicts()
{
    var newBooking = new Booking
    {
        UserId = "507f1f77bcf86cd799439011",
        SpaceId = "507f1f77bcf86cd799439021",
        StartDateTime = DateTime.UtcNow.AddDays(10), 
        EndDateTime = DateTime.UtcNow.AddDays(10).AddHours(2)  
    };

    var result = await _bookingsService.IsSpaceAvailable(newBooking);

    Assert.That(result, Is.True, "O espaço deveria estar disponível para este horário");
}
```

**Explicação Detalhada**:

- **Preparação**: Cria um objeto `Booking` com dados válidos. A reserva é agendada para 10 dias no futuro, garantindo que não haja conflito com as reservas de teste pré-existentes (que estão agendadas para 1, 2 e 3 dias no futuro).
- **Ação**: Chama o método `IsSpaceAvailable` passando a nova reserva como parâmetro.
- **Verificação**: Confirma que o método retorna `true`, indicando que o espaço está disponível no horário solicitado.

**Resultado Esperado**: O teste deve passar, retornando `true`, pois:
- O espaço existe no banco de dados
- O espaço está marcado como disponível (`Availability = true`)
- As datas são válidas (início antes do fim)
- Não há reservas conflitantes nesse período

---

#### 2. IsSpaceAvailable_ShouldReturnFalse_WhenSpaceHasConflictingBooking

**Objetivo**: Verificar se o método retorna `false` quando há uma reserva existente que conflita com o horário solicitado.

**Cenário**: Uma nova reserva é solicitada para um espaço que já possui uma reserva no mesmo período, causando sobreposição de horários.

**Implementação**:

```csharp
[Test]
public async Task IsSpaceAvailable_ShouldReturnFalse_WhenSpaceHasConflictingBooking()
{
    var conflictingBooking = new Booking
    {
        UserId = "507f1f77bcf86cd799439012",
        SpaceId = "507f1f77bcf86cd799439021",
        StartDateTime = DateTime.UtcNow.AddDays(1).AddHours(1),
        EndDateTime = DateTime.UtcNow.AddDays(1).AddHours(3)
    };

    var result = await _bookingsService.IsSpaceAvailable(conflictingBooking);

    Assert.That(result, Is.False, "O espaço não deveria estar disponível devido a conflito de horário");
}
```

**Explicação Detalhada**:

- **Preparação**: Cria um objeto `Booking` que propositalmente conflita com uma reserva existente. No método `SeedTestData()`, existe uma reserva para o espaço "507f1f77bcf86cd799439021" que vai de `DateTime.UtcNow.AddDays(1)` até `DateTime.UtcNow.AddDays(1).AddHours(2)`. A nova reserva começa 1 hora depois do início da reserva existente e termina 1 hora depois do fim dela, criando uma sobreposição.
- **Ação**: Chama o método `IsSpaceAvailable` para verificar a disponibilidade.
- **Verificação**: Confirma que o método retorna `false`, indicando corretamente que há um conflito de horário.

**Resultado Esperado**: O teste deve passar, retornando `false`, pois:
- Reserva existente: Dia 1, das 00:00 às 02:00
- Nova reserva: Dia 1, das 01:00 às 03:00
- Há sobreposição entre 01:00 e 02:00

**Lógica de Detecção de Conflito**:
O método utiliza a seguinte condição para detectar conflitos:
```csharp
booking.StartDateTime < existing.EndDateTime &&
booking.EndDateTime > existing.StartDateTime
```
Esta lógica captura todos os cenários de sobreposição possíveis.

---

### Outros Testes do Método IsSpaceAvailable

#### 3. IsSpaceAvailable_ShouldReturnFalse_WhenNewBookingEngulfsExistingBooking
Verifica se o método detecta corretamente quando uma nova reserva "engloba" completamente uma reserva existente (começa antes e termina depois). Este teste garante que reservas que cobrem completamente outras reservas sejam identificadas como conflitantes.

#### 4. IsSpaceAvailable_ShouldReturnFalse_WhenExistingBookingEngulfsNewBooking
Testa o cenário inverso: quando uma reserva existente engloba completamente a nova reserva. Garante que não seja possível criar reservas dentro do período de outra reserva já existente.

#### 5. IsSpaceAvailable_ShouldReturnTrue_WhenBookingEndsExactlyWhenAnotherStarts
Valida um caso limite importante: quando uma reserva termina exatamente no momento em que outra começa. Este teste confirma que reservas adjacentes (sem sobreposição real) são permitidas, otimizando o uso dos espaços.

#### 6. IsSpaceAvailable_ShouldThrowException_WhenSpaceDoesNotExist
Testa a validação de existência do espaço. Garante que o método lance uma `InvalidOperationException` com mensagem apropriada quando se tenta reservar um espaço que não existe no banco de dados.

#### 7. IsSpaceAvailable_ShouldThrowException_WhenSpaceIsNotAvailable
Verifica se o método impede reservas em espaços que estão marcados como indisponíveis (`Availability = false`). Este teste é importante para cenários como manutenção ou desativação temporária de espaços.

#### 8. IsSpaceAvailable_ShouldThrowException_WhenStartDateIsAfterEndDate
Testa a validação de datas lógicas. Garante que não seja possível criar reservas onde a data de início é posterior à data de término, o que seria uma inconsistência lógica.

#### 9. IsSpaceAvailable_ShouldThrowException_WhenStartDateEqualsEndDate
Valida outro caso limite de datas: quando início e fim são iguais. Reservas com duração zero não fazem sentido no contexto do negócio e devem ser rejeitadas.

#### 10. IsSpaceAvailable_ShouldReturnTrue_WhenMultipleSpacesAndNoConflictForTargetSpace
Confirma que reservas em espaços diferentes não interferem entre si. Mesmo que um espaço esteja reservado, outros espaços devem permanecer disponíveis para os mesmos horários.

---

### Executando os Testes

Para executar todos os testes do `BookingsService`, utilize o comando:

```bash
cd src/api.Tests
dotnet test --filter "BookingsServiceTests"
```

### Cobertura de Testes

Os testes do método `IsSpaceAvailable` cobrem:

- **Cenário positivo:** espaço disponível sem conflitos
- **Cenário negativo:** conflitos de horário (múltiplas variações)
- **Validações de negócio**: espaço inexistente, indisponível
- **Validações de dados:** datas inválidas
- **Casos limite:** reservas adjacentes, múltiplos espaços

Esta cobertura abrangente garante que o método funcione corretamente em todos os cenários possíveis, protegendo o sistema contra bugs e comportamentos inesperados
