import { renderWithTheme, screen } from '@/lib/theme/test-utils';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renderiza o rótulo como texto acessível', () => {
    renderWithTheme(<Badge label="Reservado" tone="danger" />);
    const badge = screen.getByText('Reservado');
    expect(badge).toBeOnTheScreen();
  });

  it('usa rótulo acessível alternativo quando fornecido', () => {
    renderWithTheme(
      <Badge label="3" tone="brand" accessibilityLabel="3 reservas" />,
    );
    expect(screen.getByLabelText('3 reservas')).toBeOnTheScreen();
  });
});
