import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'alert-circle-outline',
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Ionicons
        name={icon}
        size={64}
        color={colors.inkMuted}
        // Ícone é decorativo — o significado está no título/mensagem.
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} style={styles.button} />
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
      backgroundColor: colors.background,
    },
    title: {
      ...typography.h4,
      color: colors.text,
      marginTop: spacing.lg,
      textAlign: 'center',
    },
    message: {
      ...typography.body,
      color: colors.textMuted,
      marginTop: spacing.sm,
      textAlign: 'center',
    },
    button: {
      marginTop: spacing.lg,
    },
  });
