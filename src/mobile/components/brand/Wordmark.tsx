import { Text, type StyleProp, type TextStyle } from 'react-native';
import { fontFamily } from '@/constants/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';

interface WordmarkProps {
  fontSize?: number;
  style?: StyleProp<TextStyle>;
}

/**
 * Wordmark da marca — "agendify." em Sora ExtraBold (800), minúsculas, com o
 * ponto âmbar ("reserva feita, ponto final"). A cor do texto acompanha o tema;
 * o ponto é sempre âmbar. Mesmo desenho do componente do admin.
 */
export function Wordmark({ fontSize = 24, style }: WordmarkProps) {
  const { colors } = useTheme();

  return (
    <Text
      style={[
        {
          fontFamily: fontFamily.displayExtrabold,
          fontSize,
          letterSpacing: -0.02 * fontSize,
          color: colors.text,
        },
        style,
      ]}
    >
      agendify<Text style={{ color: colors.accent }}>.</Text>
    </Text>
  );
}
