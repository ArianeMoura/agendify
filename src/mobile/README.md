# Agendify Mobile (Expo / React Native)

Booking app for end users. Consumes the [Agendify API](../../README.md).

## Prerequisites

Node.js 20+, and an Android emulator, iOS simulator (Xcode), or the **Expo Go** app.

## Setup

```bash
npm ci
npx expo start     # press a (Android), i (iOS), or scan the QR with Expo Go
```

## Environment

| Variable | Purpose |
| :--- | :--- |
| `EXPO_PUBLIC_API_URL` | API base URL (default `http://localhost:5089`); per-profile values in [`eas.json`](eas.json) |

## Scripts

`start` · `android` · `ios` · `web` · `lint`

## Stack

Expo (~54) with expo-router, React Native 0.81, TypeScript, axios (token interceptors +
silent refresh), TanStack Query, react-hook-form + zod. Tokens are stored securely in
`expo-secure-store` (Keychain/Keystore).

## Build & distribution

Via **Expo EAS** (see [docs/DEPLOYMENT.md](../../docs/DEPLOYMENT.md)).
