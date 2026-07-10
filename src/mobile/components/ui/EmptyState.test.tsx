import { renderWithTheme, screen, fireEvent } from '@/lib/theme/test-utils';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('expõe o título como cabeçalho e mostra a mensagem', () => {
    renderWithTheme(
      <EmptyState
        title="Sem reservas"
        message="Você ainda não reservou nada"
      />,
    );
    expect(
      screen.getByRole('header', { name: 'Sem reservas' }),
    ).toBeOnTheScreen();
    expect(screen.getByText('Você ainda não reservou nada')).toBeOnTheScreen();
  });

  it('renderiza a ação e dispara onAction', () => {
    const onAction = jest.fn();
    renderWithTheme(
      <EmptyState
        title="Vazio"
        message="Nada aqui"
        actionLabel="Criar reserva"
        onAction={onAction}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Criar reserva' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('omite a ação quando não há handler', () => {
    renderWithTheme(<EmptyState title="Vazio" message="Nada aqui" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
