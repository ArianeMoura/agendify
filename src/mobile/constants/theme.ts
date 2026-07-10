/**
 * Design tokens do Agendify (mobile) — espelham o design system do painel admin
 * (`src/admin/app/globals.css`) para que web e mobile pareçam o mesmo produto.
 *
 * Estrutura:
 *  - `brand`  — escala de tons roxa, ESTÁTICA (idêntica em claro e escuro).
 *  - `status` — acento âmbar/coral + cores semânticas de status, ESTÁTICAS.
 *  - `lightSemantic` / `darkSemantic` — tokens que TROCAM por tema.
 *  - `makeColors(scheme)` — monta a paleta ativa (o que o `useTheme()` consome).
 *  - `spacing` / `borderRadius` / `typography` / `shadows` — tokens independentes de tema.
 *
 * Componentes devem consumir cor via `useTheme()`, não importando valores fixos.
 * O objeto legado `colors` (minúsculo) permanece temporariamente para as telas ainda
 * não migradas e será removido quando todas consumirem o hook.
 */

// ---------------------------------------------------------------------------
// Escala da marca — estática (mesma nos dois temas), igual ao admin
// ---------------------------------------------------------------------------
export const brand = {
  50: '#f3eefb',
  100: '#e4d8f5',
  200: '#c9b2ec',
  300: '#ad8be2',
  400: '#8a5fd4',
  500: '#6e44c0',
  600: '#5e35b1', // primary
  700: '#4e2a99', // hover
  800: '#3f2380', // active / brand-dark
  900: '#2e1a5e',
  soft: '#7e55d2',
} as const;

// ---------------------------------------------------------------------------
// Acento fixo + status semânticos — estáticos nos dois temas
// (texto sobre `action` é sempre `onAction` — teal, nunca branco)
// ---------------------------------------------------------------------------
export const status = {
  action: '#ffb300',
  actionHover: '#ffc233',
  onAction: '#14333e',
  alert: '#ff7043',
  alertSoft: '#ffd7cb',
  success: '#2e7d32',
  successSoft: '#d7efd9',
  danger: '#dc2626',
  warning: '#ffb300',
  info: '#5e35b1',
} as const;

// ---------------------------------------------------------------------------
// Tokens semânticos — trocam por tema (o que o useTheme() alterna)
// ---------------------------------------------------------------------------
export const lightSemantic = {
  canvas: '#efecf6',
  surface: '#fbfafe',
  surfaceMuted: '#f2eefb',
  line: '#ece7f6',
  ink: '#14333e',
  inkMuted: '#5a6870',
  brandFg: '#5e35b1',
  ring: '#7e55d2',
} as const;

export const darkSemantic = {
  canvas: '#141020',
  surface: '#1e1830',
  surfaceMuted: '#251c3d',
  line: '#2e2646',
  ink: '#f4f1fb',
  inkMuted: '#b0a8c8',
  brandFg: '#b79af2',
  ring: '#b79af2',
} as const;

export type ColorSchemeName = 'light' | 'dark';

/**
 * Monta a paleta ativa para um esquema. Combina a escala da marca + status
 * (estáticos) com os semânticos do tema, expondo também aliases convenientes
 * (`primary`, `text`, `background`, `border`, ...) usados pelos componentes.
 */
export function makeColors(scheme: ColorSchemeName) {
  const semantic = scheme === 'dark' ? darkSemantic : lightSemantic;
  return {
    scheme,
    brand,
    ...status,
    ...semantic,

    // Aliases de marca
    primary: brand[600],
    primaryHover: brand[700],
    primaryActive: brand[800],
    onPrimary: '#ffffff',

    // Aliases de texto/superfície (semânticos)
    text: semantic.ink,
    textMuted: semantic.inkMuted,
    background: semantic.canvas,
    border: semantic.line,
    // `surface` e `surfaceMuted` já vêm do spread de `semantic`

    // Aliases de compatibilidade para as telas em migração (nomes antigos da
    // paleta plana → tokens semânticos do tema). Preferir os nomes semânticos
    // em código novo.
    white: semantic.surface,
    lightGray: semantic.surfaceMuted,
    gray: semantic.inkMuted,
    textSecondary: semantic.inkMuted,
    textLight: semantic.inkMuted,
    accent: status.action,
    accentOrange: status.alert,
    secondary: brand.soft,
    dark: semantic.ink,
  };
}

export const lightColors = makeColors('light');
export const darkColors = makeColors('dark');

/** Paleta ativa exposta pelo useTheme(). */
export type ThemeColors = ReturnType<typeof makeColors>;

// ---------------------------------------------------------------------------
// Famílias tipográficas da marca (registradas via expo-font — ver app/_layout)
// Sora → display/headings · Manrope → UI/corpo
// ---------------------------------------------------------------------------
export const fontFamily = {
  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodySemibold: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
  display: 'Sora_600SemiBold',
  displayBold: 'Sora_700Bold',
  displayExtrabold: 'Sora_800ExtraBold',
} as const;

// ---------------------------------------------------------------------------
// Espaçamento / raio / tipografia / sombras — independentes de tema
// ---------------------------------------------------------------------------
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  round: 999,
} as const;

export const typography = {
  h1: {
    fontFamily: fontFamily.displayBold,
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontFamily: fontFamily.displayBold,
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
  },
  h3: {
    fontFamily: fontFamily.display,
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h4: {
    fontFamily: fontFamily.display,
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h5: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
} as const;

// Sombras soft com leve tom roxo (iOS shadow* + Android elevation), como no admin.
export const shadows = {
  sm: {
    shadowColor: '#14333e',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#3e2380',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  lg: {
    shadowColor: '#3e2380',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
  },
} as const;

// ---------------------------------------------------------------------------
// LEGADO — paleta plana usada pelas telas ainda não migradas para useTheme().
// Será removida quando toda a UI consumir o hook de tema. Não use em código novo.
// ---------------------------------------------------------------------------
export const colors = {
  primary: '#5E35B1',
  secondary: '#7E55D2',
  accent: '#FFB300',
  accentOrange: '#FF7043',
  background: '#EAEAEA',
  white: '#FFFFFF',
  dark: '#212529',
  gray: '#6C757D',
  lightGray: '#F8F9FA',
  border: '#DEE2E6',
  success: '#28A745',
  danger: '#DC3545',
  warning: '#FFC107',
  info: '#17A2B8',
  text: '#212529',
  textSecondary: '#6C757D',
  textLight: '#ADB5BD',
};
