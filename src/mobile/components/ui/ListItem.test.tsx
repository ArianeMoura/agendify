import { renderWithTheme, screen, fireEvent } from '@/lib/theme/test-utils';
import { ListItem } from './ListItem';

describe('ListItem', () => {
  it('vira botão acessível quando há onPress', () => {
    const onPress = jest.fn();
    renderWithTheme(
      <ListItem title="Sala 1" subtitle="Capacidade 10" onPress={onPress} />,
    );
    const item = screen.getByRole('button', { name: 'Sala 1' });
    fireEvent.press(item);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('não é botão quando é apenas informativo', () => {
    renderWithTheme(<ListItem title="Sala 2" />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Sala 2')).toBeOnTheScreen();
  });

  it('reflete estado desabilitado e não dispara onPress', () => {
    const onPress = jest.fn();
    renderWithTheme(<ListItem title="Sala 3" onPress={onPress} disabled />);
    const item = screen.getByRole('button', { name: 'Sala 3' });
    expect(item).toBeDisabled();
    fireEvent.press(item);
    expect(onPress).not.toHaveBeenCalled();
  });
});
