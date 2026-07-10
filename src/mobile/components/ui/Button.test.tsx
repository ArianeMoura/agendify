import { renderWithTheme, screen, fireEvent } from '@/lib/theme/test-utils';
import { Button } from './Button';

describe('Button', () => {
  it('expõe papel de botão com nome acessível a partir do título', () => {
    renderWithTheme(<Button title="Entrar" />);
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeOnTheScreen();
  });

  it('permite sobrescrever o rótulo acessível', () => {
    renderWithTheme(
      <Button title="OK" accessibilityLabel="Confirmar reserva" />,
    );
    expect(
      screen.getByRole('button', { name: 'Confirmar reserva' }),
    ).toBeOnTheScreen();
  });

  it('dispara onPress ao ser tocado', () => {
    const onPress = jest.fn();
    renderWithTheme(<Button title="Salvar" onPress={onPress} />);
    fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('não dispara onPress quando desabilitado e reflete o estado', () => {
    const onPress = jest.fn();
    renderWithTheme(<Button title="Salvar" onPress={onPress} disabled />);
    const button = screen.getByRole('button', { name: 'Salvar' });
    expect(button).toBeDisabled();
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('sinaliza estado ocupado e bloqueia toque durante o loading', () => {
    const onPress = jest.fn();
    renderWithTheme(<Button title="Enviar" onPress={onPress} isLoading />);
    const button = screen.getByRole('button', { name: 'Enviar' });
    expect(button).toBeBusy();
    expect(button).toBeDisabled();
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});
