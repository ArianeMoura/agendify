using System.Text;
using api.Data;
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);


builder.Services.Configure<DatabaseSettings>(options =>
{
    options.ConnectionString = builder.Configuration["DatabaseSettings:ConnectionString"] ?? "";
});

// Fail-fast: aborta o boot se os segredos não estiverem configurados
// (via User Secrets em Dev ou variáveis de ambiente DatabaseSettings__/JwtSettings__ em produção).
var connectionString = builder.Configuration["DatabaseSettings:ConnectionString"];
if (string.IsNullOrWhiteSpace(connectionString))
    throw new InvalidOperationException(
        "DatabaseSettings:ConnectionString não configurado. Rode 'dotnet user-secrets set \"DatabaseSettings:ConnectionString\" ...' (dev) ou defina a variável de ambiente DatabaseSettings__ConnectionString (prod).");

// PostgreSQL como fonte de verdade. O Npgsql gerencia o connection pool.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddLogging();

builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection("JwtSettings"));

var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>();

var jwtSecret = jwtSettings?.Secret;
if (string.IsNullOrWhiteSpace(jwtSecret) || jwtSecret.Length < 32)
    throw new InvalidOperationException(
        "JwtSettings:Secret ausente ou com menos de 32 caracteres. Configure via User Secrets (dev) ou JwtSettings__Secret (prod).");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings!.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret))
    };
});

builder.Services.AddAuthorization(options =>
{
    // Policy nomeada para endpoints exclusivos de gestor.
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Administrator"));
});

// Services que dependem do AppDbContext (scoped) precisam ser Scoped também.
builder.Services.AddScoped<UsersService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<SpacesService>();
builder.Services.AddScoped<ResourcesService>();
builder.Services.AddScoped<BookingsService>();
builder.Services.AddScoped<AnalyticsService>();
builder.Services.AddScoped<IdempotencyService>();
builder.Services.AddScoped<PrivacyService>();
builder.Services.AddScoped<ReviewsService>();
// FileUploadService só toca o filesystem — pode continuar Singleton.
builder.Services.AddSingleton<FileUploadService>();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });


builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Agendify API",
        Version = "v1",
        Description = "API para gerenciamento de reservas de espaços"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header usando o esquema Bearer. Ex.: Authorization: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowWebApp", policy =>
    {
        // Origens de dev padrão (Razor legado + Next.js admin). Sem host de
        // produção hardcoded — produção vem exclusivamente de CORS_ALLOWED_ORIGINS.
        var allowedOrigins = new List<string>
        {
            "http://localhost:5292",
            "http://localhost:3000"
        };

        var productionOrigins = Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS");
        if (!string.IsNullOrEmpty(productionOrigins))
        {
            allowedOrigins.AddRange(productionOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                                      .Select(o => o.Trim()));
        }

        policy.WithOrigins(allowedOrigins.ToArray())
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Em Development, aplica as migrações automaticamente (cria schema + a exclusion
// constraint). Em produção, rode `dotnet ef database update` no deploy/CI.
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.MapGet("/status", () => DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));

// Swagger/OpenAPI apenas em Development — não expor o schema da API em produção.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Agendify API v1");
    });
}

app.UseHttpsRedirection();

app.UseCors("AllowWebApp");


var uploadPath = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("WEBSITE_SITE_NAME"))
    ? Path.Combine("D:\\home", "uploads") 
    : Path.Combine(builder.Environment.ContentRootPath, "uploads"); 

if (!Directory.Exists(uploadPath))
{
    Directory.CreateDirectory(uploadPath);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadPath),
    RequestPath = "/uploads"
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();