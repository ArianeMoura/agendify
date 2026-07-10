import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import { PortalProvider } from '@gorhom/portal';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import {
  Sora_600SemiBold,
  Sora_700Bold,
  Sora_800ExtraBold,
} from '@expo-google-fonts/sora';
import { AuthProvider, useAuth } from '@/lib/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/lib/theme/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';

// Mantém o splash nativo até fontes da marca + sessão estarem prontas,
// evitando um "flash" de fonte do sistema antes do Sora/Manrope carregar.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignorado: em alguns ambientes (ex.: web) o splash pode já ter sumido.
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
  });

  const ready = (fontsLoaded || !!fontError) && !isLoading;

  // Esconde o splash nativo assim que fontes + sessão estiverem prontas.
  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (
      isAuthenticated &&
      inAuthGroup &&
      segments[1] !== 'accept-invite'
    ) {
      // Exceção: um usuário logado que abre um deep link de convite
      // (agendify://accept-invite?token=...) deve chegar à tela de aceite em vez de
      // ser jogado para as tabs. O aceite cria uma nova conta e troca a sessão.
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, router, segments]);

  // Enquanto fontes/sessão carregam, o splash nativo permanece visível.
  if (!ready) {
    return null;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.onPrimary,
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerBackTitle: 'Voltar',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="bookings/create" options={{ title: 'Reservas' }} />
        <Stack.Screen
          name="bookings/edit/[id]"
          options={{ title: 'Reservas' }}
        />
        <Stack.Screen name="spaces/create" options={{ title: 'Espaços' }} />
        <Stack.Screen
          name="spaces/edit/[id]"
          options={{ title: 'Editar Espaço' }}
        />
        <Stack.Screen name="profile/edit" options={{ title: 'Perfil' }} />
        <Stack.Screen
          name="profile/change-password"
          options={{ title: 'Alterar Senha' }}
        />
      </Stack>
      {/* Header da marca é roxo nos dois temas → conteúdo claro na status bar. */}
      <StatusBar style="light" backgroundColor={colors.primary} />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            {/* PortalProvider já provê um host "root" (usado por Toast e popovers). */}
            <PortalProvider>
              <ToastProvider>
                <RootLayoutNav />
              </ToastProvider>
            </PortalProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
