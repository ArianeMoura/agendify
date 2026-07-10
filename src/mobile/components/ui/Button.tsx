import { useMemo } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  type PressableProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import {
  spacing,
  borderRadius,
  fontFamily,
  type ThemeColors,
} from '@/constants/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

// Alvo de toque mínimo acessível (WCAG 2.5.5 / HIG). O tamanho `small` reduz o
// padding vertical, então garantimos o mínimo por `minHeight`.
const MIN_TOUCH_TARGET = 44;

const SIZE_PADDING: Record<ButtonSize, ViewStyle> = {
  small: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  medium: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  large: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
};

const SIZE_FONT: Record<ButtonSize, number> = {
  small: 14,
  medium: 16,
  large: 18,
};

export function Button({
  title,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  fullWidth = false,
  disabled = false,
  style,
  accessibilityLabel,
  accessibilityHint,
  ...rest
}: ButtonProps) {
  const { colors } = useTheme();

  const { backgroundColor, borderColor, textColor } = useMemo(
    () => variantColors(variant, colors),
    [variant, colors],
  );

  const isDisabled = disabled || isLoading;

  const containerStyle: ViewStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: borderRadius.sm,
    backgroundColor,
    ...(borderColor ? { borderWidth: 2, borderColor } : null),
    ...SIZE_PADDING[size],
    ...(fullWidth ? { width: '100%' } : null),
  };

  const labelStyle: TextStyle = {
    fontFamily: fontFamily.bodySemibold,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: SIZE_FONT[size],
    color: textColor,
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        containerStyle,
        (pressed || isDisabled) && styles.dimmed,
        style,
      ]}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text style={labelStyle} numberOfLines={1}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

function variantColors(variant: ButtonVariant, colors: ThemeColors) {
  switch (variant) {
    case 'secondary':
      // Âmbar da marca: texto sempre teal (onAction), nunca branco.
      return {
        backgroundColor: colors.action,
        borderColor: undefined,
        textColor: colors.onAction,
      };
    case 'outline':
      return {
        backgroundColor: 'transparent',
        borderColor: colors.primary,
        textColor: colors.brandFg,
      };
    case 'danger':
      return {
        backgroundColor: colors.danger,
        borderColor: undefined,
        textColor: '#ffffff',
      };
    case 'success':
      return {
        backgroundColor: colors.success,
        borderColor: undefined,
        textColor: '#ffffff',
      };
    case 'primary':
    default:
      return {
        backgroundColor: colors.primary,
        borderColor: undefined,
        textColor: colors.onPrimary,
      };
  }
}

const styles = StyleSheet.create({
  dimmed: { opacity: 0.6 },
});
