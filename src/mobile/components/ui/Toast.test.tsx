import { Pressable, Text } from 'react-native';
import { PortalProvider } from '@gorhom/portal';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import { ToastProvider, useToast } from './Toast';

function Trigger({ duration }: { duration?: number }) {
  const { show } = useToast();
  return (
    <Pressable
      onPress={() => show('Reserva criada', { type: 'success', duration })}
    >
      <Text>disparar</Text>
    </Pressable>
  );
}

function renderToast(duration?: number) {
  // PortalProvider já provê o host "root" — não adicionamos outro (evita duplicar).
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <ThemeProvider>
        <PortalProvider>
          <ToastProvider>
            <Trigger duration={duration} />
          </ToastProvider>
        </PortalProvider>
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('Toast', () => {
  it('mostra a mensagem como alerta ao ser disparado', async () => {
    renderToast(100);
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.press(screen.getByText('disparar'));
    const alert = await screen.findByRole('alert', { name: 'Reserva criada' });
    expect(alert).toBeOnTheScreen();
  });

  it('remove o toast após a duração', async () => {
    renderToast(50);
    fireEvent.press(screen.getByText('disparar'));
    expect(await screen.findByRole('alert')).toBeOnTheScreen();
    // Avança o tempo real de forma determinística e deixa o efeito de remoção rodar.
    await act(() => new Promise((resolve) => setTimeout(resolve, 120)));
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
