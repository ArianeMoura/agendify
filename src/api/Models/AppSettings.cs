namespace api.Models;

// Configuração da própria aplicação (seção "App").
public class AppSettings
{
    // Base pública do admin web, usada para montar os links que vão por e-mail
    // (ex.: redefinição de senha). Precisa ser alcançável por quem recebe o e-mail —
    // é o endereço que a pessoa abre no navegador.
    public string? BaseUrl { get; set; }
}
