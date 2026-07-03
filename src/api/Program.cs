using System.Text;
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MongoDB.Driver;

var builder = WebApplication.CreateBuilder(args);


builder.Services.Configure<DatabaseSettings>(options =>
{
    options.ConnectionString = builder.Configuration["DatabaseSettings:ConnectionString"] ?? "";
    options.DatabaseName = builder.Configuration["DatabaseSettings:DatabaseName"] ?? "";
    options.UsersCollectionName = builder.Configuration["DatabaseSettings:UsersCollectionName"] ?? "";
    options.SpacesCollectionName = builder.Configuration["DatabaseSettings:SpacesCollectionName"] ?? "";
    options.ResourcesCollectionName = builder.Configuration["DatabaseSettings:ResourcesCollectionName"] ?? "";
    options.BookingsCollectionName = builder.Configuration["DatabaseSettings:BookingsCollectionName"] ?? "";
});

// Fail-fast: aborta o boot se os segredos não estiverem configurados
// (via User Secrets em Dev ou variáveis de ambiente DatabaseSettings__/JwtSettings__ em produção).
var connectionString = builder.Configuration["DatabaseSettings:ConnectionString"];
if (string.IsNullOrWhiteSpace(connectionString))
    throw new InvalidOperationException(
        "DatabaseSettings:ConnectionString não configurado. Rode 'dotnet user-secrets set \"DatabaseSettings:ConnectionString\" ...' (dev) ou defina a variável de ambiente DatabaseSettings__ConnectionString (prod).");

var databaseName = builder.Configuration["DatabaseSettings:DatabaseName"];

// IMongoClient/IMongoDatabase como singletons — o driver é thread-safe e gerencia
// o connection pool internamente; instanciar um MongoClient por service desperdiça pools.
builder.Services.AddSingleton<IMongoClient>(_ => new MongoClient(connectionString));
builder.Services.AddSingleton<IMongoDatabase>(sp =>
    sp.GetRequiredService<IMongoClient>().GetDatabase(databaseName));

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

builder.Services.AddAuthorization();

builder.Services.AddSingleton<UsersService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddSingleton<SpacesService>();
builder.Services.AddSingleton<ResourcesService>();
builder.Services.AddSingleton<BookingsService>();
builder.Services.AddSingleton<AnalyticsService>();
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
        var allowedOrigins = new List<string>
        {
            "http://localhost:5292",
            "https://agendify-web-efcneeeya4hkfse2.canadacentral-01.azurewebsites.net"
        };

        // Adicionar origens de produção a partir de variáveis de ambiente
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