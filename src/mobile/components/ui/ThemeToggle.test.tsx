import { renderWithTheme, screen, fireEvent } from '@/lib/theme/test-utils';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  it('renderiza um radiogroup com as três opções de tema', () => {
    renderWithTheme(<ThemeToggle />);
    expect(screen.getByLabelText('Tema do aplicativo')).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Claro' })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Sistema' })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Escuro' })).toBeOnTheScreen();
  });

  it('marca "Sistema" como selecionado por padrão', () => {
    renderWithTheme(<ThemeToggle />);
    expect(screen.getByRole('radio', { name: 'Sistema' })).toBeSelected();
  });

  it('seleciona outra opção ao tocar', () => {
    renderWithTheme(<ThemeToggle />);
    fireEvent.press(screen.getByRole('radio', { name: 'Escuro' }));
    expect(screen.getByRole('radio', { name: 'Escuro' })).toBeSelected();
  });
});
