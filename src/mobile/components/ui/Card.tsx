import React, { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '@/constants/theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'elevated',
}) => {
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
    };

    const variantStyles: Record<string, ViewStyle> = {
      default: {},
      elevated: shadows.md,
      outlined: {
        borderWidth: 1,
        borderColor: colors.border,
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
    };
  };

  return <View style={[getCardStyle(), style]}>{children}</View>;
};

