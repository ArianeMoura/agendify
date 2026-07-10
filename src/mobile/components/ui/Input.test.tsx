import { renderWithTheme, screen } from '@/lib/theme/test-utils';
import { Input } from './Input';

describe('Input', () => {
  it('associa a label ao campo como nome acessível', () => {
    renderWithTheme(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeOnTheScreen();
  });

  it('anuncia a mensagem de erro por uma região viva (não só cor)', () => {
    renderWithTheme(<Input label="Senha" error="Senha obrigatória" />);
    const error = screen.getByRole('alert');
    expect(error).toHaveTextContent('Senha obrigatória');
  });

  it('não renderiza alerta quando não há erro', () => {
    renderWithTheme(<Input label="Email" />);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
