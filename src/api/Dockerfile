# syntax=docker/dockerfile:1
# Build context: src/api (a API não tem project references externas).

# ---- build ----
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Restore em camada separada para aproveitar cache quando só o código muda.
COPY api.csproj .
RUN dotnet restore

COPY . .
RUN dotnet publish api.csproj -c Release -o /app /p:UseAppHost=false

# ---- runtime ----
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app .

# A plataforma (Fly/Render) termina o TLS na borda; o container serve HTTP.
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# Config obrigatória em runtime (fail-fast se faltar):
#   DatabaseSettings__ConnectionString, JwtSettings__Secret
#   ApplyMigrationsOnStartup=true  (aplica o schema no boot)
#   CORS_ALLOWED_ORIGINS=https://<admin>.vercel.app,...
ENTRYPOINT ["dotnet", "api.dll"]
