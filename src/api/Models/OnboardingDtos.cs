using System.ComponentModel.DataAnnotations;

namespace api.Models;

// Self-signup de organização: cria o tenant e o seu primeiro OrgAdmin.
public class CreateOrganizationRequest
{
    [Required]
    public string OrganizationName { get; set; } = string.Empty;

    [Required]
    public string AdminName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string AdminEmail { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string AdminPassword { get; set; } = string.Empty;
}

// Resumo devolvido ao criar uma organização (o cliente faz login em seguida).
public class OrganizationCreatedResponse
{
    public string OrganizationId { get; set; } = string.Empty;
    public string OrganizationName { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string AdminUserId { get; set; } = string.Empty;
    public string AdminEmail { get; set; } = string.Empty;
}

// OrgAdmin convida alguém para o próprio tenant.
public class InviteRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public Role Role { get; set; }
}

// Resposta do convite. Sem serviço de e-mail ainda: o token bruto volta aqui para o
// OrgAdmin repassar ao convidado (e é registrado em audit_logs). Guardamos só o hash.
public class InviteCreatedResponse
{
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}

// Convidado aceita: define nome e senha; o usuário nasce no tenant do convite.
public class AcceptInvitationRequest
{
    [Required]
    public string Token { get; set; } = string.Empty;

    [Required]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;
}
