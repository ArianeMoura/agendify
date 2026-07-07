# Agendify Admin (Next.js)

Administrative web panel for Agendify. Consumes the [Agendify API](../../README.md).

## Prerequisites

Node.js 20+, and a running Agendify API (see the [root README](../../README.md)).

## Setup

```bash
npm ci
npm run dev     # http://localhost:3000
```

## Environment

| Variable              | Purpose                                                                               |
| :-------------------- | :------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL` | API base URL (default `http://localhost:5089`); set to the production API for deploys |

## Scripts

`dev` · `build` · `start` · `lint`

## Stack

Next.js (App Router), React 19, TypeScript, TanStack Query, Tailwind CSS v4. Auth tokens are
stored in `localStorage` with silent refresh on 401 (`lib/api.ts`, `lib/auth.tsx`).

## Deployment

Planned on **Vercel** (see [docs/DEPLOYMENT.md](../../docs/DEPLOYMENT.md)). The frontend
redesign will consume the [Design System](../../docs/DESIGN-SYSTEM.md).
