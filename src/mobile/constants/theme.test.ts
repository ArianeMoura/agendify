import { makeColors, brand, lightColors, darkColors } from './theme';

describe('design tokens', () => {
  it('mantém a marca primária em #5E35B1 (paridade com o admin)', () => {
    expect(brand[600]).toBe('#5e35b1');
    expect(lightColors.primary).toBe('#5e35b1');
    expect(darkColors.primary).toBe('#5e35b1');
  });

  it('troca os semânticos entre claro e escuro', () => {
    expect(makeColors('light').background).toBe('#efecf6');
    expect(makeColors('dark').background).toBe('#141020');
    expect(makeColors('light').text).toBe('#14333e');
    expect(makeColors('dark').text).toBe('#f4f1fb');
  });

  it('clareia o texto de marca no escuro para contraste AA', () => {
    expect(makeColors('light').brandFg).toBe('#5e35b1');
    expect(makeColors('dark').brandFg).toBe('#b79af2');
  });
});
