import { renderWithTheme, screen } from '@/lib/theme/test-utils';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('renderiza como placeholder', () => {
    const { toJSON } = renderWithTheme(<Skeleton width={120} height={20} />);
    expect(toJSON()).toBeTruthy();
  });

  it('é decorativo: não expõe elementos acessíveis', () => {
    renderWithTheme(<Skeleton />);
    expect(screen.queryByRole('image')).toBeNull();
    expect(screen.queryByRole('text')).toBeNull();
  });
});
