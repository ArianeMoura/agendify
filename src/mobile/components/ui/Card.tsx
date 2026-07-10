import type { ReactNode } from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';
import { spacing, borderRadius, shadows } from '@/constants/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';

interface CardProps extends ViewProps {
  children: ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
}

export function Card({
  children,
  style,
  variant = 'elevated',
  ...rest
}: CardProps) {
  const { colors } = useTheme();

  const baseStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  };

  const variantStyle: ViewStyle =
    variant === 'elevated'
      ? { ...shadows.md, shadowColor: '#3e2380' }
      : variant === 'outlined'
        ? { borderWidth: 1, borderColor: colors.line }
        : {};

  return (
    <View style={[baseStyle, variantStyle, style]} {...rest}>
      {children}
    </View>
  );
}
