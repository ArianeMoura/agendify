import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { PortalProvider, PortalHost } from '@gorhom/portal';
import { AuthProvider, useAuth } from '@/lib/contexts/AuthContext';
import { Loading } from '@/components/ui/Loading';
import { colors } from '@/constants/theme';

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
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup && segments[1] !== 'accept-invite') {
      // Exceção: um usuário logado que abre um deep link de convite
      // (agendify://accept-invite?token=...) deve chegar à tela de aceite em vez de
      // ser jogado para as tabs. O aceite cria uma nova conta e troca a sessão.
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, router, segments]);

  if (isLoading) {
    return <Loading message="Carregando..." />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerBackTitle: 'Voltar',
        
       
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="bookings/create"
        options={{
          title: 'Reservas',
        }}
      />
      <Stack.Screen
        name="bookings/edit/[id]"
        options={{
          title: 'Reservas',
        }}
      />
      <Stack.Screen
        name="spaces/create"
        options={{
          title: 'Espaços',
        }}
      />
      <Stack.Screen
        name="spaces/edit/[id]"
        options={{
          title: 'Editar Espaço',
        }}
      />
      <Stack.Screen
        name="profile/edit"
        options={{
          title: 'Perfil',
        }}
      />
      <Stack.Screen
        name="profile/change-password"
        options={{
          title: 'Alterar Senha',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PortalProvider>
          <RootLayoutNav />
          <StatusBar style="light" />
          <PortalHost name="root" />
        </PortalProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}




