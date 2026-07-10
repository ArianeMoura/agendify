import type { ReactNode } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  type ViewStyle,
  type ScrollViewProps,
} from 'react-native';
import { useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';

interface ScreenProps {
  children: ReactNode;
  /** Rola o conteúdo (para telas maiores que a viewport). */
  scroll?: boolean;
  /** Aplica padding horizontal/vertical padrão ao conteúdo. */
  padded?: boolean;
  /** Envolve em KeyboardAvoidingView (telas com formulário). */
  keyboardAvoiding?: boolean;
  /** Bordas seguras a respeitar. Padrão: topo + laterais. */
  edges?: readonly Edge[];
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  /** Cor de fundo alternativa (padrão: canvas do tema). */
  backgroundColor?: string;
  scrollProps?: Omit<ScrollViewProps, 'contentContainerStyle'>;
}

/**
 * Wrapper base de tela: respeita a safe area por `insets` (não o SafeAreaView
 * legado), pinta o fundo com o token do tema e, opcionalmente, rola o conteúdo
 * e afasta o teclado. Substitui o padrão antigo espalhado pelas telas.
 */
export function Screen({
  children,
  scroll = false,
  padded = false,
  keyboardAvoiding = false,
  edges = ['top', 'left', 'right'],
  style,
  contentContainerStyle,
  backgroundColor,
  scrollProps,
}: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const safePadding: ViewStyle = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  const bg = backgroundColor ?? colors.background;
  const contentPadding = padded ? styles.padded : null;

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.grow,
        contentPadding,
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      {...scrollProps}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, contentPadding, contentContainerStyle]}>
      {children}
    </View>
  );

  const inner = (
    <View style={[styles.flex, safePadding, { backgroundColor: bg }, style]}>
      {body}
    </View>
  );

  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {inner}
      </KeyboardAvoidingView>
    );
  }

  return inner;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grow: { flexGrow: 1 },
  padded: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
});
