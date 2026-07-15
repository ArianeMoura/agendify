import { View, type StyleProp, type ViewStyle } from 'react-native';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AgendifyIcon } from './AgendifyIcon';
import { Wordmark } from './Wordmark';

interface LogoProps {
  /** horizontal: ícone + wordmark lado a lado · vertical: empilhado (splash/login) */
  orientation?: 'horizontal' | 'vertical';
  iconSize?: number;
  wordmarkFontSize?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Trava (lockup) da marca — ícone + wordmark, como no admin. No tema escuro o
 * ícone usa a variante "dark" (roxo claro), seguindo o guia de marca.
 */
export function Logo({
  orientation = 'horizontal',
  iconSize = 36,
  wordmarkFontSize = 24,
  style,
}: LogoProps) {
  const { isDark } = useTheme();
  const vertical = orientation === 'vertical';

  return (
    <View
      style={[
        {
          flexDirection: vertical ? 'column' : 'row',
          alignItems: 'center',
          gap: vertical ? spacing.md : spacing.sm,
        },
        style,
      ]}
    >
      <AgendifyIcon variant={isDark ? 'dark' : 'brand'} size={iconSize} />
      <Wordmark fontSize={wordmarkFontSize} />
    </View>
  );
}
