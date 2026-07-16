import { areSlotsContiguous } from './timeSlots';

describe('areSlotsContiguous', () => {
  it('aceita seleção vazia ou de um único slot', () => {
    expect(areSlotsContiguous([])).toBe(true);
    expect(areSlotsContiguous(['09:00'])).toBe(true);
  });

  it('aceita horários consecutivos', () => {
    expect(areSlotsContiguous(['09:00', '10:00', '11:00'])).toBe(true);
  });

  it('aceita horários consecutivos fora de ordem (a tela ordena depois)', () => {
    expect(areSlotsContiguous(['11:00', '09:00', '10:00'])).toBe(true);
  });

  // O caso que reservava silenciosamente o intervalo inteiro (09:00–15:00).
  it('rejeita seleção com buraco', () => {
    expect(areSlotsContiguous(['09:00', '14:00'])).toBe(false);
    expect(areSlotsContiguous(['09:00', '10:00', '14:00'])).toBe(false);
  });

  it('atravessa a virada de hora corretamente', () => {
    expect(areSlotsContiguous(['23:00', '00:00'])).toBe(false);
  });
});
