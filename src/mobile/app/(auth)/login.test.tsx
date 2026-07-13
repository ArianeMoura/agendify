import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react-native';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';

const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
}));

const mockLogin = jest.fn();
jest.mock('@/lib/api/auth', () => ({
  authApi: { login: (...args: unknown[]) => mockLogin(...args) },
}));

const mockSetAuthData = jest.fn();
jest.mock('@/lib/contexts/AuthContext', () => ({
  useAuth: () => ({ setAuthData: mockSetAuthData }),
}));

import LoginScreen from './login';

function renderScreen(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <QueryClientProvider client={client}>
        <ThemeProvider>{ui}</ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}

describe('Login flow', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockPush.mockClear();
    mockLogin.mockReset();
    mockSetAuthData.mockReset();
  });

  it('autentica e navega para as tabs em caso de sucesso', async () => {
    mockLogin.mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
      user: { id: '1', name: 'Ana', email: 'ana@x.com', role: 2 },
    });

    renderScreen(<LoginScreen />);

    fireEvent.changeText(screen.getByLabelText('Email'), 'ana@x.com');
    fireEvent.changeText(screen.getByLabelText('Senha'), 'senha123');
    fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));

    // Fluxo esperado: valida → chama a API → guarda a sessão → vai para as tabs.
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });
    expect(mockLogin).toHaveBeenCalled();
    expect(mockSetAuthData).toHaveBeenCalled();
  });

  it('leva ao aceite de convite ao tocar em "Aceitar"', () => {
    renderScreen(<LoginScreen />);
    fireEvent.press(screen.getByText('Aceitar'));
    expect(mockPush).toHaveBeenCalledWith('/(auth)/accept-invite');
  });
});
