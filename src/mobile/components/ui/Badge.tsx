import { useMemo } from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import {
  spacing,
  borderRadius,
  fontFamily,
  type ThemeColors,
} from '@/constants/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';

export type BadgeTone =
  'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'alert';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  style?: ViewStyle;
  /** Rótulo acessível alternativo (por padrão usa o texto visível). */
  accessibilityLabel?: string;
}

/**
 * Pill de status no padrão do admin: fundo suave + texto em cor mais escura.
 * Comunica significado por texto (não só por cor) — bom para daltônicos/leitores.
 */
export function Badge({
  label,
  tone = 'neutral',
  style,
  accessibilityLabel,
}: BadgeProps) {
  const { colors } = useTheme();
  const { backgroundColor, textColor } = useMemo(
    () => toneColors(tone, colors),
    [tone, colors],
  );

  return (
    <View
      style={[styles.badge, { backgroundColor }, style]}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Text style={[styles.text, { color: textColor }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function toneColors(tone: BadgeTone, colors: ThemeColors) {
  switch (tone) {
    case 'brand':
      return {
        backgroundColor: colors.brand[50],
        textColor: colors.brand[700],
      };
    case 'success':
      return { backgroundColor: colors.successSoft, textColor: colors.success };
    case 'warning':
      return { backgroundColor: '#fff3cd', textColor: '#8a6100' };
    case 'danger':
      return { backgroundColor: '#fbe0e0', textColor: colors.danger };
    case 'alert':
      return { backgroundColor: colors.alertSoft, textColor: '#a83417' };
    case 'neutral':
    default:
      return {
        backgroundColor: colors.surfaceMuted,
        textColor: colors.inkMuted,
      };
  }
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 2,
    borderRadius: borderRadius.round,
  },
  text: {
    fontFamily: fontFamily.bodyMedium,
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 16,
  },
});
