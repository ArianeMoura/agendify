import { renderWithTheme, screen, fireEvent } from '@/lib/theme/test-utils';
import { StarRating } from './StarRating';

describe('StarRating', () => {
  it('somente leitura anuncia a nota como imagem', () => {
    renderWithTheme(<StarRating value={3} />);
    expect(
      screen.getByLabelText('Avaliação: 3 de 5 estrelas'),
    ).toBeOnTheScreen();
  });

  it('editável expõe um radiogroup de estrelas', () => {
    renderWithTheme(<StarRating value={0} onChange={jest.fn()} />);
    expect(screen.getByLabelText('Sua avaliação')).toBeOnTheScreen();
    expect(screen.getAllByRole('radio')).toHaveLength(5);
  });

  it('dispara onChange com a estrela tocada', () => {
    const onChange = jest.fn();
    renderWithTheme(<StarRating value={0} onChange={onChange} />);
    fireEvent.press(screen.getByRole('radio', { name: '4 estrelas' }));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('marca a estrela selecionada', () => {
    renderWithTheme(<StarRating value={2} onChange={jest.fn()} />);
    expect(screen.getByRole('radio', { name: '2 estrelas' })).toBeSelected();
  });
});
