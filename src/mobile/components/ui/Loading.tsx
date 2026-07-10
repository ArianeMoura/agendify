import { useMemo } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  type ViewStyle,
} from 'react-native';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';

interface LoadingProps {
  message?: string;
  style?: ViewStyle;
}

export function Loading({ message, style }: LoadingProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View
      style={[styles.container, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={message ?? 'Carregando'}
      accessibilityState={{ busy: true }}
      accessibilityLiveRegion="polite"
    >
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    message: {
      ...typography.body,
      color: colors.textMuted,
      marginTop: spacing.md,
    },
  });
