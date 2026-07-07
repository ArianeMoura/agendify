# Design System

Brand foundations for Agendify — the source of truth for logo, colour, and typography across
web and mobile, feeding the frontend redesign.

## Brand concept

The name **Agendify** fuses "Agenda" with the suffix "-ify" — the act of organizing, scheduling,
and simplifying. The mark is a stylized **calendar** in clean, modern lines (organization,
planning, time), shaped as an app icon for visual consistency between web and mobile. Its focal
point is the **yellow check (✓)** at the centre: confirmation, success, and the feeling of
"It's booked!".

## Brand palette

![Agendify — Brand Palette](img/brand-palette.png)

| Token | Hex | Usage |
| :--- | :--- | :--- |
| Roxo primário | `#5E35B1` | Primary · brand · CTA (light) |
| Roxo claro | `#7E55D2` | Support · dark-theme accent |
| Âmbar | `#FFB300` | Action · availability · slot |
| Coral | `#FF7043` | Attention · conflict · blocked |
| Petróleo | `#14333E` | Text (never pure black) |
| Canvas | `#EFECF6` | Background |
| Superfície | `#FBFAFE` | Surface |
| Escuro base | `#141020` | Dark base |

### Colour psychology & purpose

- **Purple (primary).** Modernity, creativity, and trust; a professional, sophisticated tone
  appropriate to a management platform. It carries the brand identity and unifies web and app.
- **Amber / coral (accent).** Warm colours for calls-to-action, alerts, and confirmations. Amber
  signals optimism, attention, and success (the "check!"); coral adds energy and flags conflict
  or a blocked slot. Amber guides the user toward confirm buttons and selected dates.
- **Neutrals (Canvas / Surface / Petróleo).** Light grounds for contrast and legibility; text
  uses Petróleo `#14333E` rather than pure black to soften the page while keeping AA contrast.

The balance between the cool purple and the warm amber/coral yields an interface that is at once
serious and inviting.

## Typography

- **Sora** (700/800) — brand, headings, and highlight numbers (KPIs). A geometric display face
  that builds hierarchy and carries the modern identity. Loaded via `next/font` (self-hosted).
- **Manrope** (400–800) — body copy, UI, tables, and running text. Designed for screens, with
  excellent legibility across sizes. The default for all UI text.

Both are on Google Fonts (SIL Open Font License) and self-hosted through `next/font` in the admin
(no external request, no layout shift).

## Logo usage

Logo lockups (light/dark, horizontal/vertical) live in `docs/img/`. Use the dark-text lockup on
Canvas/Surface and the light lockup on Escuro base. Keep clear space around the mark equal to the
height of the check badge.

## Related

- [Projeto de Interface](04-Projeto%20de%20Interface.md) — wireframes and flows that apply this system.
