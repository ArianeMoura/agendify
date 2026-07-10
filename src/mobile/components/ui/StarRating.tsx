import { useMemo } from 'react';
import { View, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';

interface StarRatingProps {
  value: number;
  /** Quando fornecido, o componente é editável (toque nas estrelas). */
  onChange?: (value: number) => void;
  max?: number;
  size?: number;
  style?: ViewStyle;
}

/**
 * Avaliação por estrelas. Somente leitura por padrão; vira editável quando
 * `onChange` é fornecido. Acessível: em leitura anuncia "N de M estrelas";
 * editável, cada estrela é um botão com rótulo próprio.
 */
export function StarRating({
  value,
  onChange,
  max = 5,
  size = 24,
  style,
}: StarRatingProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const editable = typeof onChange === 'function';
  const stars = Array.from({ length: max }, (_, i) => i + 1);

  if (!editable) {
    return (
      <View
        style={[styles.row, style]}
        accessibilityRole="image"
        accessibilityLabel={`Avaliação: ${value} de ${max} estrelas`}
      >
        {stars.map((n) => (
          <Ionicons
            key={n}
            name={n <= value ? 'star' : 'star-outline'}
            size={size}
            color={n <= value ? colors.action : colors.inkMuted}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        ))}
      </View>
    );
  }

  return (
    <View
      style={[styles.row, style]}
      accessibilityRole="radiogroup"
      accessibilityLabel="Sua avaliação"
    >
      {stars.map((n) => (
        <Pressable
          key={n}
          onPress={() => onChange?.(n)}
          hitSlop={6}
          accessibilityRole="radio"
          accessibilityState={{ selected: n === value }}
          accessibilityLabel={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`}
          style={styles.star}
        >
          <Ionicons
            name={n <= value ? 'star' : 'star-outline'}
            size={size}
            color={n <= value ? colors.action : colors.inkMuted}
          />
        </Pressable>
      ))}
    </View>
  );
}

const createStyles = (_colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    star: {
      padding: spacing.xs,
      minHeight: 44,
      minWidth: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
