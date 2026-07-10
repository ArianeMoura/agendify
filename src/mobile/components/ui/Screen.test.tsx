import { Text } from 'react-native';
import { renderWithTheme, screen } from '@/lib/theme/test-utils';
import { Screen } from './Screen';

describe('Screen', () => {
  it('renderiza o conteúdo (modo estático)', () => {
    renderWithTheme(
      <Screen>
        <Text>Olá</Text>
      </Screen>,
    );
    expect(screen.getByText('Olá')).toBeOnTheScreen();
  });

  it('renderiza o conteúdo com rolagem quando scroll está ativo', () => {
    renderWithTheme(
      <Screen scroll padded keyboardAvoiding>
        <Text>Formulário</Text>
      </Screen>,
    );
    expect(screen.getByText('Formulário')).toBeOnTheScreen();
  });
});
