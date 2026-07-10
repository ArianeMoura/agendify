import { renderWithTheme, screen, fireEvent } from '@/lib/theme/test-utils';
import type { TimeSlot } from '@/lib/types';
import { TimeSlotPicker } from './TimeSlotPicker';

const slot = (over: Partial<TimeSlot>): TimeSlot => ({
  startTime: '08:00',
  endTime: '09:00',
  isAvailable: true,
  isPast: false,
  isBooked: false,
  ...over,
});

describe('TimeSlotPicker', () => {
  it('mostra estado vazio quando não há horários', () => {
    renderWithTheme(
      <TimeSlotPicker
        timeSlots={[]}
        selectedSlots={[]}
        onSelectSlot={jest.fn()}
      />,
    );
    expect(
      screen.getByText('Nenhum horário disponível para este espaço.'),
    ).toBeOnTheScreen();
  });

  it('expõe cada horário como checkbox e reflete a seleção', () => {
    renderWithTheme(
      <TimeSlotPicker
        timeSlots={[slot({ startTime: '08:00', endTime: '09:00' })]}
        selectedSlots={['08:00']}
        onSelectSlot={jest.fn()}
      />,
    );
    const checkbox = screen.getByRole('checkbox', { name: '08:00 às 09:00' });
    expect(checkbox).toBeChecked();
  });

  it('dispara onSelectSlot ao tocar num horário disponível', () => {
    const onSelectSlot = jest.fn();
    renderWithTheme(
      <TimeSlotPicker
        timeSlots={[slot({ startTime: '10:00', endTime: '11:00' })]}
        selectedSlots={[]}
        onSelectSlot={onSelectSlot}
      />,
    );
    fireEvent.press(screen.getByRole('checkbox', { name: '10:00 às 11:00' }));
    expect(onSelectSlot).toHaveBeenCalledWith('10:00');
  });

  it('desabilita horários reservados para não-admin e não dispara seleção', () => {
    const onSelectSlot = jest.fn();
    renderWithTheme(
      <TimeSlotPicker
        timeSlots={[
          slot({ startTime: '12:00', endTime: '13:00', isBooked: true }),
        ]}
        selectedSlots={[]}
        onSelectSlot={onSelectSlot}
        isUser={false}
      />,
    );
    const checkbox = screen.getByRole('checkbox', {
      name: '12:00 às 13:00, Reservado',
    });
    expect(checkbox).toBeDisabled();
    fireEvent.press(checkbox);
    expect(onSelectSlot).not.toHaveBeenCalled();
  });
});
