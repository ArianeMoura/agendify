import { renderWithTheme, screen } from '@/lib/theme/test-utils';
import { Loading } from './Loading';

describe('Loading', () => {
  it('expõe estado de progresso ocupado com rótulo padrão', () => {
    renderWithTheme(<Loading />);
    const region = screen.getByRole('progressbar', { name: 'Carregando' });
    expect(region).toBeBusy();
  });

  it('usa a mensagem como rótulo acessível quando fornecida', () => {
    renderWithTheme(<Loading message="Carregando reservas" />);
    expect(screen.getByLabelText('Carregando reservas')).toBeOnTheScreen();
  });
});
