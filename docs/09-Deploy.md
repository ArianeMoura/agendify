# 09 · Deploy

Topologia de produção (barata, adequada a um produto mantido por uma pessoa):

| Componente | Serviço | Artefato |
|---|---|---|
| Banco (fonte de verdade) | **Neon** (PostgreSQL gerenciado) | — |
| API (.NET 9) | **Fly.io** (container) | `src/api/Dockerfile` + `src/api/fly.toml` |
| Admin (Next.js) | **Vercel** | `src/admin` |
| Mobile (Expo) | **EAS Build/Submit** | `src/mobile/eas.json` |

Alternativa à Fly: **Render** (mesmo Dockerfile). A imagem é agnóstica de plataforma.

---

## 1. Banco — Neon (PostgreSQL)

1. Crie um projeto em [neon.tech] (escolha uma região próxima; para residência de dados no Brasil, prefira uma região sul-americana quando disponível).
2. Copie a **connection string** (formato `postgresql://user:pass@host/db?sslmode=require`).
3. A criptografia em repouso e o TLS em trânsito já vêm habilitados no Neon.
4. **Menor privilégio:** crie um usuário de aplicação sem `SUPERUSER` para a API.

O schema e a **exclusion constraint** são aplicados automaticamente pela API no boot
(`ApplyMigrationsOnStartup=true`). Não é preciso rodar SQL à mão.

## 2. API — Fly.io

Pré-requisito: `flyctl` instalado e `fly auth login`.

```bash
cd src/api
fly launch --no-deploy          # cria o app a partir do fly.toml (região gru = São Paulo)

# Segredos (NÃO vão no fly.toml nem no git):
fly secrets set \
  DatabaseSettings__ConnectionString="postgresql://.../agendify?sslmode=require" \
  JwtSettings__Secret="$(openssl rand -base64 48)" \
  CORS_ALLOWED_ORIGINS="https://<seu-admin>.vercel.app"

fly deploy
```

Verificação: `curl https://agendify-api.fly.dev/status` → data/hora.

Notas:
- `force_https=true` — TLS termina na borda da Fly; o container serve HTTP na 8080.
- `min_machines_running=0` — escala a zero quando ocioso (custo baixo). Instância
  única evita corrida de migração no boot.
- A imagem foi validada localmente: sobe, migra e devolve **409** em sobreposição.

## 3. Admin — Vercel

Vercel detecta Next.js automaticamente. No projeto (dashboard ou `vercel` CLI):

1. **Root Directory:** `src/admin`.
2. **Environment Variable:** `NEXT_PUBLIC_API_URL = https://agendify-api.fly.dev`.
3. Deploy (push na `main` ou `vercel --prod`).

Depois de saber a URL do admin, atualize `CORS_ALLOWED_ORIGINS` da API (passo 2).

## 4. Mobile — EAS

Pré-requisito: `eas-cli` instalado e `eas login`.

```bash
cd src/mobile
eas build --profile production --platform android   # ou ios
eas submit --profile production --platform android
```

Os perfis em `eas.json` já injetam `EXPO_PUBLIC_API_URL` (aponte `preview`/`production`
para a URL da Fly). O perfil `development` usa `http://localhost:5089`.

---

## Ordem recomendada e checklist

1. Neon → obter connection string.
2. Fly → `fly secrets set` + `fly deploy`; validar `/status`.
3. Vercel → root `src/admin` + `NEXT_PUBLIC_API_URL`; validar login do gestor.
4. Atualizar `CORS_ALLOWED_ORIGINS` da API com a URL do admin.
5. EAS → build/submit apontando para a URL da API.

Segurança/LGPD antes de abrir ao público:
- [ ] `JwtSettings__Secret` forte e único (≥ 32 chars).
- [ ] Usuário do banco sem `SUPERUSER`.
- [ ] CORS restrito às origens reais (sem `*`).
- [ ] Endpoints LGPD (`/api/me/data-export`, `DELETE /api/me`) acessíveis ao titular.
- [ ] Rotacionar quaisquer credenciais que já tenham vazado (Atlas antigo).

[neon.tech]: https://neon.tech
