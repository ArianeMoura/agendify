# Agendify Mobile (Expo / React Native)

Booking app for end users. Consumes the [Agendify API](../../README.md).

## Prerequisites

Node.js **≥ 20.19.4** (required by React Native 0.81; `.nvmrc` at the repo root pins the version —
run `nvm use`), and an Android emulator, iOS simulator (Xcode), or the **Expo Go** app.

## Setup

```bash
npm ci
npx expo start     # press a (Android), i (iOS), or scan the QR with Expo Go
```

## Environment

Copy [`.env.example`](.env.example) to `.env` (git-ignored) and adjust:

| Variable              | Purpose                                                                                      |
| :-------------------- | :------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL` | API base URL (default `http://localhost:5089`); per-profile values in [`eas.json`](eas.json) |

## Scripts

| Script                    | Purpose                               |
| :------------------------ | :------------------------------------ |
| `start`                   | Expo dev server                       |
| `android` / `ios` / `web` | Run on emulator / simulator / browser |
| `lint`                    | `expo lint`                           |
| `typecheck`               | `tsc --noEmit`                        |
| `test` / `test:watch`     | jest-expo + Testing Library           |
| `format` / `format:check` | Prettier                              |

CI runs lint, typecheck, format check and tests on every push touching `src/mobile/**`.

## Stack

Expo (~54) with expo-router, React Native 0.81, TypeScript, axios (token interceptors +
silent refresh), TanStack Query, react-hook-form + zod. Tokens are stored securely in
`expo-secure-store` (Keychain/Keystore).

- **Design system** — the same brand tokens as the admin, restated in `constants/theme.ts` (light +
  dark) and resolved through `useTheme()` (`lib/theme/`); fonts **Sora** + **Manrope**. See
  [Design System](../../docs/DESIGN-SYSTEM.md).
- **Components** — accessible library in `components/ui/` (Button, Input, Card, Badge, Toast,
  pickers, StarRating…), each with its own test.
- **Brand** — icon/wordmark/lockup in `components/brand/`, drawn with `react-native-svg` from the
  same 240×240 grid as the admin.
- **Layout** — responsive: safe-area insets, tablet/landscape breakpoints (`lib/theme/useResponsive`),
  virtualized lists, `expo-image`.

## Accessibility

Accessibility roles, labels and states across screens; touch targets ≥ 44 px; Dynamic Type respected.

## Tests

Screen tests live in [`__tests__/`](__tests__) mirroring `app/`; component tests sit next to each
component in `components/ui/`. Run with `npm test`.

## Build & distribution

Via **Expo EAS** (see [docs/DEPLOYMENT.md](../../docs/DEPLOYMENT.md)).
