import { Text } from 'react-native';
import { renderWithTheme, screen } from '@/lib/theme/test-utils';
import { Card } from './Card';

describe('Card', () => {
  it('renderiza o conteúdo filho', () => {
    renderWithTheme(
      <Card>
        <Text>Conteúdo</Text>
      </Card>,
    );
    expect(screen.getByText('Conteúdo')).toBeOnTheScreen();
  });

  it('repassa props de acessibilidade', () => {
    renderWithTheme(
      <Card accessibilityLabel="Cartão de reserva">
        <Text>x</Text>
      </Card>,
    );
    expect(screen.getByLabelText('Cartão de reserva')).toBeOnTheScreen();
  });
});
