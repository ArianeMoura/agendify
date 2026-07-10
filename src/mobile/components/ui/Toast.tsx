import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Portal } from '@gorhom/portal';
import Animated, {
  FadeInDown,
  FadeOutDown,
  useReducedMotion,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  spacing,
  borderRadius,
  typography,
  shadows,
  type ThemeColors,
} from '@/constants/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';

export type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  type?: ToastType;
  duration?: number;
}

interface ToastState {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  show: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DEFAULT_DURATION = 3000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(0);

  const clear = useCallback(() => {
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = null;
  }, []);

  const show = useCallback(
    (message: string, options?: ToastOptions) => {
      clear();
      nextId.current += 1;
      setToast({ id: nextId.current, message, type: options?.type ?? 'info' });
      timeout.current = setTimeout(
        () => setToast(null),
        options?.duration ?? DEFAULT_DURATION,
      );
    },
    [clear],
  );

  useEffect(() => clear, [clear]);

  const value = useMemo<ToastContextValue>(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Portal hostName="root">
          <ToastView key={toast.id} message={toast.message} type={toast.type} />
        </Portal>
      ) : null}
    </ToastContext.Provider>
  );
}

function ToastView({ message, type }: { message: string; type: ToastType }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { icon, tint } = toastVisual(type, colors);

  return (
    <Animated.View
      pointerEvents="none"
      entering={reduceMotion ? undefined : FadeInDown}
      exiting={reduceMotion ? undefined : FadeOutDown}
      style={[styles.wrapper, { bottom: insets.bottom + spacing.lg }]}
    >
      <View
        style={styles.toast}
        accessible
        accessibilityLiveRegion="assertive"
        accessibilityRole="alert"
        accessibilityLabel={message}
      >
        <Ionicons
          name={icon}
          size={20}
          color={tint}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <Text style={styles.message} numberOfLines={3}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

function toastVisual(
  type: ToastType,
  colors: ThemeColors,
): { icon: keyof typeof Ionicons.glyphMap; tint: string } {
  switch (type) {
    case 'success':
      return { icon: 'checkmark-circle', tint: colors.success };
    case 'error':
      return { icon: 'alert-circle', tint: colors.danger };
    case 'info':
    default:
      return { icon: 'information-circle', tint: colors.brandFg };
  }
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast deve ser usado dentro de <ToastProvider>');
  }
  return context;
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      position: 'absolute',
      left: spacing.lg,
      right: spacing.lg,
      alignItems: 'center',
    },
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      maxWidth: 520,
      width: '100%',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      ...shadows.lg,
    },
    message: {
      ...typography.bodySmall,
      color: colors.text,
      flex: 1,
    },
  });
