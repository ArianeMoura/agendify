import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PortalProvider } from '@gorhom/portal';
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react-native';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'space-1', name: 'Sala Azul' }),
}));

const mockGetBySpace = jest.fn();
const mockCreate = jest.fn();
jest.mock('@/lib/api/reviews', () => ({
  reviewsApi: {
    getBySpace: (...a: unknown[]) => mockGetBySpace(...a),
    create: (...a: unknown[]) => mockCreate(...a),
  },
}));

import SpaceReviewsScreen from './reviews';

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
        <ThemeProvider>
          <PortalProvider>
            <ToastProvider>{ui}</ToastProvider>
          </PortalProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}

describe('Space reviews flow', () => {
  beforeEach(() => {
    mockGetBySpace.mockReset();
    mockCreate.mockReset();
  });

  it('mostra o estado vazio quando o espaço não tem avaliações', async () => {
    mockGetBySpace.mockResolvedValue([]);
    renderScreen(<SpaceReviewsScreen />);
    expect(await screen.findByText('Ainda sem avaliações')).toBeOnTheScreen();
  });

  it('valida a nota e envia a avaliação para a API', async () => {
    mockGetBySpace.mockResolvedValue([]);
    mockCreate.mockResolvedValue({
      id: 'r1',
      userId: 'u1',
      spaceId: 'space-1',
      rating: 4,
      createdAt: new Date(0).toISOString(),
    });

    renderScreen(<SpaceReviewsScreen />);
    await screen.findByText('Ainda sem avaliações');

    // Sem nota: mostra erro e não chama a API.
    fireEvent.press(screen.getByRole('button', { name: 'Enviar avaliação' }));
    expect(
      await screen.findByText('Selecione de 1 a 5 estrelas.'),
    ).toBeOnTheScreen();
    expect(mockCreate).not.toHaveBeenCalled();

    // Escolhe 4 estrelas e envia.
    fireEvent.press(screen.getByRole('radio', { name: '4 estrelas' }));
    fireEvent.press(screen.getByRole('button', { name: 'Enviar avaliação' }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });
    // react-query v5 passa (variables, context) — validamos as variáveis (1º arg).
    expect(mockCreate.mock.calls[0][0]).toEqual(
      expect.objectContaining({ spaceId: 'space-1', rating: 4 }),
    );
  });
});
