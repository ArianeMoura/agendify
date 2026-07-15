using System.ComponentModel.DataAnnotations;

namespace api.Models;

// Corpo aceito em POST /api/resources. Sem TenantId: ver a nota em BookingDtos.cs.
public class CreateResourceRequest
{
    [Required]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }
}

// Corpo aceito em PUT /api/resources — o id vem no corpo, não na rota.
public class UpdateResourceRequest
{
    [Required]
    public string Id { get; set; } = string.Empty;

    [Required]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }
}
