import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  spacing,
  borderRadius,
  fontFamily,
  type ThemeColors,
} from '@/constants/theme';
import { useTheme, type ThemePreference } from '@/lib/theme/ThemeProvider';

const OPTIONS: {
  value: ThemePreference;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: 'light', label: 'Claro', icon: 'sunny-outline' },
  { value: 'system', label: 'Sistema', icon: 'phone-portrait-outline' },
  { value: 'dark', label: 'Escuro', icon: 'moon-outline' },
];

/**
 * Seletor de tema (claro/sistema/escuro), espelhando o toggle do admin.
 * É um radiogroup acessível: cada opção anuncia papel `radio` + estado selecionado.
 */
export function ThemeToggle() {
  const { colors, preference, setPreference } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View
      style={styles.group}
      accessibilityRole="radiogroup"
      accessibilityLabel="Tema do aplicativo"
    >
      {OPTIONS.map((option) => {
        const selected = preference === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => setPreference(option.value)}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            style={[styles.option, selected && styles.optionSelected]}
          >
            <Ionicons
              name={option.icon}
              size={18}
              color={selected ? colors.onPrimary : colors.inkMuted}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text
              style={[styles.label, selected && styles.labelSelected]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    group: {
      flexDirection: 'row',
      gap: spacing.xs,
      backgroundColor: colors.surfaceMuted,
      borderRadius: borderRadius.round,
      padding: spacing.xs,
    },
    option: {
      flex: 1,
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.round,
    },
    optionSelected: {
      backgroundColor: colors.primary,
    },
    label: {
      fontFamily: fontFamily.bodyMedium,
      fontWeight: '500',
      fontSize: 13,
      color: colors.inkMuted,
    },
    labelSelected: {
      color: colors.onPrimary,
    },
  });
