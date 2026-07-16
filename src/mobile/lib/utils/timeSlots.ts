const SLOT_MINUTES = 60;

function toMinutes(slot: string): number {
  const [hours, minutes] = slot.split(':').map(Number);
  return hours * SLOT_MINUTES + minutes;
}

/**
 * A reserva é enviada como um único intervalo (primeiro slot -> último + 1h), então uma
 * seleção com buracos reserva silenciosamente o intervalo inteiro: tocar 09:00 e 14:00
 * criava uma reserva de 09:00 às 15:00, ocupando cinco horas que o usuário não escolheu.
 * Os slots são de 1h, logo a seleção só é contígua se cada horário for o anterior + 60min.
 */
export function areSlotsContiguous(slots: string[]): boolean {
  if (slots.length <= 1) return true;
  const sorted = [...slots].sort();
  return sorted.every(
    (slot, i) =>
      i === 0 || toMinutes(slot) - toMinutes(sorted[i - 1]) === SLOT_MINUTES,
  );
}
