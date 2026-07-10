import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  makeColors,
  type ColorSchemeName,
  type ThemeColors,
} from '@/constants/theme';

/** Preferência do usuário: seguir o sistema ou fixar claro/escuro. */
export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme-preference';

interface ThemeContextValue {
  /** Paleta ativa (já resolvida para o esquema efetivo). */
  colors: ThemeColors;
  /** Esquema efetivo em uso ('light' | 'dark'). */
  scheme: ColorSchemeName;
  /** Preferência escolhida pelo usuário ('light' | 'dark' | 'system'). */
  preference: ThemePreference;
  /** Atalho para scheme === 'dark'. */
  isDark: boolean;
  /** Define e persiste a preferência de tema. */
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveScheme(
  preference: ThemePreference,
  deviceScheme: ColorSchemeName,
): ColorSchemeName {
  if (preference === 'system') return deviceScheme;
  return preference;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // `useColorScheme` reage a mudanças do sistema em tempo real.
  const deviceScheme: ColorSchemeName =
    useColorScheme() === 'dark' ? 'dark' : 'light';
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  // Carrega a preferência persistida uma vez, na montagem.
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (
          active &&
          (stored === 'light' || stored === 'dark' || stored === 'system')
        ) {
          setPreferenceState(stored);
        }
      })
      .catch(() => {
        // Falha ao ler preferência não é fatal — segue com 'system'.
      });
    return () => {
      active = false;
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      // Persistência best-effort; a UI já reflete a escolha em memória.
    });
  }, []);

  const scheme = resolveScheme(preference, deviceScheme);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: makeColors(scheme),
      scheme,
      preference,
      isDark: scheme === 'dark',
      setPreference,
    }),
    [scheme, preference, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/** Hook de tema. Deve ser usado dentro de <ThemeProvider>. */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de <ThemeProvider>');
  }
  return context;
}
