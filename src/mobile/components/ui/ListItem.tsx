import { useMemo, type ReactNode } from 'react';
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';

interface ListItemProps {
  title: string;
  subtitle?: string;
  /** Elemento à esquerda (ícone, avatar). Decorativo por padrão. */
  leading?: ReactNode;
  /** Elemento à direita. Se ausente e houver onPress, mostra um chevron. */
  trailing?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/**
 * Linha de lista consistente e acessível. Vira botão quando `onPress` é dado
 * (papel/estado corretos e alvo de toque ≥ 44px); caso contrário, é estática.
 */
export function ListItem({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  disabled = false,
  style,
  accessibilityLabel,
  accessibilityHint,
}: ListItemProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const content = (
    <>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ??
        (onPress ? (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.inkMuted}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        ) : null)}
    </>
  );

  if (!onPress) {
    return <View style={[styles.row, style]}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: 44,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surface,
    },
    pressed: {
      backgroundColor: colors.surfaceMuted,
    },
    disabled: {
      opacity: 0.5,
    },
    leading: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    body: {
      flex: 1,
    },
    title: {
      ...typography.body,
      color: colors.text,
    },
    subtitle: {
      ...typography.bodySmall,
      color: colors.textMuted,
      marginTop: 2,
    },
  });
