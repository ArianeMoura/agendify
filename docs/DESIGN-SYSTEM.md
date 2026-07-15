# Design System

Brand foundations for Agendify — the source of truth for logo, colour, and typography across web and
mobile. **Both clients implement this system:** the admin panel keeps its tokens in
`src/admin/app/globals.css` (`@theme`), its brand marks in `src/admin/components/brand/` and generated
icons in `src/admin/public/`; the mobile app mirrors the same tokens in `src/mobile/constants/theme.ts`
and the same marks in `src/mobile/components/brand/` (built with `react-native-svg`).

## Brand concept

The name **Agendify** fuses "Agenda" with the suffix "-ify" — the act of organizing, scheduling,
and simplifying. The mark is a **rounded square (the space)** with an **amber seal + check (the
confirmed booking)** — the slot you secure. Its focal point is the **check (✓)**: confirmation,
success, and the feeling of "It's booked!".

## Brand palette

![Agendify — Brand Palette](img/brand-palette.png)

| Token | Hex | Usage |
| :--- | :--- | :--- |
| Roxo primário | `#5E35B1` | Primary · brand · CTA (light) |
| Roxo escuro | `#3F2380` | Hover / pressed · sidebar |
| Roxo claro | `#7E55D2` | Support · dark-theme accent |
| Âmbar | `#FFB300` | Action · availability · slot · selection |
| Âmbar hover | `#FFC233` | Amber hover |
| Coral | `#FF7043` | Attention · conflict · blocked |
| Petróleo | `#14333E` | Text (never pure black) |
| Petróleo suave | `#5A6870` | Secondary text |
| Canvas | `#EFECF6` | Page background (light) |
| Superfície | `#FBFAFE` | Cards / surfaces (light) |
| Escuro base | `#141020` / `#1E1830` | Dark background / surface |

### Colour psychology & purpose

- **Purple (primary).** Modernity, creativity, and trust; a professional, sophisticated tone
  appropriate to a management platform. It carries the brand identity and unifies web and app.
- **Amber / coral (accent).** Warm colours for calls-to-action, alerts, and confirmations. Amber
  signals optimism, attention, and success (the "check!"); coral adds energy and flags conflict
  or a blocked slot. Amber guides the user toward confirm buttons and selected dates.
- **Neutrals (Canvas / Surface / Petróleo).** Light grounds for contrast and legibility; text
  uses Petróleo `#14333E` rather than pure black to soften the page while keeping AA contrast.

**Golden rule:** purple = trust/management · amber = action & availability · coral = attention ·
petrol = text. **Amber always pairs with petrol text (`#14333E`), never white.**

## Design tokens (as implemented)

Reference implementation: `src/admin/app/globals.css` via Tailwind v4 `@theme inline`. Semantic tokens
point to runtime CSS variables and **flip by theme**; the brand scale is static in both themes.
Theme switching is class-based (`.dark`, driven by `next-themes`).

The mobile app can't consume CSS, so it restates the same values in `src/mobile/constants/theme.ts`
(covered by `theme.test.ts`) and flips them through `useTheme()` — the token *names* and *values* are
the contract between the two; keep them in sync when either side changes.

### Brand scale (static)

| Step | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
| :--- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| Hex | `#F3EEFB` | `#E4D8F5` | `#C9B2EC` | `#AD8BE2` | `#8A5FD4` | `#6E44C0` | `#5E35B1` | `#4E2A99` | `#3F2380` | `#2E1A5E` |

`brand` = `#5E35B1` (600) · `brand-soft` = `#7E55D2`.

### Action & status (static)

| Token | Hex | Usage |
| :--- | :--- | :--- |
| `action` / `action-hover` | `#FFB300` / `#FFC233` | Amber CTA / hover |
| `on-action` | `#14333E` | Text/icon on amber |
| `alert` (+ soft) | `#FF7043` / `#FFD7CB` | Conflict / attention |
| `success` | `#2E7D32` | Success state |
| `danger` | `#DC2626` | Destructive (delete) |
| `warning` / `info` | `#FFB300` / `#5E35B1` | Warning / info |

### Semantic neutrals (theme-aware)

| Token | Light | Dark |
| :--- | :--- | :--- |
| `canvas` | `#EFECF6` | `#141020` |
| `surface` | `#FBFAFE` | `#1E1830` |
| `surface-muted` | `#F2EEFB` | `#251C3D` |
| `line` | `#ECE7F6` | `#2E2646` |
| `ink` | `#14333E` | `#F4F1FB` |
| `ink-muted` | `#5A6870` | `#B0A8C8` |
| `brand-fg` / `ring` | `#5E35B1` / `#7E55D2` | `#B79AF2` |

Dark uses `#7E55D2`/`#B79AF2` for purple to keep AA contrast on `#1E1830`.

### Radius · shadow · spacing

- **Radius:** `sm` 8px (controls) · `md` 10px · `lg` 12px (cards) · `xl` 16px · `full` 99px (pills).
- **Shadow:** `sm` / `md` / `lg` — soft, slightly purple-tinted elevation.
- **Spacing:** 4 / 8 / 16 / 24 / 32 / 48 scale (Tailwind spacing).

## Typography

- **Sora** (600/700/800) — brand, headings, and highlight numbers (KPIs). A geometric display face
  that builds hierarchy and carries the modern identity. Exposed as `--font-sora`.
- **Manrope** (400–800) — body copy, UI, tables, and running text. The default for all UI text.
  Exposed as `--font-manrope`.

Both are on Google Fonts (SIL Open Font License) and **self-hosted through `next/font`** in the
admin (no external request, no layout shift).

**Web scale (suggested):** H1 30 · H2 19 · H3 15–17 · body 13–14 · label 11–12 · caption 10–11.

## Logo, icon & favicon

<img src="img/agendify-icon.png" alt="Agendify icon" width="146" height="146" />

Brand marks are **SVG components** — `src/admin/components/brand/` (plain SVG) and
`src/mobile/components/brand/` (same drawing via `react-native-svg`), with the same props and the same
240×240 grid. Static assets live in `src/admin/public/`, generated reproducibly by
`src/admin/scripts/generate-icons.mjs` with `sharp`.

| Asset | Where | When |
| :--- | :--- | :--- |
| Icon — brand / dark / mono | `components/brand/AgendifyIcon.tsx` (admin & mobile), `src/admin/public/icon.svg` | App icon; dark for dark grounds; mono for 1-colour |
| Favicon (simplified, no notch) | `src/admin/public/favicon.svg`, `favicon.ico` (16/32/48) | Browser tab; use simplified below 32px |
| Wordmark (`agendify` + amber dot) | `components/brand/Wordmark.tsx` (admin & mobile) | Sora ExtraBold, lowercase, tracking `-0.02em` |
| Lockup (horizontal / vertical) | `components/brand/Logo.tsx` (admin & mobile) | Navbar / login & splash |
| PWA icons | `src/admin/public/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`, `site.webmanifest` | Install / home screen |

**Clear space:** keep margin around the mark equal to the height of the amber seal. On dark grounds,
use the dark icon variant (light-purple square). Do not distort, recolour, rotate, or add shadow.

## Related

- [Projeto de Interface](04-Projeto%20de%20Interface.md) — wireframes and flows that apply this system.
- [`src/admin/README.md`](../src/admin/README.md) — how the admin implements this system.
- [`src/mobile/README.md`](../src/mobile/README.md) — how the mobile app implements this system.
